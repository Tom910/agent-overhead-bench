import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { extractConditionRecord, verifyConditionExtraction } from "./condition-extraction.js";
it("reconciles extracted agent images with original C4 bytes and rejects edited facts", () => {
  const raw = readFileSync(new URL("../../../scripts/test-fixtures/default-mock/run.json", import.meta.url));
  const record = extractConditionRecord(raw);
  expect(record.agent_image).toBe("sha256:" + "b".repeat(64));
  expect(() => verifyConditionExtraction([record], [raw])).not.toThrow();
  expect(() => verifyConditionExtraction([{ ...record, agent_image: "sha256:" + "0".repeat(64) }], [raw])).toThrow(/agent_image/);
  expect(() => verifyConditionExtraction([record], [Buffer.from(raw.toString() + "\n")])).toThrow(/run_sha256/);
  expect(() => verifyConditionExtraction([record, record], [raw, raw])).toThrow(/duplicate/);
});
