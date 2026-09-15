FROM aob-base:s2

# The version is pinned in the S2 feasibility record and verified again by
# runDockerCommand before an official cell starts.
COPY npm-locks/codex/package.json npm-locks/codex/package-lock.json /opt/aob/npm/codex/
ENV PATH="/opt/aob/npm/codex/node_modules/.bin:${PATH}"
RUN npm ci --prefix /opt/aob/npm/codex --omit=dev \
  && codex --version \
  && npm cache clean --force \
  && rm -rf /root/.npm
