import { createServer, request as httpRequest } from "node:http";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function listen(server: ReturnType<typeof createServer>): Promise<number> {
  return new Promise((resolvePort, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") reject(new Error("target did not bind"));
      else resolvePort(address.port);
    });
  });
}

function request(port: number, path: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolveRequest, reject) => {
    const req = httpRequest({ hostname: "127.0.0.1", port, path, method: "POST", headers: { "content-type": "application/json" } }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolveRequest({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.once("error", reject);
    req.end(body);
  });
}

describe("Docker proxy relay", () => {
  it("forwards the request path and body only to its fixed target", async () => {
    let received = "";
    let receivedToken: string | undefined;
    const target = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received = `${req.url ?? ""}:${Buffer.concat(chunks).toString("utf8")}`;
        const token = req.headers["x-aob-proxy-token"];
        receivedToken = Array.isArray(token) ? token[0] : token;
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("target-ok");
      });
    });
    const targetPort = await listen(target);
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const relay = spawn(process.execPath, [join(root, "images/proxy-relay.mjs")], {
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", AOB_RELAY_TARGET_URL: `http://127.0.0.1:${targetPort}`, AOB_RELAY_PORT: "0", AOB_RELAY_AUTH_TOKEN: "relay-token" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    relay.stdout.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    try {
      let relayPort = 0;
      for (let attempt = 0; attempt < 50 && relayPort === 0; attempt += 1) {
        const line = output.trim().split("\n").find(Boolean);
        if (line !== undefined) {
          const parsed = JSON.parse(line) as { ready?: boolean; port?: number };
          if (parsed.ready === true && typeof parsed.port === "number") relayPort = parsed.port;
        }
        if (relayPort === 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
      }
      expect(relayPort).toBeGreaterThan(0);
      const response = await request(relayPort, "/v1/chat/completions", '{"model":"mock"}');
      expect(response).toEqual({ status: 200, body: "target-ok" });
      expect(received).toBe('/v1/chat/completions:{"model":"mock"}');
      expect(receivedToken).toBe("relay-token");
    } finally {
      relay.kill("SIGTERM");
      await new Promise<void>((resolveExit) => relay.once("close", () => resolveExit()));
      await new Promise<void>((resolveClose) => target.close(() => resolveClose()));
    }
  });
});
