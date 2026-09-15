import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { bindRunWindowResults } from "./window-ledger.js";

vi.mock("node:fs", async (importOriginal) => ({ ...await importOriginal<typeof import("node:fs")>() }));

it("binds log bytes without whole-file reads and preserves the exact digest", () => {
  const root = fs.mkdtempSync(join(tmpdir(), "aob-streamed-binding-"));
  const log = join(root, "stdout.log");
  const bytes = Buffer.alloc(2 * 1024 * 1024 + 17, 97);
  bytes[bytes.length - 1] = 98;
  const raw = JSON.stringify({ run_id: "test-run" });
  const digest = (value: string | Buffer) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
  try {
    fs.writeFileSync(log, bytes);
    fs.writeFileSync(join(root, "run.json"), raw);
    const original = fs.readFileSync;
    const spy = vi.spyOn(fs, "readFileSync").mockImplementation((...args: Parameters<typeof fs.readFileSync>) => {
      if (String(args[0]) === log) throw new Error("whole-file log read forbidden");
      return original(...args);
    });
    try {
      expect(bindRunWindowResults(root)).toEqual({
        run_ids_sha256: digest(JSON.stringify(["test-run"])),
        results_bytes_sha256: digest(JSON.stringify([
          { path: "run.json", sha256: digest(raw) },
          { path: "stdout.log", sha256: digest(bytes) },
        ])),
      });
    } finally { spy.mockRestore(); }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
