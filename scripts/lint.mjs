#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const roots = ["packages", "scripts", "images"].map((name) => join(root, name));
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && (path.endsWith(".mjs") || path.endsWith(".sh"))) files.push(path);
  }
}

for (const dir of roots) {
  if (statSync(dir).isDirectory()) walk(dir);
}

for (const path of files.sort()) {
  const javascript = path.endsWith(".mjs");
  const shell = /^#![^\n]*\bbash\b/.test(readFileSync(path, "utf8")) ? "bash" : "sh";
  const command = javascript ? process.execPath : shell;
  const args = javascript ? ["--check", path] : ["-n", path];
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    process.stderr.write(relative(root, path) + " failed " + (javascript ? "node --check" : `${shell} -n`) + "\n");
    process.stderr.write(result.stderr);
    process.exit(1);
  }
}

process.stdout.write("lint passed (" + files.length + " JavaScript/shell files)\n");
