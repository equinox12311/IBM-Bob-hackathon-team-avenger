"""Feature-specific aggregations on top of storage.

These are the read-side handlers for the v0.2 feature pages
(today_hub, daily_report, in_session_analytics, github_activity_graph,
developer_identity_graph, touch_grass_wellness).

GitHub and identity-graph data is computed/derived from journal entries plus
a small mock layer so the demo works without any external service. Real GH
API integration is post-hackathon.
"""

from __future__ import annotations

import time
from collections import Counter, defaultdict
from datetime import datetime, timezone

from cortex_api import storage
from cortex_api.models import (
    DailyReport,
    Entry,
    GitHubActivity,
    IdentityGraph,
    IdentityGraphEdge,
    IdentityGraphNode,
    TodaySummary,
    WellnessStatus,
)

DAY_MS = 86_400_000


# ---------- today_hub -------------------------------------------------------


def today_summary() -> TodaySummary:
    now = storage.now_ms()
    start_of_day = _start_of_day_ms(now)
    today_entries = storage.list_recent(limit=200, since_ms=start_of_day)
    counts = Counter(e.kind for e in today_entries)

    # Pick the most-recent "fix" or "task" entry as the current focus, falling
    # back to the most recent entry overall.
    current_focus: Entry | None = None
    for e in today_entries:
        if e.kind in {"fix", "task", "debug"}:
            current_focus = e
            break
    if current_focus is None and today_entries:
        current_focus = today_entries[0]

    return TodaySummary(
        greeting=_greeting(now),
        current_focus=current_focus,
        counts_by_kind={k: int(v) for k, v in counts.items()},
        recent=today_entries[:5],
    )


# ---------- daily_report ----------------------------------------------------


def daily_report(days: int = 1) -> DailyReport:
    now = storage.now_ms()
    days = max(1, min(days, 30))
    start = now - days * DAY_MS
    entries = storage.list_recent(limit=500, since_ms=start)
    by_kind = Counter(e.kind for e in entries)
    # Highlights: the highest-scored entries in the period, up to 5.
    highlights = sorted(entries, key=lambda e: e.score, reverse=True)[:5]
    return DailyReport(
        date_start=start,
        date_end=now,
        total_entries=len(entries),
        by_kind={k: int(v) for k, v in by_kind.items()},
        highlights=highlights,
    )


# ---------- in_session_analytics --------------------------------------------


def in_session_stats(window_minutes: int = 90) -> dict:
    now = storage.now_ms()
    window_start = now - window_minutes * 60_000
    entries = storage.list_recent(limit=500, since_ms=window_start)
    by_kind = Counter(e.kind for e in entries)
    by_source = Counter(e.source for e in entries)

    files_touched: list[str] = []
    seen: set[str] = set()
    for e in entries:
        if e.file and e.file not in seen:
            seen.add(e.file)
            files_touched.append(e.file)

    return {
        "window_minutes": window_minutes,
        "total": len(entries),
        "by_kind": {k: int(v) for k, v in by_kind.items()},
        "by_source": {k: int(v) for k, v in by_source.items()},
        "files_touched": files_touched[:20],
    }


# ---------- developer_identity_graph ----------------------------------------


def identity_graph(top_n_tags: int = 12) -> IdentityGraph:
    """Build a node/edge graph from tags and files referenced in entries."""

    entries = storage.list_recent(limit=1000)
    tag_counts: Counter[str] = Counter()
    file_counts: Counter[str] = Counter()
    co_occur: dict[tuple[str, str], int] = defaultdict(int)

    for e in entries:
        for tag in e.tags or []:
            tag_counts[tag] += 1
        if e.file:
            file_counts[e.file] += 1
        for a in e.tags or []:
            for b in e.tags or []:
                if a < b:
                    co_occur[(a, b)] += 1

    nodes: list[IdentityGraphNode] = []
    for tag, n in tag_counts.most_common(top_n_tags):
        nodes.append(IdentityGraphNode(id=f"tag:{tag}", label=tag, kind="tag", weight=int(n)))
    for fname, n in file_counts.most_common(top_n_tags):
        nodes.append(
            IdentityGraphNode(id=f"file:{fname}", label=fname, kind="file", weight=int(n))
        )

    edges: list[IdentityGraphEdge] = []
    for (a, b), w in co_occur.items():
        edges.append(IdentityGraphEdge(source=f"tag:{a}", target=f"tag:{b}", weight=int(w)))

    return IdentityGraph(nodes=nodes, edges=edges)


# ---------- github_activity_graph (stub) ------------------------------------


def github_activity(user: str = "demo", days: int = 30) -> GitHubActivity:
    """Stub: derive a contributions heatmap from entry timestamps.

    Real GH API integration is a post-hackathon enhancement; for the demo we
    show the developer's *Cortex* activity, not GitHub's, plotted day-by-day.
    """

    days = max(1, min(days, 365))
    now = storage.now_ms()
    start = now - days * DAY_MS
    entries = storage.list_recent(limit=2000, since_ms=start)

    by_day: dict[str, int] = defaultdict(int)
    for e in entries:
        day = datetime.fromtimestamp(e.created_at / 1000, tz=timezone.utc).date().isoformat()
        by_day[day] += 1

    contributions = [{"date": day, "count": n} for day, n in sorted(by_day.items())]

    streak = _current_streak(by_day)

    return GitHubActivity(user=user, days=days, contributions=contributions, streak=streak)


def _current_streak(by_day: dict[str, int]) -> int:
    today = datetime.now(timezone.utc).date()
    streak = 0
    for offset in range(0, 366):
        day = (today.fromordinal(today.toordinal() - offset)).isoformat()
        if by_day.get(day, 0) > 0:
            streak += 1
        else:
            break
    return streak


# ---------- touch_grass_wellness --------------------------------------------


def wellness_status(break_interval_min: int = 90) -> WellnessStatus:
    last_ts = storage.last_wellness_break()
    now = storage.now_ms()
    minutes_since = int((now - last_ts) / 60_000) if last_ts else break_interval_min + 1
    breaks_today = storage.wellness_breaks_since(_start_of_day_ms(now))
    return WellnessStatus(
        minutes_since_break=minutes_since,
        break_due=minutes_since >= break_interval_min,
        last_break_at=last_ts,
        breaks_today=breaks_today,
    )


# ---------- helpers ---------------------------------------------------------


def _start_of_day_ms(now_ms: int) -> int:
    dt = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc)
    sod = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    return int(sod.timestamp() * 1000)


def _greeting(now_ms: int) -> str:
    h = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).hour
    if h < 12:
        return "Good morning"
    if h < 18:
        return "Good afternoon"
    return "Good evening"
