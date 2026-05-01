"""Shared pytest fixtures.

Keep ``cortex-api`` importable in tests by ensuring it is on ``sys.path``.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "cortex-api"))
sys.path.insert(0, str(ROOT / "cortex-bot"))
