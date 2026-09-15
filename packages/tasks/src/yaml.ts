import { readFileSync } from "node:fs";
import { validateC2Task, type C2TaskYaml } from "@aob/contracts";

/** Tiny YAML subset for C2 task.yaml (flat keys, source mapping, and [n, n] array). No extra dependency. */
export function parseTaskYaml(text: string): C2TaskYaml {
  const raw: Record<string, unknown> = {};
  const source: Record<string, unknown> = {};
  let inSource = false;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed === "source:") {
      inSource = true;
      continue;
    }
    const idx = trimmed.indexOf(":");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value: unknown = trimmed.slice(idx + 1).trim();
    if (typeof value === "string") {
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((s) => Number(s.trim()));
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        value = Number(value);
      } else if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
    }
    if (inSource && line.startsWith(" ")) source[key] = value;
    else {
      inSource = false;
      raw[key] = value;
    }
  }
  if (Object.keys(source).length > 0) raw.source = source;
  return validateC2Task(raw);
}

export function loadTaskYaml(path: string): C2TaskYaml {
  return parseTaskYaml(readFileSync(path, "utf8"));
}
