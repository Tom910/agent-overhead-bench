FROM aob-base:s2
# Exact package and version retained in the completed local pilot C4 evidence.
RUN npm install -g @mariozechner/pi-coding-agent@0.73.1 \
  && command -v pi \
  && pi --version
