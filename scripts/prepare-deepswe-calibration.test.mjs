import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "prepare-deepswe-calibration.sh");

test("resolves the DeepSWE source before git -C uses patch paths", () => {
  const script = readFileSync(scriptPath, "utf8");
  assert.match(script, /SOURCE=\$\(CDPATH= cd -- "\$SOURCE" && pwd\)/);
});

test("accepts every DeepSWE language supported by the C2 contract", () => {
  const script = readFileSync(scriptPath, "utf8");
  for (const language of ["python", "typescript", "go", "javascript", "rust"]) {
    assert.match(script, new RegExp(`    ${language}\\) : ;;`));
  }
});

test("uses a bounded reference-polarity timeout instead of a fixed short probe", () => {
  const script = readFileSync(scriptPath, "utf8");
  assert.match(script, /REFERENCE_TIMEOUT_S=\$\{AOB_REFERENCE_TIMEOUT_S:-\$\(\( TASK_TIMEOUT_S > 1800 \? 1800 : TASK_TIMEOUT_S \)\)\}/);
  assert.match(script, /"\$REFERENCE_TIMEOUT_S"/);
  assert.match(script, /timeoutS: referenceTimeoutS/);
});

test("retains sanitized reference-polarity failure evidence", () => {
  const script = readFileSync(scriptPath, "utf8");
  assert.match(script, /reference-polarity-failure/);
  assert.match(script, /exit_codes/);
});

test("routes Go verifier build artifacts away from the noexec temporary filesystem", () => {
  const script = readFileSync(scriptPath, "utf8");
  assert.match(script, /GOTMPDIR=\/work\/workspace\/\.aob-go-tmp/);
  assert.match(script, /GOPATH=\/work\/workspace\/\.aob-go-path/);
  assert.match(script, /grep -q '\/root\/go\/bin'/);
  assert.match(script, /s#\/root\/go\/bin#\/work\/workspace\/\.aob-go-path\/bin#g/);
});

test("clamps the default reference-polarity timeout to the source verifier bound", () => {
  // The reference check runs the source verifier (declared budget 1800s), not
  // the agent. Extended-regime agent timeouts exceed that bound, so the
  // default must clamp rather than inherit and then fail the guard. Evaluate
  // the script's own expression so the test cannot drift from it.
  const script = readFileSync(scriptPath, "utf8");
  const line = script.split("\n").find((entry) => entry.startsWith("REFERENCE_TIMEOUT_S="));
  assert.ok(line, "reference timeout assignment is present");
  const expression = line.slice("REFERENCE_TIMEOUT_S=".length);

  for (const [taskTimeoutS, expected] of [["300", "300"], ["900", "900"], ["1800", "1800"], ["3600", "1800"], ["10800", "1800"]]) {
    const result = spawnSync("sh", ["-c", `TASK_TIMEOUT_S=${taskTimeoutS}; printf '%s' "${expression}"`], { encoding: "utf8" });
    assert.equal(result.status, 0, `sh failed for ${taskTimeoutS}: ${result.stderr}`);
    assert.equal(result.stdout, expected, `TASK_TIMEOUT_S=${taskTimeoutS} should clamp to ${expected}`);
  }

  // An explicit operator override still wins, and the 1800s guard still holds.
  const override = spawnSync("sh", ["-c", `AOB_REFERENCE_TIMEOUT_S=120; TASK_TIMEOUT_S=3600; printf '%s' "${expression}"`], { encoding: "utf8" });
  assert.equal(override.stdout, "120");
  assert.match(script, /"\$REFERENCE_TIMEOUT_S" -le 1800/);
});

test("the verifier Dockerfile keeps BASE_IMAGE defaultless and silences only that lint rule", () => {
  // BASE_IMAGE must have no default: the verifier has to be built on the exact
  // digest-pinned environment preparation resolved, so an unsupplied build-arg
  // must fail rather than silently build on another base. BuildKit's linter
  // evaluates the empty default and warns, so the rule is skipped explicitly
  // instead of the safety property being weakened with a placeholder default.
  const dockerfile = readFileSync(join(dirname(scriptPath), "deepswe-verifier.Dockerfile"), "utf8");
  const lines = dockerfile.split("\n");

  // Parser directives only take effect on the first line.
  assert.equal(lines[0], "# check=skip=InvalidDefaultArgInFrom");
  assert.match(dockerfile, /^ARG BASE_IMAGE$/m);
  assert.doesNotMatch(dockerfile, /^ARG BASE_IMAGE=/m, "BASE_IMAGE must not gain a default");
  assert.match(dockerfile, /^FROM \$\{BASE_IMAGE\}$/m);
  assert.equal(dockerfile.match(/^# check=/gm)?.length, 1, "skip exactly one lint rule");
});
