/**
 * S5 zero-spend integration smoke: prove a real Docker container can reach
 * the host-bound measurement proxy and emit a schema-valid C1 event.
 */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigError, validateC1Event } from "@aob/contracts";
import { startMockUpstream } from "@aob/mock-upstream";
import { startProxy } from "@aob/proxy";
import { describeDockerProxyRoute, newDockerContainerName, newDockerProxyAuthToken, startDockerProxyRoute, stopDockerProxyRoute } from "./docker.js";

const CURL_IMAGE = "curlimages/curl:8.12.1@sha256:94e9e444bcba979c2ea12e27ae39bee4cd10bc7041a472c4727a558e213744e6";

function runDocker(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const child = spawn("docker", args, {
      env: { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") reject(new ConfigError("Docker executable is not available on PATH"));
      else reject(new ConfigError(`Docker route smoke could not start: ${error.message}`));
    });
    child.once("close", (code) => resolve({
      exitCode: code ?? 1,
      stdout: Buffer.concat(stdout).toString("utf8"),
      stderr: Buffer.concat(stderr).toString("utf8"),
    }));
  });
}

const out = await mkdtemp(join(tmpdir(), "aob-docker-route-"));
const upstream = await startMockUpstream({ streamed: false, includeUsage: true, status: 200 });
const proxyAuthToken = newDockerProxyAuthToken();
const proxy = await startProxy({
  run_id: "docker-route-smoke",
  upstream: upstream.baseUrl,
  outPath: join(out, "events.jsonl"),
  host: "0.0.0.0",
  authToken: proxyAuthToken,
});
const route = describeDockerProxyRoute(`http://host.docker.internal:${proxy.port}`, newDockerContainerName(), proxyAuthToken);
let routeStarted = false;

try {
  const image = await runDocker(["image", "inspect", CURL_IMAGE]);
  if (image.exitCode !== 0) throw new ConfigError(`Docker route smoke image is missing: ${CURL_IMAGE}`);
  await startDockerProxyRoute(route);
  routeStarted = true;
  const response = await runDocker([
    "run", "--pull=never", "--rm", "--network", route.networkName, "--entrypoint", "/bin/sh", CURL_IMAGE, "-c",
    'test -z "$(awk \'NR > 1 && $2 == "00000000" { print }\' /proc/net/route)" && test -z "$(awk \'$1 == "00000000000000000000000000000000" && $NF != "lo" { print }\' /proc/net/ipv6_route)" && curl -fsS -X POST http://aob-relay:8080/v1/chat/completions -H "content-type: application/json" --data-binary \'{"model":"mock","messages":[{"role":"user","content":"route"}]}\'',
  ]);
  if (response.exitCode !== 0) {
    throw new ConfigError(`Docker route smoke failed: ${response.stderr.trim() || response.stdout.trim() || `exit ${response.exitCode}`}`);
  }
  await proxy.flush();
  const events = (await readFile(join(out, "events.jsonl"), "utf8")).split("\n").filter(Boolean).map((line) => validateC1Event(JSON.parse(line)));
  if (events.length !== 1 || events[0]?.status !== 200 || events[0]?.run_id !== "docker-route-smoke") {
    throw new ConfigError(`Docker route smoke emitted unexpected C1 data: ${JSON.stringify(events)}`);
  }
  process.stdout.write(`${JSON.stringify({ image: CURL_IMAGE, proxy_route: "internal-relay", agent_default_route: false, events: events.length, status: events[0].status })}\n`);
} finally {
  if (routeStarted) await stopDockerProxyRoute(route);
  await proxy.close();
  await upstream.close();
  await rm(out, { recursive: true, force: true });
}
