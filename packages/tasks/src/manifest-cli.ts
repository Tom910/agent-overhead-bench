#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import { createLocalTaskManifest } from "./source.js";

const source = process.argv[2];
const output = process.argv[3];
if (!source || !output) throw new ConfigError("usage: manifest-cli SOURCE_DIR OUTPUT_JSON");
const manifest = await createLocalTaskManifest(source);
writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
