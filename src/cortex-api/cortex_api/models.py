"""Pydantic models matching docs/CONTRACTS.md."""

from typing import Literal

from pydantic import BaseModel, Field

EntrySource = Literal["bob", "telegram-text", "telegram-voice", "web"]
FeedbackSignal = Literal["boost", "flag"]
EntryKind = Literal[
    "note",          # default — generic dev journal entry
    "idea",          # idea_mapper
    "debug",         # debugging_helper
    "decision",      # ADRs / today_hub "Save a Decision"
    "fix",           # today_hub "Log a Fix"
    "task",          # task_automation
    "report",        # daily_report
    "wellness",      # touch_grass_wellness
    "client",        # client_discussion_prep
]


class Entry(BaseModel):
    """A single diary entry as returned to clients."""

    id: int
    text: str
    score: float
    source: EntrySource
    kind: EntryKind = "note"
    repo: str | None = None
    file: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    tags: list[str] = Field(default_factory=list)
    created_at: int  # unix epoch ms


class CreateEntryRequest(BaseModel):
    text: str
    source: EntrySource
    kind: EntryKind = "note"
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


# ---------- feature-specific responses --------------------------------------


class TodaySummary(BaseModel):
    """today_hub dashboard: greeting + today's entries grouped by kind."""

    greeting: str
    current_focus: Entry | None = None
    counts_by_kind: dict[str, int]
    recent: list[Entry]


class DailyReport(BaseModel):
    """Aggregated report for a date range."""

    date_start: int  # epoch ms
    date_end: int
    total_entries: int
    by_kind: dict[str, int]
    highlights: list[Entry]


class GitHubActivity(BaseModel):
    """github_activity_graph stub. Real GH API integration is post-hackathon."""

    user: str
    days: int
    contributions: list[dict]  # [{date, count}]
    streak: int


class IdentityGraphNode(BaseModel):
    """Node in developer_identity_graph."""

    id: str
    label: str
    kind: str
    weight: int


class IdentityGraphEdge(BaseModel):
    source: str
    target: str
    weight: int


class IdentityGraph(BaseModel):
    nodes: list[IdentityGraphNode]
    edges: list[IdentityGraphEdge]


class WellnessStatus(BaseModel):
    """touch_grass_wellness state."""

    minutes_since_break: int
    break_due: bool
    last_break_at: int | None
    breaks_today: int


class UserProfile(BaseModel):
    name: str
    handle: str
    bio: str
    pronouns: str | None = None
    timezone: str
    public_url: str | None = None
