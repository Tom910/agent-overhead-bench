import { sum } from "./sum.mjs";
import { strict as assert } from "node:assert";
assert.equal(sum([1, 2, 3]), 6);
assert.equal(sum([]), 0);
console.log("ok");
