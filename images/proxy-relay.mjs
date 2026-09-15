#!/usr/bin/env node
/**
 * Runner-owned, fixed-destination HTTP relay for isolated agent containers.
 * It deliberately has no configuration for arbitrary upstream destinations.
 */
import http from "node:http";

const targetText = process.env.AOB_RELAY_TARGET_URL;
const listenHost = process.env.AOB_RELAY_HOST || "0.0.0.0";
const listenPort = Number(process.env.AOB_RELAY_PORT || "8080");
const authToken = process.env.AOB_RELAY_AUTH_TOKEN;
if (!targetText) throw new Error("AOB_RELAY_TARGET_URL is required");
if (!Number.isInteger(listenPort) || listenPort < 0 || listenPort > 65535) throw new Error("AOB_RELAY_PORT is invalid");

const target = new URL(targetText);
if (target.protocol !== "http:" || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
  throw new Error("AOB_RELAY_TARGET_URL must be a credential-free HTTP origin");
}

const hopByHop = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
]);

function forwardedHeaders(headers) {
  const result = {};
  for (const [name, value] of Object.entries(headers)) {
    if (!hopByHop.has(name.toLowerCase()) && name.toLowerCase() !== "host" && name.toLowerCase() !== "x-aob-proxy-token") result[name] = value;
  }
  result.host = target.host;
  if (authToken !== undefined) result["x-aob-proxy-token"] = authToken;
  return result;
}

const server = http.createServer((request, response) => {
  if (request.method === "GET" && request.url === "/__aob_health") {
    response.writeHead(204);
    response.end();
    return;
  }
  const upstream = http.request({
    hostname: target.hostname,
    port: target.port || 80,
    method: request.method,
    path: request.url || "/",
    headers: forwardedHeaders(request.headers),
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.once("error", () => {
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain" });
    response.end("relay upstream unavailable\n");
  });
  request.pipe(upstream);
});

server.listen(listenPort, listenHost, () => {
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("relay did not bind");
  process.stdout.write(`${JSON.stringify({ ready: true, port: address.port })}\n`);
});

function close() {
  server.close(() => process.exit(0));
}
process.once("SIGTERM", close);
process.once("SIGINT", close);
