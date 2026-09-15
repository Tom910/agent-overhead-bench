FROM aob-base:s2

# Hermes is not published at the S2-pinned 0.20.5 version. Build from the
# exact feasibility-spike commit so the image, rather than the host, owns the
# version used by official cells.
ARG HERMES_COMMIT=ea25bf204daaea8996b55c9726e1e37914bb1ffb
ARG HERMES_ARCHIVE_SHA256=377c55cc8c97b2308e1bf95f22ae4c795bfdecc5b29905dff0aa06dfae4bb6b9
COPY python-locks/hermes.requirements.txt /opt/aob/python-locks/hermes.requirements.txt
RUN curl --fail --silent --show-error --location --retry 3 --retry-delay 2 \
      --output /tmp/hermes-agent.tar.gz "https://codeload.github.com/NousResearch/hermes-agent/tar.gz/$HERMES_COMMIT" \
  && printf '%s  %s\n' "$HERMES_ARCHIVE_SHA256" /tmp/hermes-agent.tar.gz | sha256sum -c - \
  && mkdir -p /opt/hermes-agent \
  && tar -xzf /tmp/hermes-agent.tar.gz --strip-components=1 -C /opt/hermes-agent \
  && rm /tmp/hermes-agent.tar.gz \
  && cd /opt/hermes-agent \
  && python3 -m pip install --no-cache-dir --break-system-packages --no-deps --require-hashes -r /opt/aob/python-locks/hermes.requirements.txt \
  && python3 -m pip install --no-cache-dir --break-system-packages --no-deps --no-build-isolation -e . \
  && hermes --version
