#!/usr/bin/env node
import { ConfigError } from "@aob/contracts";
import { startProxy } from "./proxy.js";

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(name);
  const v = i >= 0 ? process.argv[i + 1] : fallback;
  if (!v) {
    throw new ConfigError(`missing ${name}`);
  }
  return v;
}

const port = Number(arg("--port", "0"));
const handle = await startProxy({
  run_id: arg("--run-id"),
  upstream: arg("--upstream"),
  outPath: arg("--out"),
  port,
});
process.stdout.write(`${handle.baseUrl}\n`);
const stop = () => {
  void handle.close().then(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
