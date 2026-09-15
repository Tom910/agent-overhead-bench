import * as fs from "node:fs";
import { mkdtempSync, openSync, closeSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { ConfigError } from "@aob/contracts";
import { copyRedactedReleaseLog, copyRawEvidence, redactReleaseLog } from "./release-log.js";

vi.mock("node:fs", async (importOriginal) => ({ ...await importOriginal<typeof import("node:fs")>() }));

function copied(input: Buffer, chunkBytes = 65536, raw = false): Buffer {
  const root = mkdtempSync(join(tmpdir(), "aob-release-copy-"));
  const source = join(root,"source"); const destination = join(root,"destination");
  writeFileSync(source,input);
  const from = openSync(source,"r"); const to = openSync(destination,"w",0o600);
  const originalRead = fs.readSync;
  const reader = vi.spyOn(fs,"readSync").mockImplementation(((fd: number, buffer: Buffer, offset: number, length: number, position: number | null) =>
    originalRead(fd,buffer,offset,Math.min(length,chunkBytes),position)) as typeof fs.readSync);
  try {
    try {
      if (raw) copyRawEvidence(from,to); else copyRedactedReleaseLog(from,to);
    } finally { reader.mockRestore(); closeSync(from); closeSync(to); }
    return readFileSync(destination);
  } finally { rmSync(root,{recursive:true,force:true}); }
}

test("release redaction matches the original regex across byte boundaries", () => {
  const inputs = [
    "Sk-or-a SK-abcdefgh sk-abcdefg sk-or- sk-or-v1-",
    "sk-sk-or-a xsk-abcdefgh -sk-abcdefgh ésk-abcdefgh",
    "Bearer token\nBEARER\tsecret,\"punctuation\" next Bearer",
    "API_KEY=Bearer secret; xAPI_KEY : 'value', next authorization=second}",
    "OPENROUTER_API_KEY \t: \n\"private\" OPENAI_API_KEY='' ANTHROPIC_API_KEY: value",
    "authorization \t text API_KEY= \n, Bearer \t\n",
    "BearerBearer token x-api-key=''Bearer good next",
    "😀😀 prefix \u00a0API_KEY\u2028:\uFEFF'秘密😀'suffix 終",
    "plain😀".repeat(12),
  ];
  for (const input of inputs) {
    const bytes = Buffer.from(input);
    for (let size = 1; size <= Math.min(25,bytes.length); size++) {
      expect(copied(bytes,size).toString("utf8")).toBe(redactReleaseLog(input));
    }
  }
});

test("long secret bodies and valid or failed whitespace candidates remain bounded and complete", () => {
  const whitespace = " \t\u2028".repeat(100000);
  for (const input of [
    "before Bearer" + whitespace + "secret\nTAIL",
    "before Bearer" + whitespace,
    "before API_KEY" + whitespace + ":" + whitespace + "'secret',TAIL",
    "before API_KEY" + whitespace + "ordinary TAIL",
    "before API_KEY=" + whitespace + "'", 
    "sk-" + "x".repeat(2*1024*1024) + "!TAIL",
    "Bearer " + "x".repeat(2*1024*1024) + "\nTAIL",
    "API_KEY=" + "x".repeat(2*1024*1024) + "}TAIL",
    "benign😀".repeat(200000) + "TAIL",
  ]) expect(copied(Buffer.from(input)).toString("utf8")).toBe(redactReleaseLog(input));
});

test("invalid UTF-8 matches complete-string decoding, while raw copying preserves bytes", () => {
  const bytes = Buffer.concat([Buffer.from([0xff,0xf0,0x9f]),Buffer.from(" Bearer token\n終"),Buffer.from([0xe2,0x82])]);
  for (const size of [1,2,3,7,65536]) {
    expect(copied(bytes,size).toString("utf8")).toBe(redactReleaseLog(bytes.toString("utf8")));
    expect(copied(bytes,size,true)).toEqual(bytes);
  }
});

test("partial writes and rewinds preserve exact output without holes", () => {
  const originalWrite = fs.writeSync;
  const writer = vi.spyOn(fs,"writeSync").mockImplementation(((fd: number, buffer: Buffer, offset: number, length: number, position: number | null) =>
    originalWrite(fd,buffer,offset,Math.min(length,3),position)) as typeof fs.writeSync);
  try {
    const input = "prefix API_KEY" + " \t".repeat(100) + "='secret',tail😀 Bearer x\nend";
    expect(copied(Buffer.from(input),7).toString("utf8")).toBe(redactReleaseLog(input));
  } finally { writer.mockRestore(); }
});

test("read, write and rewind failures are typed and never emit a token body", () => {
  for (const operation of ["readSync","writeSync","ftruncateSync"] as const) {
    const root = mkdtempSync(join(tmpdir(),"aob-release-error-"));
    const source = join(root,"source"); const destination = join(root,"destination");
    writeFileSync(source,"API_KEY \t='private-token' tail");
    const from = openSync(source,"r"); const to = openSync(destination,"w",0o600);
    const failure = vi.spyOn(fs,operation).mockImplementation(() => { throw new Error("injected failure"); });
    try { expect(() => copyRedactedReleaseLog(from,to)).toThrow(ConfigError); }
    finally { failure.mockRestore(); closeSync(from); closeSync(to); }
    expect(readFileSync(destination,"utf8")).not.toContain("private-token");
    rmSync(root,{recursive:true,force:true});
  }
});
