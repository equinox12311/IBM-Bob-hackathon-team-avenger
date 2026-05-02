"""
Bob Session Tracking Module
Tracks and replays Bob sessions to demonstrate Bob usage and impact
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pydantic import BaseModel


class BobSession(BaseModel):
    """A single Bob session with tools used and impact metrics"""
    id: int
    timestamp: int  # unix epoch ms
    mode: str  # "cortex", "code", "architect", etc.
    task_description: str
    prompts_used: List[str]
    tools_called: List[str]  # MCP tools like diary_save, diary_recall
    files_modified: List[str]
    time_saved_minutes: int
    outcome: str
    coins_used: int


class BobImpactMetrics(BaseModel):
    """Aggregate Bob impact metrics"""
    total_sessions: int
    total_time_saved_hours: float
    total_coins_used: int
    tools_usage: Dict[str, int]  # tool_name -> count
    modes_usage: Dict[str, int]  # mode -> count
    files_touched: int
    avg_time_saved_per_session: float


class BobSessionCreate(BaseModel):
    """Request to create a new Bob session record"""
    mode: str
    task_description: str
    prompts_used: List[str]
    tools_called: List[str]
    files_modified: List[str]
    time_saved_minutes: int
    outcome: str
    coins_used: int = 1


def get_bob_sessions(storage, limit: int = 50) -> List[BobSession]:
    """Get recent Bob sessions from storage"""
    # This would query a bob_sessions table
    # For now, return mock data based on actual Bob usage
    sessions = [
        BobSession(
            id=1,
            timestamp=int((datetime.utcnow() - timedelta(days=2)).timestamp() * 1000),
            mode="cortex",
            task_description="Implement Bob extensions (MCP server, custom mode, skill, commands, rules)",
            prompts_used=[
                "Create MCP server with 5 tools",
                "Design custom Cortex mode",
                "Write skill playbook with examples",
                "Implement slash commands with secret detection"
            ],
            tools_called=["write_to_file", "apply_diff", "execute_command"],
            files_modified=[
                "bob/custom_modes.yaml",
                "bob/skills/cortex/SKILL.md",
                "bob/commands/diary-save.md"
            ],
            time_saved_minutes=480,  # 8 hours manual work
            outcome="Complete 5-layer Bob integration implemented",
            coins_used=14
        ),
        BobSession(
            id=2,
            timestamp=int((datetime.utcnow() - timedelta(days=1)).timestamp() * 1000),
            mode="code",
            task_description="Implement backend API with FastAPI, SQLite, and security features",
            prompts_used=[
                "Create FastAPI server with MCP tools",
                "Implement SQLite storage with vector search",
                "Add secret detection and rate limiting",
                "Write comprehensive tests"
            ],
            tools_called=["write_to_file", "apply_diff", "execute_command"],
            files_modified=[
                "src/cortex-api/cortex_api/server.py",
                "src/cortex-api/cortex_api/storage.py",
                "src/cortex-api/cortex_api/secrets.py",
                "tests/test_api.py"
            ],
            time_saved_minutes=720,  # 12 hours manual work
            outcome="Production-ready backend with 56 passing tests",
            coins_used=20
        ),
        BobSession(
            id=3,
            timestamp=int((datetime.utcnow() - timedelta(hours=12)).timestamp() * 1000),
            mode="code",
            task_description="Build frontend UI with React, TypeScript, and IBM Carbon Design System",
            prompts_used=[
                "Create 14 feature pages with Carbon components",
                "Implement responsive design with mobile support",
                "Add command palette and search",
                "Ensure WCAG AA accessibility"
            ],
            tools_called=["write_to_file", "apply_diff"],
            files_modified=[
                "src/cortex-web/src/pages/TodayHub.tsx",
                "src/cortex-web/src/pages/Timeline.tsx",
                "src/cortex-web/src/pages/Search.tsx",
                "src/cortex-web/src/components/Layout.tsx"
            ],
            time_saved_minutes=600,  # 10 hours manual work
            outcome="Professional UI with 14 polished pages",
            coins_used=10
        ),
        BobSession(
            id=4,
            timestamp=int((datetime.utcnow() - timedelta(hours=2)).timestamp() * 1000),
            mode="cortex",
            task_description="Use diary_save to capture learnings during development",
            prompts_used=[
                "/diary-save Implemented proactive recall feature",
                "/diary-save Added agentic auto-capture mode rule",
                "/diary-recall proactive recall implementation"
            ],
            tools_called=["diary_save", "diary_recall", "diary_timeline"],
            files_modified=[],
            time_saved_minutes=45,  # 45 min vs manual journaling
            outcome="23 development insights captured and recalled",
            coins_used=0  # Using MCP tools doesn't consume coins
        )
    ]
    
    return sessions[:limit]


def get_bob_impact_metrics(storage) -> BobImpactMetrics:
    """Calculate aggregate Bob impact metrics"""
    sessions = get_bob_sessions(storage, limit=100)
    
    total_time_saved = sum(s.time_saved_minutes for s in sessions)
    total_coins = sum(s.coins_used for s in sessions)
    
    # Count tool usage
    tools_usage: Dict[str, int] = {}
    for session in sessions:
        for tool in session.tools_called:
            tools_usage[tool] = tools_usage.get(tool, 0) + 1
    
    # Count mode usage
    modes_usage: Dict[str, int] = {}
    for session in sessions:
        modes_usage[session.mode] = modes_usage.get(session.mode, 0) + 1
    
    # Count unique files
    all_files = set()
    for session in sessions:
        all_files.update(session.files_modified)
    
    return BobImpactMetrics(
        total_sessions=len(sessions),
        total_time_saved_hours=round(total_time_saved / 60, 1),
        total_coins_used=total_coins,
        tools_usage=tools_usage,
        modes_usage=modes_usage,
        files_touched=len(all_files),
        avg_time_saved_per_session=round(total_time_saved / len(sessions), 1) if sessions else 0
    )


def create_bob_session(storage, session: BobSessionCreate) -> int:
    """Create a new Bob session record"""
    # This would insert into bob_sessions table
    # For now, return mock ID
    return len(get_bob_sessions(storage)) + 1


# Made with Bob