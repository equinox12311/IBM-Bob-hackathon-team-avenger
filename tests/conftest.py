"""Shared pytest fixtures.

Make ``cortex-api`` and ``cortex-bot`` packages importable in tests by
ensuring their parent dirs are on ``sys.path``.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src" / "cortex-api"))
sys.path.insert(0, str(ROOT / "src" / "cortex-bot"))
