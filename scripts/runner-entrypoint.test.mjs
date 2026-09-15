import {mkdtemp, mkdir, writeFile} from "node:fs/promises";
import {spawn} from "node:child_process";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const entrypoint = fileURLToPath(new URL("../images/runner-entrypoint.sh", import.meta.url));

test("runner entrypoint links task dependencies into the mounted workspace offline", async () => {
	const root = await mkdtemp(join(tmpdir(), "aob-entrypoint-"));
	const app = join(root, "app");
	const workspace = join(root, "workspace");
	await mkdir(join(app, "node_modules", "example-dependency"), {recursive: true});
	await mkdir(workspace);
	await writeFile(join(app, "node_modules", "example-dependency", "package.json"), "{}\n");

	const result = await new Promise((resolve, reject) => {
		const child = spawn("sh", [entrypoint, "sh", "-c", "test -L \"$AOB_TEST_WORKSPACE/node_modules/example-dependency\""], {
			env: {...process.env, AOB_TASK_ROOT: app, AOB_WORKSPACE: workspace, AOB_TEST_WORKSPACE: workspace},
			stdio: ["ignore", "pipe", "pipe"],
		});
		child.once("error", reject);
		child.once("close", (code) => resolve(code));
	});
	assert.equal(result, 0);
});
