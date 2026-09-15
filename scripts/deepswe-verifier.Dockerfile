# check=skip=InvalidDefaultArgInFrom
# BASE_IMAGE deliberately has no default. The verifier must be built on the
# exact digest-pinned task environment that preparation resolved, so an
# unsupplied --build-arg has to fail the build rather than silently produce an
# image on some other base. BuildKit's linter evaluates the empty default and
# warns; the rule is skipped rather than the safety property weakened.
ARG BASE_IMAGE
FROM ${BASE_IMAGE}

# The verifier receives the model workspace as /work/workspace. Keep the task
# environment's preinstalled dependencies, but make the source tree and logs
# resolve to writable runtime mounts.
RUN if [ -f /app/.gitmodules ] && [ -d /app/.git ]; then git -C /app submodule update --init --recursive; fi \
 && if [ -f /app/src/dateutil/zoneinfo/dateutil-zoneinfo.tar.gz ]; then mkdir -p /opt/aob-task-environment-assets/src/dateutil/zoneinfo && cp -a /app/src/dateutil/zoneinfo/dateutil-zoneinfo.tar.gz /opt/aob-task-environment-assets/src/dateutil/zoneinfo/; fi \
 && rm -rf /logs \
 && mkdir -p /tmp/logs \
 && ln -s /tmp/logs /logs

# Recreate only the sanitized public base repository required by the native
# grader. The upstream repository metadata was removed from the environment
# image; this deterministic commit must match the prepared workspace revision.
RUN git init --quiet /app \
 && git -C /app branch -M main \
 && git -C /app config user.name aob-preparation \
 && git -C /app config user.email aob-preparation@example.invalid \
 && git -C /app add --all \
 && GIT_AUTHOR_NAME=aob-preparation GIT_AUTHOR_EMAIL=aob-preparation@example.invalid \
    GIT_AUTHOR_DATE=2000-01-01T00:00:00Z GIT_COMMITTER_NAME=aob-preparation \
    GIT_COMMITTER_EMAIL=aob-preparation@example.invalid GIT_COMMITTER_DATE=2000-01-01T00:00:00Z \
    git -C /app commit --quiet --allow-empty -m 'DeepSWE sanitized upstream base'

# Docker-mounted workspaces may retain the agent's host UID. The capturer
# replaces their Git metadata with the immutable base before running Git here.
# Trust only this verifier mount, including native grader subprocesses.
# The native capture clone reads this root-owned immutable repository as the
# host workspace user. Trust its exact Git directory, including in subprocesses.
RUN git config --system --add safe.directory /work/workspace \
 && git config --system --add safe.directory /app/.git

# Keep root-level JavaScript verification helpers available offline. The
# package-specific Vitest commands are rewritten by preparation to use their
# own local dependency tree, so backend and frontend versions cannot collide.
ENV PATH="/app/node_modules/.bin:${PATH}"

# DeepSWE task environments declare an open-ended pytest development
# dependency. Keep the verifier baseline compatible with the task-era suites;
# this affects only hidden verification, never the measured agent container.
RUN if command -v pytest >/dev/null 2>&1; then pip install --no-cache-dir 'pytest<9'; fi

COPY test.sh /tests/test.sh
COPY test.patch /tests/test.patch
COPY solution.patch /tests/solution.patch
COPY grader.py /tests/grader.py
COPY config.json /tests/config.json
COPY capture-model-patch.sh /usr/local/bin/aob-capture-model-patch
RUN chmod 0555 /usr/local/bin/aob-capture-model-patch
RUN cp /tests/config.json /opt/aob-verifier-config.json \
 && rm /tests/config.json \
 && ln -s /tmp/aob-verifier-config.json /tests/config.json \
 && chmod 0555 /tests/test.sh
