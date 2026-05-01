"""FastAPI app exposing REST / SSE endpoints — port 8080."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
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


@asynccontextmanager
async def lifespan(_: FastAPI):
    provider = get_provider()
    storage.init_db(embedding_dim=provider.dim)
    yield


app = FastAPI(title="cortex-api", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO(M3): tighten to the actual web origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/entries", response_model=CreateEntryResponse, dependencies=[AuthDep])
def create_entry(req: CreateEntryRequest) -> CreateEntryResponse:
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
def timeline(limit: int = 20) -> TimelineResponse:
    return TimelineResponse(entries=storage.list_recent(limit=limit))


@app.patch(
    "/api/v1/entries/{entry_id}/link",
    response_model=LinkCodeResponse,
    dependencies=[AuthDep],
)
def link_code(entry_id: int, req: LinkCodeRequest) -> LinkCodeResponse:
    # TODO(M2 Phase 3): implement
    return LinkCodeResponse(id=entry_id)


@app.post(
    "/api/v1/entries/{entry_id}/feedback",
    response_model=FeedbackResponse,
    dependencies=[AuthDep],
)
def feedback(entry_id: int, req: FeedbackRequest) -> FeedbackResponse:
    # TODO(M2 Phase 3): adjust entry.score, persist feedback row, clamp [0.1, 5.0]
    return FeedbackResponse(id=entry_id, score=1.0)
