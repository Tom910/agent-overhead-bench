FROM aob-base:s2
# Cline autonomous coding agent CLI.
RUN npm install -g cline@3.0.61 \
  && command -v cline \
  && (cline --version || true)
