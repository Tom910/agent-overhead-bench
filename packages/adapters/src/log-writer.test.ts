import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { spawnAdapter } from "./spawn.js";

test("host logs grow before child exit and preserve separate streams", async () => {
  const dir = mkdtempSync(join(tmpdir(), "aob-stream-log-"));
  try {
    const script = join(dir, "agent.mjs");
    writeFileSync(script, `import {statSync} from 'node:fs';
process.stdout.write('x'.repeat(100000));
process.stderr.write('stderr sentinel\\n');
setTimeout(() => {
  try { if (statSync('stdout.log').size < 90000) process.exit(9); }
  catch { process.exit(8); }
  process.stdout.write('tail sentinel\\n');
}, 200);`);
    const result = await spawnAdapter({bin:script,argv:[],cwd:dir,env:{},timeoutS:5,extraRedact:[]});
    expect(result.exitCode).toBe(0);
    expect(readFileSync(result.artifacts.stdoutPath,"utf8")).toBe('x'.repeat(100000)+'tail sentinel\n');
    expect(readFileSync(result.artifacts.stderrPath,"utf8")).toBe('stderr sentinel\n');
    expect(statSync(result.artifacts.stdoutPath).mode & 0o777).toBe(0o600);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

import { createRunLogWriter } from "./log-writer.js";
import { redact } from "./redact.js";
import { ToolError } from "@aob/contracts";

function streamed(chunks: Buffer[], extra: string[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), "aob-redact-"));
  try {
    const path = join(dir, "log");
    const writer = createRunLogWriter(path, extra);
    try { for (const chunk of chunks) writer.write(chunk); } finally { writer.close(); }
    return readFileSync(path, "utf8");
  } finally { rmSync(dir, {recursive:true,force:true}); }
}

test("redaction matches complete input at every byte split, including UTF-8", () => {
  const cases = [
    ["prefix sk-a sk-or-test___! Bearer \t abcdef xyz 😀終suffix", []],
    ["sk- sk-or- BearerZ Bearer", []],
    ["prefix private-secret-value suffix private-secret-value", ["private-secret-value"]],
    ["abcdefghijk abcdefghijk [redacted]", ["abcdefgh", "[redacted]ijk", "[redacted]"]],
    ["aaaaaaaaaaaaaaa", ["aaaaaaaa", "aaaaaaaaa"]],
    ["😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀", ["unused-secret"]],
    ["abc sk-token😀 😀xyz Bearer token\nend", []],
  ] as const;
  for (const [input, extra] of cases) {
    const bytes = Buffer.from(input);
    const expected = redact(input, [...extra]);
    for (let split = 0; split <= bytes.length; split++) {
      expect(streamed([bytes.subarray(0,split),bytes.subarray(split)], [...extra])).toBe(expected);
    }
    expect(streamed([...bytes].map(byte => Buffer.from([byte])), [...extra])).toBe(expected);
  }
});

test("long tokens are suppressed and long benign lines retain their tail", () => {
  const megabyte = Buffer.alloc(1024 * 1024, "x");
  expect(streamed([Buffer.from("before sk-"),megabyte,megabyte,Buffer.from("!after")])).toBe("before [redacted]!after");
  expect(streamed([Buffer.from("Bearer \t"),megabyte,megabyte,Buffer.from("\nafter")])).toBe("[redacted]\nafter");
  expect(streamed([megabyte,megabyte,Buffer.from("sentinel")])).toBe("x".repeat(2*1024*1024)+"sentinel");
});

test("unfinished Bearer whitespace is conservatively redacted at EOF", () => {
  expect(streamed([Buffer.from("before Bearer"), Buffer.from(" \t\n")])).toBe("before [redacted]");
  expect(streamed([Buffer.from("sk- Bearer")])).toBe("sk- Bearer");
  expect(streamed([Buffer.from("sk-a")])).toBe("[redacted]");
  expect(streamed([Buffer.from([0xf0,0x9f])])).toBe("�");
});

test("log lifecycle uses private permissions, idempotent close, and typed errors", () => {
  const dir = mkdtempSync(join(tmpdir(), "aob-log-life-"));
  try {
    const path = join(dir,"log");
    writeFileSync(path,"old",{mode:0o644});
    const writer = createRunLogWriter(path);
    writer.write(Buffer.from("complete"));
    writer.close(); writer.close();
    expect(readFileSync(path,"utf8")).toBe("complete");
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(() => writer.write(Buffer.from("bad"))).toThrow(ToolError);
    expect(() => createRunLogWriter(join(dir,"missing","log"))).toThrow(ToolError);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test("host spawn failure and timeout retain finalized logs", async () => {
  const dir = mkdtempSync(join(tmpdir(), "aob-log-exit-"));
  try {
    const opts = {bin:join(dir,"missing"),argv:[],cwd:dir,env:{},timeoutS:5,extraRedact:[]};
    const missing = await spawnAdapter(opts);
    expect(missing.exitCode).toBe(127);
    expect(readFileSync(missing.artifacts.stdoutPath,"utf8")).toBe("");
    const script = join(dir,"hang.mjs");
    writeFileSync(script,"process.stdout.write('final sk-secret'); setInterval(() => {}, 1000);");
    const timeout = await spawnAdapter({...opts,bin:script,timeoutS:0.5});
    expect(timeout.exitCode).toBe(124);
    expect(readFileSync(timeout.artifacts.stdoutPath,"utf8")).toBe("final [redacted]");
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
