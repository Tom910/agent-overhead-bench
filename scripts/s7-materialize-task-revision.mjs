#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv.length !== 6) {
  process.stderr.write("usage: node scripts/s7-materialize-task-revision.mjs SOURCE_TASK REVISION_DIRECTORY TASK_ID NEW_OUTPUT_DIRECTORY\n");
  process.exit(1);
}
const result = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--experimental-loader", `${root}scripts/ts-source-loader.mjs`, "--input-type=module", "-", ...process.argv.slice(2)], {
  input: `import { materializeTaskRevision } from ${JSON.stringify(new URL("../packages/tasks/src/task-revisions.ts", import.meta.url).href)};\ntry { materializeTaskRevision(...process.argv.slice(2)); } catch (error) { process.stderr.write(error.message + "\\n"); process.exitCode = 1; }\n`, stdio: ["pipe", "inherit", "inherit"],
});
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exit(result.status ?? 1);
