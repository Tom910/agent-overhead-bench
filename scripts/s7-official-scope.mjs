import { validateOfficialScope } from "./official-profiles.mjs";
import { readFileSync } from "node:fs";

const scopePath = process.argv[2];
if (!scopePath) throw new Error("official scope path is required");
const scope = JSON.parse(readFileSync(scopePath, "utf8"));
const tools = scope.tools;
validateOfficialScope(scope);
if (process.argv[3] !== undefined && process.argv[3] !== "" && process.argv[3] !== scope.model) throw new Error("official tool scope model mismatch");
if (process.argv[4] !== undefined && process.argv[4] !== "" && process.argv[4] !== scope.upstream) throw new Error("official tool scope upstream mismatch");
process.stdout.write(tools.join(","));
