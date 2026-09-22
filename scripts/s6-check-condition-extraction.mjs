#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
if (process.argv.length !== 4) {
  process.stderr.write("usage: node scripts/s6-check-condition-extraction.mjs CONDITIONS_JSON RAW_RUN_PARENT_DIRECTORY\n");
  process.exit(1);
}
const root = fileURLToPath(new URL("../", import.meta.url));
const script = `import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {verifyConditionExtraction} from ${JSON.stringify(new URL("../packages/report/src/condition-extraction.ts", import.meta.url).href)};
try {
 const [document,rawRoot]=process.argv.slice(2);
 const records=JSON.parse(readFileSync(document,'utf8')).attempts;
 const runs=readdirSync(rawRoot,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>readFileSync(join(rawRoot,e.name,'run.json')));
 verifyConditionExtraction(records,runs);
 process.stdout.write('Verified '+records.length+' condition records against original C4 bytes.\\n');
} catch(error) { process.stderr.write(error.message+'\\n');process.exitCode=1; }
`;
const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--experimental-loader", `${root}scripts/ts-source-loader.mjs`, "--input-type=module", "-", ...process.argv.slice(2)], { input: script, stdio: ["pipe", "inherit", "inherit"] });
if (r.error) process.stderr.write(`${r.error.message}\n`);
process.exit(r.status ?? 1);
