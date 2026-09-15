FROM aob-base:s2

# The version is pinned in the S2 feasibility record and verified again by
# runDockerCommand before an official cell starts.
COPY npm-locks/claude-code/package.json npm-locks/claude-code/package-lock.json /opt/aob/npm/claude-code/
ENV PATH="/opt/aob/npm/claude-code/node_modules/.bin:${PATH}"
RUN npm ci --prefix /opt/aob/npm/claude-code --omit=dev \
  && claude --version \
  && npm cache clean --force \
  && rm -rf /root/.npm
