import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateWithReference } from "./validate.js";

const suiteDir = join(dirname(fileURLToPath(import.meta.url)), "../suite");

describe("suite overlay (local only)", () => {
  it("errors if any task lacks reference/, otherwise pristine-patched verify passes", () => {
    const results = validateWithReference(suiteDir);
    const missing = results.filter((r) => r.detail.includes("reference missing"));
    if (missing.length > 0) {
      throw new Error(
        `reference overlay required locally: ${missing.map((m) => m.id).join(", ")}`,
      );
    }
    const failed = results.filter((r) => !r.ok);
    expect(failed, JSON.stringify(failed)).toEqual([]);
  }, 15_000);
});
