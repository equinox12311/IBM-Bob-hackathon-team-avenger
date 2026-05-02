"""FastAPI app exposing REST / SSE endpoints — port 8080."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from cortex_api import features, storage
from cortex_api.auth import AuthDep
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    provider = get_provider()
    log.info("Embeddings provider: %s (dim=%d)", provider.name, provider.dim)
    storage.init_db(embedding_dim=provider.dim)
    yield


app = FastAPI(title="cortex-api", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # locked down via reverse proxy in production
    allow_methods=["*"],
    allow_headers=["*"],
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
def create_entry(req: CreateEntryRequest) -> CreateEntryResponse:
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
def search_entries(q: str = Query(..., min_length=1), k: int = 5) -> SearchResponse:
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
)
def delete_automation(automation_id: int) -> None:
    storage.delete_automation(automation_id)
