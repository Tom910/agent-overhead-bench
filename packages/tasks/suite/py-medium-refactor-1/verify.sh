#!/bin/sh
set -e
cd "$(dirname "$0")/workspace"
python3 -m unittest discover -s . -p 'test_*.py' -q
python3 - <<'PY'
from pathlib import Path
src = Path("rects.py").read_text()
assert src.count("def ") >= 3
PY
