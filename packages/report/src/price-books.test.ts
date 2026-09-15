import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { priceBookPath, PRICE_BOOK_DIR } from "./price-books.js";

describe("priceBookPath", () => {
  it("resolves a dated book by its id", () => {
    expect(priceBookPath("openrouter-2026-08-27")).toBe(`${PRICE_BOOK_DIR}/openrouter-2026-08-27.json`);
    expect(priceBookPath("openrouter-2026-09-04")).toBe(`${PRICE_BOOK_DIR}/openrouter-2026-09-04.json`);
  });

  it("refuses an id that could escape the price-book directory", () => {
    // The id reaches this from a CLI argument and from recorded C4 evidence,
    // so it must never be able to name a file outside the directory.
    for (const id of ["..", "../secrets", "a/b", "a\\b", "/etc/passwd", "", ".", "a b", "a.json", "café"]) {
      expect(() => priceBookPath(id)).toThrow(/price book/i);
    }
  });

  it("accepts only lowercase dated identifiers", () => {
    expect(() => priceBookPath("OpenRouter-2026-08-27")).toThrow(/price book/i);
    expect(priceBookPath("vendor-1")).toBe(`${PRICE_BOOK_DIR}/vendor-1.json`);
  });
});

describe("published price books", () => {
  const files = readdirSync(PRICE_BOOK_DIR).filter((entry) => entry.endsWith(".json"));

  it("ships at least the frozen book every recorded run references", () => {
    expect(files).toContain("openrouter-2026-08-27.json");
  });

  it("declares an id matching its filename, with valid non-negative rates", () => {
    // A book is an immutable dated snapshot, so a run can always be re-priced
    // with the exact rates it ran under. Adding a model means adding a new
    // dated book, never editing a published one.
    for (const file of files) {
      const book = JSON.parse(readFileSync(join(PRICE_BOOK_DIR, file), "utf8"));
      expect(book.id).toBe(file.replace(/\.json$/, ""));
      expect(priceBookPath(book.id)).toBe(join(PRICE_BOOK_DIR, file));
      expect(Object.keys(book.models).length).toBeGreaterThan(0);
      for (const [model, rates] of Object.entries(book.models) as [string, Record<string, unknown>][]) {
        for (const key of ["input", "cached_input", "output"]) {
          expect(typeof rates[key], `${file} ${model}.${key}`).toBe("number");
          expect(rates[key] as number, `${file} ${model}.${key}`).toBeGreaterThanOrEqual(0);
        }
        expect(rates.cached_input as number, `${file} ${model}`).toBeLessThanOrEqual(rates.input as number);
      }
    }
  });
});
