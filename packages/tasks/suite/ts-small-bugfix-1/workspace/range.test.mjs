import { range } from "./range.mjs";
import { strict as assert } from "node:assert";
assert.deepEqual(range(3), [0, 1, 2, 3]);
console.log("ok");
