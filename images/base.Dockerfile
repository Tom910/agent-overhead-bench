# Shared S5/S2 base. No API keys. No coding-agent CLIs.
# Multi-architecture manifest digest captured for the S5 image build on
# 2026-08-26; the platform-specific child is selected by Docker.
FROM node:24-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    ca-certificates \
    ripgrep \
    procps \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /work
COPY runner-entrypoint.sh /opt/aob/runner-entrypoint.sh
COPY proxy-relay.mjs /opt/aob/proxy-relay.mjs
COPY apply_patch /usr/local/bin/apply_patch
RUN chmod 0555 /opt/aob/runner-entrypoint.sh /usr/local/bin/apply_patch
ENV CI=1 \
    NO_COLOR=1 \
    TERM=dumb \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

RUN git config --global user.email "s2@aob.local" \
  && git config --global user.name "aob-s2" \
  && git config --global init.defaultBranch main
