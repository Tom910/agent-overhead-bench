import { parseQuery } from "./lib/query.mjs";
import { strict as assert } from "node:assert";
assert.deepEqual(parseQuery("a=1&b=2"), { a: "1", b: "2" });
assert.deepEqual(parseQuery(""), {});
console.log("ok");
