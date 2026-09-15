#!/bin/sh
set -e
cd "$(dirname "$0")/workspace"
node text.test.mjs
node --input-type=module -e "import fs from 'node:fs'; const s=fs.readFileSync('text.mjs','utf8'); if (!s.includes('function startsWithAny') && !s.includes('startsWithAny =')) process.exit(1)"
