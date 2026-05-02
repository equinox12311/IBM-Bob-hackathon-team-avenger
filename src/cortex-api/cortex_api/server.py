"""FastAPI app exposing REST / SSE endpoints — port 8080."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

from cortex_api import features, generate, llm, storage
from cortex_api.auth import AuthDep
from cortex_api.config import settings
from cortex_api.embeddings import get_provider
from cortex_api.models import (
    CreateEntryRequest,
    CreateEntryResponse,
    DailyReport,
    Entry,
    EntryKind,
    FeedbackRequest,
    FeedbackResponse,
    GitHubActivity,
    IdentityGraph,
    LinkCodeRequest,
    LinkCodeResponse,
    SearchResponse,
    TimelineResponse,
    TodaySummary,
    UserProfile,
    WellnessStatus,
)
from cortex_api.retrieval import recall
from cortex_api.secrets import detect_secrets

log = logging.getLogger(__name__)


# ─── Security headers middleware ─────────────────────────────────────────────

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add OWASP-recommended security headers to every response."""

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        response = await call_next(request)
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Limit referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Restrict browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=()"
        )
        # Remove server fingerprint
        response.headers.pop("server", None)
        # HSTS — only in production (when not using reload/dev mode)
        if not settings.reload:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )
        return response


# ─── Rate limiting (server-side, in-memory sliding window) ───────────────────

import time
from collections import defaultdict, deque
from threading import Lock

_rate_lock = Lock()
_rate_windows: dict[str, deque] = defaultdict(deque)

# Limits: (max_requests, window_seconds)
_RATE_LIMITS = {
    "default":      (60,  60),   # 60 req/min per IP
    "create_entry": (20,  60),   # 20 creates/min
    "search":       (30,  60),   # 30 searches/min
    "chat":         (10,  60),   # 10 LLM calls/min
}

def _check_rate_limit(key: str, limit_name: str = "default") -> bool:
    """Return True if request is allowed, False if rate-limited."""
    max_req, window_sec = _RATE_LIMITS.get(limit_name, _RATE_LIMITS["default"])
    now = time.monotonic()
    full_key = f"{limit_name}:{key}"
    with _rate_lock:
        dq = _rate_windows[full_key]
        # Evict old entries
        while dq and dq[0] < now - window_sec:
            dq.popleft()
        if len(dq) >= max_req:
            return False
        dq.append(now)
        return True

def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting X-Forwarded-For."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@asynccontextmanager
async def lifespan(_: FastAPI):
    provider = get_provider()
    log.info("Embeddings provider: %s (dim=%d)", provider.name, provider.dim)
    storage.init_db(embedding_dim=provider.dim)
    yield


app = FastAPI(title="cortex-api", version="0.2.0", lifespan=lifespan)

# ── Security headers (must be added before CORS) ──────────────────────────────
app.add_middleware(SecurityHeadersMiddleware)

# ── CORS — tightened for production (OWASP Phase 2) ──────────────────────────
allowed_origins = ["*"] if settings.reload else [
    "https://cortex.dev",
    "https://www.cortex.dev",
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173",  # Vite dev server alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
    allow_credentials=True,
)


# ---------- core entry CRUD -------------------------------------------------


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": app.version}


@app.post(
    "/api/v1/entries",
    response_model=CreateEntryResponse,
    dependencies=[AuthDep],
    status_code=status.HTTP_201_CREATED,
)
def create_entry(req: CreateEntryRequest, request: Request) -> CreateEntryResponse:
    # Server-side rate limiting
    ip = _get_client_ip(request)
    if not _check_rate_limit(ip, "create_entry"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 20 entries per minute.",
            headers={"Retry-After": "60"},
        )

    findings = detect_secrets(req.text)
    if findings:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "secret_detected",
                "message": "Refused to save text containing apparent secrets.",
                "findings": [
                    {"label": f.label, "snippet": f.snippet} for f in findings
                ],
            },
        )

    provider = get_provider()
    embedding = provider.embed(req.text)
    entry_id, created_at = storage.insert_entry(
        text=req.text,
        source=req.source,
        embedding=embedding,
        kind=req.kind,
        repo=req.repo,
        file=req.file,
        line_start=req.line_start,
        line_end=req.line_end,
        tags=req.tags,
    )
    return CreateEntryResponse(id=entry_id, created_at=created_at)


@app.get("/api/v1/search", response_model=SearchResponse, dependencies=[AuthDep])
def search_entries(request: Request, q: str = Query(..., min_length=1), k: int = 5) -> SearchResponse:
    ip = _get_client_ip(request)
    if not _check_rate_limit(ip, "search"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 30 searches per minute.",
            headers={"Retry-After": "60"},
        )
    return SearchResponse(entries=recall(query=q, k=k))


@app.get("/api/v1/entries", response_model=TimelineResponse, dependencies=[AuthDep])
def timeline(
    limit: int = 20,
    since: int | None = None,
    kind: EntryKind | None = None,
) -> TimelineResponse:
    return TimelineResponse(
        entries=storage.list_recent(limit=limit, since_ms=since, kind=kind)
    )


@app.get("/api/v1/entries/{entry_id}", response_model=Entry, dependencies=[AuthDep])
def get_entry(entry_id: int) -> Entry:
    entry = storage.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="entry not found")
    return entry


@app.patch(
    "/api/v1/entries/{entry_id}/link",
    response_model=LinkCodeResponse,
    dependencies=[AuthDep],
)
def link_code(entry_id: int, req: LinkCodeRequest) -> LinkCodeResponse:
    if storage.get_entry(entry_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="entry not found")
    storage.link_code(
        entry_id,
        repo=req.repo,
        file=req.file,
        line_start=req.line_start,
        line_end=req.line_end,
    )
    return LinkCodeResponse(id=entry_id)


@app.post(
    "/api/v1/entries/{entry_id}/feedback",
    response_model=FeedbackResponse,
    dependencies=[AuthDep],
)
def feedback(entry_id: int, req: FeedbackRequest) -> FeedbackResponse:
    try:
        new_score = storage.apply_feedback(entry_id, req.signal)
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return FeedbackResponse(id=entry_id, score=new_score)


# ---------- v0.2 feature endpoints ------------------------------------------


@app.get("/api/v1/today", response_model=TodaySummary, dependencies=[AuthDep])
def today() -> TodaySummary:
    return features.today_summary()


@app.get("/api/v1/reports/daily", response_model=DailyReport, dependencies=[AuthDep])
def reports_daily(days: int = 1) -> DailyReport:
    return features.daily_report(days=days)


@app.get("/api/v1/analytics/session", dependencies=[AuthDep])
def analytics_session(window: int = 90) -> dict:
    return features.in_session_stats(window_minutes=window)


@app.get(
    "/api/v1/identity/graph",
    response_model=IdentityGraph,
    dependencies=[AuthDep],
)
def identity_graph_endpoint(top_n: int = 12) -> IdentityGraph:
    return features.identity_graph(top_n_tags=top_n)


@app.get(
    "/api/v1/github/activity",
    response_model=GitHubActivity,
    dependencies=[AuthDep],
)
def github_activity_endpoint(user: str = "demo", days: int = 30) -> GitHubActivity:
    return features.github_activity(user=user, days=days)


@app.get(
    "/api/v1/wellness/status",
    response_model=WellnessStatus,
    dependencies=[AuthDep],
)
def wellness_status(interval: int = 90) -> WellnessStatus:
    return features.wellness_status(break_interval_min=interval)


@app.post(
    "/api/v1/wellness/break",
    response_model=WellnessStatus,
    dependencies=[AuthDep],
)
def wellness_break() -> WellnessStatus:
    storage.log_wellness_break()
    return features.wellness_status()


# ---------- profile + automations -------------------------------------------


class ProfileUpdate(BaseModel):
    name: str | None = None
    handle: str | None = None
    bio: str | None = None
    pronouns: str | None = None
    timezone: str | None = None
    public_url: str | None = None


@app.get("/api/v1/profile", response_model=UserProfile, dependencies=[AuthDep])
def get_profile() -> UserProfile:
    return UserProfile(**storage.get_profile())


@app.patch("/api/v1/profile", response_model=UserProfile, dependencies=[AuthDep])
def patch_profile(update: ProfileUpdate) -> UserProfile:
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    return UserProfile(**storage.update_profile(**fields))


class AutomationCreate(BaseModel):
    name: str
    trigger_kind: str
    action: str


@app.get("/api/v1/automations", dependencies=[AuthDep])
def list_automations_endpoint() -> dict[str, list[dict[str, Any]]]:
    return {"automations": storage.list_automations()}


@app.post(
    "/api/v1/automations",
    dependencies=[AuthDep],
    status_code=status.HTTP_201_CREATED,
)
def create_automation(req: AutomationCreate) -> dict[str, int]:
    new_id = storage.create_automation(req.name, req.trigger_kind, req.action)
    return {"id": new_id}


@app.patch("/api/v1/automations/{automation_id}", dependencies=[AuthDep])
def toggle_automation(automation_id: int, enabled: bool) -> dict[str, bool]:
    storage.toggle_automation(automation_id, enabled)
    return {"enabled": enabled}


@app.delete(
    "/api/v1/automations/{automation_id}",
    dependencies=[AuthDep],
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_automation(automation_id: int) -> Response:
    storage.delete_automation(automation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- LLM-backed endpoints (watsonx Granite or local Granite GGUF) ----


class ChatRequest(BaseModel):
    query: str
    k: int = 5


@app.get("/api/v1/llm/info", dependencies=[AuthDep])
def llm_info() -> dict[str, Any]:
    p = llm.get_provider()
    return {"provider": p.name, "available": llm.is_available()}


@app.post("/api/v1/chat", dependencies=[AuthDep])
def chat(req: ChatRequest, request: Request) -> dict[str, Any]:
    ip = _get_client_ip(request)
    if not _check_rate_limit(ip, "chat"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 10 LLM calls per minute.",
            headers={"Retry-After": "60"},
        )
    if not llm.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM_PROVIDER is 'off'. Set LLM_PROVIDER=watsonx or local in .env.",
        )
    try:
        return generate.chat(query=req.query, k=req.k)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed: {exc}",
        )


@app.post("/api/v1/generate/summary/{entry_id}", dependencies=[AuthDep])
def generate_summary(entry_id: int) -> dict[str, str]:
    if not llm.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM_PROVIDER is 'off'.",
        )
    try:
        return {"summary": generate.summarise_entry(entry_id)}
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed: {exc}",
        )


@app.get("/api/v1/generate/report", dependencies=[AuthDep])
def generate_report(days: int = 1) -> dict[str, Any]:
    if not llm.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM_PROVIDER is 'off'.",
        )
    try:
        return generate.daily_report_narrative(days=days)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed: {exc}",
        )
