import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Price books are dated snapshots. Each one is immutable once published, so a
 * recorded run can always be re-priced with the exact rates it was run under.
 * Adding a model therefore means adding a new dated book, never editing an
 * existing one.
 */
export const PRICE_BOOK_DIR = join(dirname(fileURLToPath(import.meta.url)), "../price-books");

const SAFE_PRICE_BOOK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Resolve a price-book id to its file path. The id arrives from CLI arguments
 * and from recorded C4 evidence, so it is validated rather than interpolated:
 * it must never be able to name a file outside the price-book directory.
 */
export function priceBookPath(id: string): string {
  if (typeof id !== "string" || id.length === 0 || id.length > 100 || !SAFE_PRICE_BOOK_ID.test(id)) {
    throw new Error(`invalid price book id: ${JSON.stringify(id)}`);
  }
  return join(PRICE_BOOK_DIR, `${id}.json`);
}
