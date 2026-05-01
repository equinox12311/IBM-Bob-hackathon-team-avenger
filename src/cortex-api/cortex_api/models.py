"""Pydantic models matching docs/CONTRACTS.md."""

from typing import Literal

from pydantic import BaseModel, Field

EntrySource = Literal["bob", "telegram-text", "telegram-voice", "web"]
FeedbackSignal = Literal["boost", "flag"]


class Entry(BaseModel):
    """A single diary entry as returned to clients."""

    id: int
    text: str
    score: float
    source: EntrySource
    repo: str | None = None
    file: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    tags: list[str] = Field(default_factory=list)
    created_at: int  # unix epoch ms


class CreateEntryRequest(BaseModel):
    text: str
    source: EntrySource
    repo: str | None = None
    file: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    tags: list[str] = Field(default_factory=list)


class CreateEntryResponse(BaseModel):
    id: int
    created_at: int


class SearchResponse(BaseModel):
    entries: list[Entry]


class LinkCodeRequest(BaseModel):
    repo: str
    file: str
    line_start: int
    line_end: int


class LinkCodeResponse(BaseModel):
    id: int


class FeedbackRequest(BaseModel):
    signal: FeedbackSignal


class FeedbackResponse(BaseModel):
    id: int
    score: float


class TimelineResponse(BaseModel):
    entries: list[Entry]
