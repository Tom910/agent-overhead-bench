import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".js")) {
    const resolved = specifier.startsWith("file:")
      ? specifier
      : specifier.startsWith(".") && context.parentURL
        ? new URL(specifier, context.parentURL).href
        : null;
    if (resolved) {
      const path = fileURLToPath(resolved);
      const tsPath = `${path.slice(0, -3)}.ts`;
      if (existsSync(tsPath)) return nextResolve(pathToFileURL(tsPath).href, context);
    }
  }
  return nextResolve(specifier, context);
}
