"""FastAPI app exposing REST / SSE endpoints — port 8080."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, List

from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel

from cortex_api import codebase, features, generate, llm, storage
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
        # Remove server fingerprint — use del with key check
        if "server" in response.headers:
            del response.headers["server"]
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
    if request.client:
        return request.client.host
    return "testclient"  # safe fallback for test environments


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


# ---------- pending_actions (Bob escalation queue) -------------------------


import json as _json


class QueueAction(BaseModel):
    kind: str  # 'recall' | 'save' | 'analyze' | 'free'
    payload: dict
    source: str = "mobile"


@app.post("/api/v1/actions/queue", dependencies=[AuthDep], status_code=status.HTTP_201_CREATED)
def queue_action(req: QueueAction) -> dict:
    """Queue an action for IBM Bob to pick up via diary_pending_actions."""

    new_id, ts = storage.queue_action(
        kind=req.kind,
        payload=_json.dumps(req.payload, default=str),
        source=req.source,
    )
    return {"id": new_id, "created_at": ts, "queued": True}


@app.get("/api/v1/actions/pending", dependencies=[AuthDep])
def pending_actions(consume: bool = False, limit: int = 50) -> dict:
    """List open pending actions; ``consume=true`` marks them as picked up.

    Bob's MCP `diary_pending_actions` tool calls this with consume=true.
    Used by the workspace UI in debug-only mode with consume=false.
    """

    rows = storage.list_pending_actions(consume=consume, limit=limit)
    actions = [
        {
            "id": r["id"],
            "kind": r["kind"],
            "payload": _json.loads(r["payload"]) if r["payload"] else {},
            "source": r["source"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    return {"actions": actions, "consumed": consume}


@app.get("/api/v1/actions/all", dependencies=[AuthDep])
def all_actions(limit: int = 100) -> dict:
    """Debug listing — includes consumed actions."""

    rows = storage.all_pending_actions(limit=limit)
    return {"actions": [
        {
            "id": r["id"],
            "kind": r["kind"],
            "payload": _json.loads(r["payload"]) if r["payload"] else {},
            "source": r["source"],
            "created_at": r["created_at"],
            "consumed_at": r["consumed_at"],
        }
        for r in rows
    ]}


@app.delete(
    "/api/v1/actions/{action_id}",
    dependencies=[AuthDep],
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_action(action_id: int) -> Response:
    storage.delete_pending_action(action_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- codebase indexer + Granite analysis ---------------------------


class IndexRequest(BaseModel):
    path: str
    max_files: int = 200
    skip_existing: bool = True


@app.post("/api/v1/codebase/index", dependencies=[AuthDep])
def codebase_index(req: IndexRequest) -> dict:
    """Walk ``path``, embed source files as kind=code entries, return a summary."""

    try:
        return codebase.index_path(
            req.path,
            max_files=req.max_files,
            skip_existing=req.skip_existing,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"index failed: {exc}",
        )


@app.get("/api/v1/codebase/files", dependencies=[AuthDep])
def codebase_files(repo: str | None = None) -> dict:
    """List files that have been indexed (optionally filter by repo path)."""

    return {"files": codebase.list_indexed_files(repo)}


@app.get("/api/v1/codebase/file", dependencies=[AuthDep])
def codebase_file(repo: str, path: str) -> dict:
    """Reassemble an indexed file's contents from its chunks."""

    result = codebase.get_indexed_file(repo, path)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"file not indexed under {repo}: {path}",
        )
    return result


class AnalyzeCodeRequest(BaseModel):
    file: str
    question: str
    k: int = 8


@app.post("/api/v1/analyze/code", dependencies=[AuthDep])
def analyze_code(req: AnalyzeCodeRequest) -> dict:
    """Granite answers a question grounded in indexed code chunks."""

    if not llm.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM_PROVIDER is 'off'.",
        )
    try:
        return generate.analyze_code(file=req.file, question=req.question, k=req.k)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed: {exc}",
        )


@app.get("/api/v1/suggest/next", dependencies=[AuthDep])
def suggest_next(limit: int = 20) -> dict:
    """Granite suggests the developer's next 3 actions from recent entries."""

    if not llm.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM_PROVIDER is 'off'.",
        )
    try:
        return generate.suggest_next(limit=limit)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"LLM call failed: {exc}",
        )


# ---------- Productivity Metrics endpoints ----------------------------------

from cortex_api.productivity import get_productivity_stats

@app.get("/api/v1/metrics/productivity", dependencies=[AuthDep])
def productivity_metrics(days: int = 7) -> dict:
    """Get productivity metrics and ROI calculations"""
    return get_productivity_stats(storage, days=days)


# ---------- Bob Session Tracking endpoints ----------------------------------

from cortex_api.bob_sessions import (
    BobSession,
    BobImpactMetrics,
    BobSessionCreate,
    get_bob_sessions,
    get_bob_impact_metrics,
    create_bob_session,
)

@app.get("/api/v1/bob/sessions", response_model=List[BobSession], dependencies=[AuthDep])
def list_bob_sessions(limit: int = 50) -> List[BobSession]:
    """Get recent Bob sessions with impact metrics"""
    return get_bob_sessions(storage, limit=limit)


@app.get("/api/v1/bob/impact", response_model=BobImpactMetrics, dependencies=[AuthDep])
def bob_impact_metrics() -> BobImpactMetrics:
    """Get aggregate Bob impact metrics"""
    return get_bob_impact_metrics(storage)


@app.post(
    "/api/v1/bob/sessions",
    dependencies=[AuthDep],
    status_code=status.HTTP_201_CREATED,
)
def create_bob_session_endpoint(req: BobSessionCreate) -> dict[str, int]:
    """Create a new Bob session record"""
    session_id = create_bob_session(storage, req)
    return {"id": session_id}


# ---------- Multi-Agent Orchestration endpoints -----------------------------

from cortex_api.agents import (
    WorkflowResult,
    WorkflowTemplate,
    get_orchestrator,
    get_workflow_templates,
)

@app.get("/api/v1/workflows/templates", response_model=List[WorkflowTemplate], dependencies=[AuthDep])
def list_workflow_templates() -> List[WorkflowTemplate]:
    """Get available workflow templates"""
    return get_workflow_templates()


@app.post("/api/v1/workflows/execute", response_model=WorkflowResult, dependencies=[AuthDep])
async def execute_workflow(template_id: str, task_description: str) -> WorkflowResult:
    """Execute a multi-agent workflow"""
    orchestrator = get_orchestrator()
    return await orchestrator.execute_workflow(template_id, task_description)


@app.get("/api/v1/workflows/{workflow_id}", response_model=WorkflowResult, dependencies=[AuthDep])
def get_workflow(workflow_id: str) -> WorkflowResult:
    """Get workflow result by ID"""
    orchestrator = get_orchestrator()
    result = orchestrator.get_workflow(workflow_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return result


@app.get("/api/v1/workflows", response_model=List[WorkflowResult], dependencies=[AuthDep])
def list_workflows() -> List[WorkflowResult]:
    """List all workflows"""
    orchestrator = get_orchestrator()
    return orchestrator.list_workflows()


# ---------- Code Modernization endpoints ------------------------------------

from cortex_api.modernization import (
    ModernizationPlan,
    ModernizationResult,
    ModernizationType,
    get_modernization_agent,
)

@app.post("/api/v1/modernization/analyze", response_model=ModernizationPlan, dependencies=[AuthDep])
async def analyze_modernization(repo_path: str, modernization_type: ModernizationType) -> ModernizationPlan:
    """Analyze codebase for modernization"""
    agent = get_modernization_agent()
    return await agent.analyze_codebase(repo_path, modernization_type)


@app.post("/api/v1/modernization/execute/{plan_id}", response_model=ModernizationResult, dependencies=[AuthDep])
async def execute_modernization(plan_id: str) -> ModernizationResult:
    """Execute modernization plan"""
    agent = get_modernization_agent()
    return await agent.execute_modernization(plan_id)


@app.get("/api/v1/modernization/plan/{plan_id}", response_model=ModernizationPlan, dependencies=[AuthDep])
def get_modernization_plan(plan_id: str) -> ModernizationPlan:
    """Get modernization plan by ID"""
    agent = get_modernization_agent()
    plan = agent.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


# ---------- MCP Server Builder endpoints ------------------------------------

from cortex_api.mcp_builder import (
    GeneratedMCPServer,
    MCPServerSpec,
    get_mcp_builder,
    get_example_specs,
)

@app.get("/api/v1/mcp/examples", response_model=List[MCPServerSpec], dependencies=[AuthDep])
def list_mcp_examples() -> List[MCPServerSpec]:
    """Get example MCP server specs"""
    return get_example_specs()


@app.post("/api/v1/mcp/generate", response_model=GeneratedMCPServer, dependencies=[AuthDep])
async def generate_mcp_server(spec: MCPServerSpec) -> GeneratedMCPServer:
    """Generate a custom MCP server"""
    builder = get_mcp_builder()
    return await builder.generate_mcp_server(spec)


@app.get("/api/v1/mcp/servers", response_model=List[GeneratedMCPServer], dependencies=[AuthDep])
def list_mcp_servers() -> List[GeneratedMCPServer]:
    """List all generated MCP servers"""
    builder = get_mcp_builder()
    return builder.list_servers()


@app.get("/api/v1/mcp/servers/{server_id}", response_model=GeneratedMCPServer, dependencies=[AuthDep])
def get_mcp_server(server_id: str) -> GeneratedMCPServer:
    """Get generated MCP server by ID"""
    builder = get_mcp_builder()
    server = builder.get_server(server_id)
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    return server


@app.post("/api/v1/mcp/servers/{server_id}/deploy", dependencies=[AuthDep])
def deploy_mcp_server(server_id: str) -> dict[str, bool]:
    """Deploy an MCP server"""
    builder = get_mcp_builder()
    success = builder.deploy_server(server_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server not found")
    return {"deployed": True}


# ---------- Legacy Analyzer endpoints ---------------------------------------

from cortex_api.legacy_analyzer import (
    LegacyAnalysis,
    get_legacy_analyzer,
)

@app.post("/api/v1/legacy/analyze", response_model=LegacyAnalysis, dependencies=[AuthDep])
async def analyze_legacy_repo(repo_url: str) -> LegacyAnalysis:
    """Analyze a legacy repository"""
    analyzer = get_legacy_analyzer()
    return await analyzer.analyze_legacy_repo(repo_url)


@app.get("/api/v1/legacy/analyses", response_model=List[LegacyAnalysis], dependencies=[AuthDep])
def list_legacy_analyses() -> List[LegacyAnalysis]:
    """List all legacy analyses"""
    analyzer = get_legacy_analyzer()
    return analyzer.list_analyses()


@app.get("/api/v1/legacy/analyses/{analysis_id}", response_model=LegacyAnalysis, dependencies=[AuthDep])
def get_legacy_analysis(analysis_id: str) -> LegacyAnalysis:
    """Get legacy analysis by ID"""
    analyzer = get_legacy_analyzer()
    analysis = analyzer.get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return analysis


# ---------- Graph-RAG endpoints ------------------------------------------------

from cortex_api.graph_rag import (
    KnowledgeGraph,
    MarkdownExport,
    get_graph_rag,
)

@app.get("/api/v1/graph/build", response_model=KnowledgeGraph, dependencies=[AuthDep])
def build_knowledge_graph() -> KnowledgeGraph:
    """Build knowledge graph from all entries"""
    graph_rag = get_graph_rag()
    entries = storage.list_recent(limit=1000)  # Get all entries
    return graph_rag.build_graph_from_entries(entries)


@app.get("/api/v1/graph/export", response_model=List[MarkdownExport], dependencies=[AuthDep])
def export_to_markdown() -> List[MarkdownExport]:
    """Export all entries to markdown files"""
    graph_rag = get_graph_rag()
    entries = storage.list_recent(limit=1000)
    return graph_rag.export_to_markdown(entries)


@app.get("/api/v1/graph", response_model=KnowledgeGraph, dependencies=[AuthDep])
def get_knowledge_graph() -> KnowledgeGraph:
    """Get the current knowledge graph"""
    graph_rag = get_graph_rag()
    graph = graph_rag.get_graph()
    if not graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No graph built yet. Call /api/v1/graph/build first."
        )
    return graph


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
