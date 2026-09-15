import { fileURLToPath } from 'node:url';
export class ProfileError extends Error {}
const definitions = new Map([
  ['glm-5.3-flash-openrouter', { model: 'z-ai/glm-5.3-flash', scope: 's7-official-tool-scope.json', eligibility: 's7-official-eligibility.json', decision: 's2-decision-record.md' }],
  ['deepseek-v4.1-flash-openrouter', { model: 'deepseek/deepseek-v4.1-flash', scope: 's7-deepseek-tool-scope.json', eligibility: 's7-deepseek-eligibility.json', decision: 's2-deepseek-decision-record.md' }],
]);
export function profileFiles(profile = 'glm-5.3-flash-openrouter') {
  const value = definitions.get(profile);
  if (!value) throw new ProfileError('official profile is not approved');
  return { model: value.model, ...Object.fromEntries(['scope', 'eligibility', 'decision'].map(key => [key, fileURLToPath(new URL(`../plans/${value[key]}`, import.meta.url))])) };
}
export function validateOfficialScope(scope) {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope) || typeof scope.profile !== 'string') throw new ProfileError('official tool scope is malformed');
  const tools = scope.tools;
if (scope.version !== 1 || scope.model !== profileFiles(scope.profile).model || scope.upstream !== "https://openrouter.ai/api" ||
  !Array.isArray(tools) || tools.length < 5 || tools.length > 7 || tools.some((tool) => typeof tool !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(tool)) || new Set(tools).size !== tools.length ||
  !Array.isArray(scope.excluded) || new Set(scope.excluded.map((entry) => entry?.tool)).size !== scope.excluded.length || scope.excluded.some((entry) => typeof entry?.tool !== "string" || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.tool) || typeof entry?.reason !== "string" || entry.reason.trim() === "" || tools.includes(entry.tool))) {
  throw new ProfileError("official tool scope is malformed");
}
  return scope;
}

export function assertProfileConditions(profile, model, priceBook, routing) {
  const approved = profileFiles(profile);
  if (profile !== 'deepseek-v4.1-flash-openrouter') return;
  if (model !== approved.model) throw new ProfileError('official profile model mismatch');
  if (priceBook !== 'deepseek-v41-low-2026-09-10') throw new ProfileError('DeepSeek profile price book mismatch');
  if (routing?.only_provider !== 'deepseek' || routing.allow_fallbacks !== false ||
      !Array.isArray(routing.ignored_providers) || routing.ignored_providers.length !== 1 || routing.ignored_providers[0] !== 'relace') {
    throw new ProfileError('DeepSeek profile requires only provider deepseek, no fallback, and the approved Relace exclusion');
  }
}
