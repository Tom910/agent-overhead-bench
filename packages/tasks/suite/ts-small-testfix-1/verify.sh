#!/bin/sh
set -e
cd "$(dirname "$0")/workspace"
node sum.test.mjs
