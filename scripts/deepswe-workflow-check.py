#!/usr/bin/env python3
"""Capture candidate Git workflow before native patch capture resets its metadata.

Usage: deepswe-workflow-check.py CONFIG_JSON WORKSPACE OUTPUT_JSON
This checks functional workflow compliance, not hostile-repository containment.
Read-only Git checks preserve the candidate; unavailable evidence emits no grade.
"""

import json
import os
import re
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path


MAX_BYTES = 1024 * 1024
GIT_TIMEOUT_S = 5
TOTAL_TIMEOUT_S = 15
PRIVATE_CACHES = (".aob-home", ".aob-codex-home", ".aob-qwen-home", ".aob-pi-home", ".aob-cline-home")


class WorkflowError(ValueError):
    """The captured inputs cannot establish the requested workflow assertions."""


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise WorkflowError("duplicate configuration key")
        result[key] = value
    return result


def read_base(path):
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_BYTES:
        raise WorkflowError("configuration is unavailable")
    config = json.loads(path.read_bytes(), object_pairs_hook=unique_object)
    base = config.get("base_commit") if isinstance(config, dict) else None
    if not isinstance(base, str) or not re.fullmatch(r"(?:[0-9a-fA-F]{40}|[0-9a-fA-F]{64})", base):
        raise WorkflowError("configuration requires a full base commit")
    return base.lower()


class GitReader:
    def __init__(self, workspace):
        self.workspace = workspace
        self.deadline = time.monotonic() + TOTAL_TIMEOUT_S
        # Do not inherit Git overrides, credentials, home config or optional
        # index-writing behavior. Trust only this exact mounted workspace.
        self.environment = {
            "PATH": os.environ.get("PATH", "/usr/bin:/bin"), "LC_ALL": "C",
            "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_SYSTEM": "/dev/null",
            "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_TERMINAL_PROMPT": "0",
            "GIT_OPTIONAL_LOCKS": "0", "GIT_NO_REPLACE_OBJECTS": "1",
        }

    def run(self, args, accepted=(0,)):
        remaining = min(GIT_TIMEOUT_S, self.deadline - time.monotonic())
        if remaining <= 0:
            raise WorkflowError("Git inspection timed out")
        command = ["git", "--no-pager", "--no-optional-locks",
                   "-c", f"safe.directory={self.workspace}",
                   "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false",
                   "-c", "core.untrackedCache=false", "-c", "core.attributesFile=/dev/null",
                   "-C", str(self.workspace), *args]
        # Spool output outside the workspace; never print repository data or
        # subprocess stderr. Both execution time and accepted output are bounded.
        with tempfile.TemporaryFile() as output:
            process = subprocess.Popen(command, env=self.environment, stdin=subprocess.DEVNULL,
                                       stdout=output, stderr=subprocess.DEVNULL, start_new_session=True)
            try:
                status = process.wait(timeout=remaining)
            except subprocess.TimeoutExpired as error:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.wait()
                raise WorkflowError("Git inspection timed out") from error
            if status not in accepted:
                raise WorkflowError("Git repository cannot be inspected")
            if output.tell() > MAX_BYTES:
                raise WorkflowError("Git inspection output exceeds its bound")
            output.seek(0)
            return status, output.read(MAX_BYTES + 1)


def inspect_workflow(workspace, base):
    git = GitReader(workspace)
    _, top = git.run(["rev-parse", "--show-toplevel"])
    if Path(os.fsdecode(top.rstrip(b"\n"))).resolve() != workspace:
        raise WorkflowError("workspace is not the repository root")
    _, shallow = git.run(["rev-parse", "--is-shallow-repository"])
    if shallow != b"false\n":
        raise WorkflowError("incomplete Git history cannot establish ancestry")
    _, base_commit = git.run(["rev-parse", "--verify", "--end-of-options", f"{base}^{{commit}}"])
    if base_commit.strip().decode("ascii") != base:
        raise WorkflowError("declared base is not a commit")
    _, head = git.run(["rev-parse", "--verify", "--end-of-options", "HEAD^{commit}"])
    head = head.strip().decode("ascii")
    if not re.fullmatch(r"(?:[0-9a-f]{40}|[0-9a-f]{64})", head):
        raise WorkflowError("HEAD is not a valid commit")
    symbolic_status, branch = git.run(["symbolic-ref", "--quiet", "HEAD"], accepted=(0, 1))
    ancestor_status, _ = git.run(["merge-base", "--is-ancestor", base, head], accepted=(0, 1))
    branch = branch.rstrip(b"\n")
    named_branch = symbolic_status == 0 and branch.startswith(b"refs/heads/") and branch != b"refs/heads/main"
    excludes = [pattern for name in PRIVATE_CACHES for pattern in (f":(exclude){name}", f":(exclude){name}/**")]
    _, changes = git.run(["status", "--porcelain=v1", "-z", "--untracked-files=all",
                          "--ignore-submodules=none", "--", ".", *excludes])
    return {"version": 1, "assertions": [
        {"id": "workflow.branch-created", "result": "passed" if named_branch and ancestor_status == 0 else "failed"},
        {"id": "workflow.changes-committed", "result": "passed" if head != base and not changes else "failed"},
    ]}


def publish(output, value):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf8", dir=output.parent,
                                         prefix=".workflow-", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(value, handle, separators=(",", ":"))
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        # A hard link publishes complete bytes atomically and fails if another
        # observation already owns the output, including a dangling symlink.
        os.link(temporary, output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main(args):
    if len(args) != 3:
        raise WorkflowError("expected CONFIG_JSON WORKSPACE OUTPUT_JSON")
    config_path, requested_workspace, requested_output = map(Path, args)
    if requested_workspace.is_symlink() or not requested_workspace.is_dir():
        raise WorkflowError("workspace is unavailable")
    workspace = requested_workspace.resolve()
    output = requested_output.resolve()
    if workspace == output or workspace in output.parents:
        raise WorkflowError("output must be outside the workspace")
    if os.path.lexists(requested_output) or not output.parent.is_dir():
        raise WorkflowError("output is unavailable or already exists")
    base = read_base(config_path)
    value = inspect_workflow(workspace, base)
    publish(output, value)


if __name__ == "__main__":
    try:
        main(sys.argv[1:])
    except WorkflowError as error:
        print(f"workflow check unavailable: {error}", file=sys.stderr)
        sys.exit(2)
    except (OSError, ValueError, UnicodeError, subprocess.SubprocessError):
        # Never echo paths, repository contents, native stderr or secret values.
        print("workflow check unavailable: invalid or inaccessible input", file=sys.stderr)
        sys.exit(2)
