import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { isAbsolute, resolve, join, relative } from "node:path";

class LaunchCheckError extends Error {
  constructor(message) {
    super(message);
    this.name = "LaunchCheckError";
  }
}

async function regularFile(path, label) {
  let info;
  try {
    info = await lstat(path);
  } catch (error) {
    throw new LaunchCheckError(`${label} is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (info.isSymbolicLink() || !info.isFile()) throw new LaunchCheckError(`${label} must be a regular file`);
}

async function textFile(root, name) {
  const path = join(root, name);
  await regularFile(path, name);
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    throw new LaunchCheckError(`${name} cannot be read: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function object(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new LaunchCheckError(`${label} must be a JSON object`);
  }
  return value;
}

async function validateArtifacts(artifacts, root) {
  for (const [position, artifact] of artifacts.entries()) {
    const label = `publication artifact ${position}`;
    object(artifact, label);
    if (typeof artifact.kind !== "string" || artifact.kind.length === 0) throw new LaunchCheckError(`${label} must declare a kind`);
    if (typeof artifact.path !== "string" || artifact.path.length === 0 || isAbsolute(artifact.path) || artifact.path.split("/").includes("..")) {
      throw new LaunchCheckError(`${label} must declare a repository-relative path`);
    }
    if (typeof artifact.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(artifact.sha256)) {
      throw new LaunchCheckError(`${label} must declare a lowercase sha256 checksum`);
    }
    // A well-formed checksum proves nothing on its own. Confirm the bytes are
    // present and are the bytes claimed, so a release cannot cite evidence
    // that is missing or has been altered since it was recorded.
    const resolved = join(root, artifact.path);
    await regularFile(resolved, `${label} (${artifact.path})`);
    const actual = createHash("sha256").update(await readFile(resolved)).digest("hex");
    if (actual !== artifact.sha256) {
      throw new LaunchCheckError(`${label} checksum does not match ${artifact.path}`);
    }
  }
}

async function check(root) {
  const resolvedRoot = resolve(root);
  const rootInfo = await lstat(resolvedRoot).catch((error) => {
    throw new LaunchCheckError(`repository root is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  });
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new LaunchCheckError("repository root must be a real directory");

  const required = ["README.md", "METHODOLOGY.md", "CONTRIBUTING.md", "LICENSE"];
  const contents = Object.fromEntries(await Promise.all(required.map(async (name) => [name, await textFile(resolvedRoot, name)])));

  const indexPath = join(resolvedRoot, "evidence/index.json");
  await regularFile(indexPath, "evidence/index.json");
  let index;
  try {
    index = JSON.parse(await readFile(indexPath, "utf8"));
  } catch (error) {
    throw new LaunchCheckError(`evidence/index.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  object(index, "evidence/index.json");
  if (index.version !== 1) throw new LaunchCheckError("evidence/index.json version must be 1");
  if (!["pending", "pilot", "released"].includes(index.status)) {
    throw new LaunchCheckError("evidence/index.json status must be pending, pilot, or released");
  }
  if (!Array.isArray(index.artifacts)) throw new LaunchCheckError("evidence/index.json artifacts must be an array");

  // The positioning claim survives release; only the pre-publication hedges are
  // allowed to change. Each branch asserts the opposite invariant so the ledger
  // status and the prose can never disagree about whether v1 has shipped.
  if (!/not a capabilities leaderboard/i.test(contents["README.md"])) {
    throw new LaunchCheckError("README must contain the non-leaderboard positioning");
  }
  if (!/correction|dispute/i.test(contents["CONTRIBUTING.md"])) {
    throw new LaunchCheckError("CONTRIBUTING must document the correction path");
  }

  if (index.status === "pending") {
    if (!/Results are unpublished until the v1 dataset ships/i.test(contents["README.md"])) {
      throw new LaunchCheckError("README must state that results are unpublished until the v1 dataset ships");
    }
    if (!/draft/i.test(contents["METHODOLOGY.md"]) || !/no v1 measurements/i.test(contents["METHODOLOGY.md"])) {
      throw new LaunchCheckError("METHODOLOGY must remain an unpublished draft before S7 freeze");
    }
    if (index.artifacts.length !== 0) throw new LaunchCheckError("pending evidence/index.json must not claim publication artifacts");
  } else if (index.status === "pilot") {
    // A pilot publishes a real table from a smaller, non-official matrix. It
    // must therefore keep the v1 hedge rather than drop it, and say plainly on
    // the page that the numbers are not the v1 dataset.
    if (!/Results are unpublished until the v1 dataset ships/i.test(contents["README.md"])) {
      throw new LaunchCheckError("pilot README must still state that results are unpublished until the v1 dataset ships");
    }
    if (!/pilot/i.test(contents["README.md"])) {
      throw new LaunchCheckError("pilot README must label its results as a pilot");
    }
    if (index.artifacts.length === 0) {
      throw new LaunchCheckError("pilot evidence/index.json must list at least one publication artifact");
    }
    await validateArtifacts(index.artifacts, resolvedRoot);
  } else {
    if (/Results are unpublished until the v1 dataset ships/i.test(contents["README.md"])) {
      throw new LaunchCheckError("released README must not still claim that results are unpublished");
    }
    if (/^#.*\bdraft\b/im.test(contents["METHODOLOGY.md"])) {
      throw new LaunchCheckError("METHODOLOGY must not remain a draft once results are released");
    }
    if (index.artifacts.length === 0) {
      throw new LaunchCheckError("released evidence/index.json must list at least one publication artifact");
    }
    await validateArtifacts(index.artifacts, resolvedRoot);
  }

  return {
    v: 1,
    status: index.status,
    artifacts: index.artifacts,
    network: "disabled",
    root: isAbsolute(root) ? resolvedRoot : relative(process.cwd(), resolvedRoot) || ".",
    required_files: [...required, "evidence/index.json"],
  };
}

const root = process.argv[2] ?? process.cwd();
try {
  process.stdout.write(`${JSON.stringify(await check(root))}\n`);
} catch (error) {
  const message = error instanceof LaunchCheckError ? error.message : `unexpected launch-check failure: ${error instanceof Error ? error.message : String(error)}`;
  process.stderr.write(`S8 launch check: ${message}\n`);
  process.exitCode = 1;
}
