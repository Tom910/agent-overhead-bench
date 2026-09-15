FROM aob-base:s2
COPY npm-locks/qwen/package.json npm-locks/qwen/package-lock.json /opt/aob/npm/qwen/
ENV PATH="/opt/aob/npm/qwen/node_modules/.bin:${PATH}"
RUN npm ci --prefix /opt/aob/npm/qwen --omit=dev \
  && qwen --version \
  && npm cache clean --force \
  && rm -rf /root/.npm
