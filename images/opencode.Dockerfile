FROM aob-base:s2
COPY npm-locks/opencode/package.json npm-locks/opencode/package-lock.json /opt/aob/npm/opencode/
ENV PATH="/opt/aob/npm/opencode/node_modules/.bin:${PATH}"
RUN npm ci --prefix /opt/aob/npm/opencode --omit=dev \
  && opencode --version \
  && npm cache clean --force \
  && rm -rf /root/.npm
