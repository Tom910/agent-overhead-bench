import { hasHttp, hasFile } from "./text.mjs";
import { strict as assert } from "node:assert";
assert.equal(hasHttp("https://x"), true);
assert.equal(hasHttp("ftp://x"), false);
assert.equal(hasFile("file://x"), true);
console.log("ok");
