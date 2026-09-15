#!/usr/bin/env node
import { resolve } from "node:path";
import { ConfigError } from "@aob/contracts";
import { validatePristine, validateWithReference } from "./validate.js";

const args = process.argv.slice(2);
const source = args.find((arg) => !arg.startsWith("--"));
if (source === undefined) throw new ConfigError("usage: aob-task-validate SOURCE_DIR [--reference]");
if (args.some((arg) => arg !== source && arg !== "--reference")) {
  throw new ConfigError("usage: aob-task-validate SOURCE_DIR [--reference]");
}

const results = args.includes("--reference")
  ? validateWithReference(resolve(source))
  : validatePristine(resolve(source));
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
if (results.some((result) => !result.ok)) process.exitCode = 1;
