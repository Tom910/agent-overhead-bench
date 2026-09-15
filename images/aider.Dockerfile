FROM aob-base:s2
COPY python-locks/aider.requirements.txt /opt/aob/python-locks/aider.requirements.txt
RUN pip install --no-cache-dir --break-system-packages --no-deps --require-hashes -r /opt/aob/python-locks/aider.requirements.txt \
  && aider --version
