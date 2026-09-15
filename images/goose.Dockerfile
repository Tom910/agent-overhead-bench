FROM aob-base:s2
# Official Linux CLI installer (aaif-goose). Do not use Homebrew on the Mac host.
ENV PATH="/root/.local/bin:${PATH}"
RUN curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash \
  && goose --version
