#!/bin/sh
set -e
cd "$(dirname "$0")/workspace"
python3 -m unittest discover -s . -p 'test_*.py' -q
