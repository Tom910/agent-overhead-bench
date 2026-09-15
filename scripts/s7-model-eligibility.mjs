#!/usr/bin/env node
import { lstatSync, readFileSync } from "node:fs";

const [manifestPath, requestedModel, requestedUpstream, requestedTools] = process.argv.slice(2);
const fail = (message) => {
  process.stderr.write(`S7 eligibility: ${message}\n`);
  process.exit(1);
};

if (!manifestPath || !requestedModel || !requestedUpstream || !requestedTools) {
  fail("usage: s7-model-eligibility.mjs MANIFEST.json MODEL UPSTREAM TOOLS");
}
let manifest;
try {
  const info = lstatSync(manifestPath);
  if (!info.isFile() || info.isSymbolicLink()) fail("eligibility manifest must be a regular file");
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`eligibility manifest is unavailable or invalid: ${error instanceof Error ? error.message : String(error)}`);
}
if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) fail("eligibility manifest must be an object");
if (manifest.version !== 1) fail("eligibility manifest version must be 1");
if (typeof manifest.model !== "string" || manifest.model.trim() === "") fail("manifest model is missing");
if (typeof manifest.upstream !== "string" || manifest.upstream.trim() === "") fail("manifest upstream is missing");
if (manifest.model !== requestedModel) fail(`model mismatch: manifest has ${manifest.model}, request has ${requestedModel}`);
if (manifest.upstream !== requestedUpstream) fail(`upstream mismatch: manifest has ${manifest.upstream}, request has ${requestedUpstream}`);
if (!Array.isArray(manifest.tools)) fail("eligibility manifest tools must be an array");

const selected = requestedTools.split(",");
if (selected.length === 0 || selected.some((tool) => tool.trim() === "")) fail("selected tools must be nonempty");
if (new Set(selected).size !== selected.length) fail("selected tools contain a duplicate");
const records = new Map();
for (const record of manifest.tools) {
  if (record === null || typeof record !== "object" || Array.isArray(record) || typeof record.tool !== "string" || record.tool.trim() === "") fail("each eligibility record must name a tool");
  if (records.has(record.tool)) fail(`duplicate tool record: ${record.tool}`);
  records.set(record.tool, record);
}
if (records.size !== selected.length || selected.some((tool) => !records.has(tool))) fail("manifest must contain exactly one record for every selected tool");
if ([...records.keys()].some((tool) => !selected.includes(tool))) fail("manifest contains an unselected tool record");
const protocols = new Set(["anthropic_messages", "openai_chat", "openai_responses", "gemini_generate_content"]);
for (const tool of selected) {
  const record = records.get(tool);
  if (typeof record.protocol !== "string" || !protocols.has(record.protocol)) fail(`${tool} has an unsupported or missing protocol`);
  if (record.reviewed !== true) fail(`${tool} eligibility evidence is not reviewed`);
  if (record.eligible !== true) fail(`${tool} is explicitly ineligible for ${requestedModel} over ${requestedUpstream}: ${typeof record.reason === "string" ? record.reason : "no reason supplied"}`);
  if (typeof record.reason !== "string" || record.reason.trim() === "") fail(`${tool} eligibility record has no reason`);
}
process.stdout.write(`S7 eligibility: ${selected.length} reviewed adapter/model/protocol combinations accepted\n`);
