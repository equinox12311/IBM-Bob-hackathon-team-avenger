"""FastAPI app exposing REST / SSE endpoints — port 8080."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from cortex_api import storage
from cortex_api.auth import AuthDep
from cortex_api.embeddings import get_provider
from cortex_api.models import (
    CreateEntryRequest,
    CreateEntryResponse,
    Entry,
    FeedbackRequest,
    FeedbackResponse,
    LinkCodeRequest,
    LinkCodeResponse,
    SearchResponse,
    TimelineResponse,
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


app = FastAPI(title="cortex-api", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # locked down via reverse proxy in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
def timeline(limit: int = 20, since: int | None = None) -> TimelineResponse:
    return TimelineResponse(entries=storage.list_recent(limit=limit, since_ms=since))


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
