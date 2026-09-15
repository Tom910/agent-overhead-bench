import { profileFiles, ProfileError, assertProfileConditions } from './official-profiles.mjs';
const field = process.argv[3];
if (field === 'assert') {
  assertProfileConditions(process.argv[2] || 'glm-5.3-flash-openrouter', process.argv[4], process.argv[5], { only_provider: process.argv[6], allow_fallbacks: false, ignored_providers: (process.argv[7] || '').split(',').filter(Boolean) });
  process.exit(0);
}
if (!['scope', 'eligibility', 'decision'].includes(field)) throw new ProfileError('unknown official profile field');
process.stdout.write(profileFiles(process.argv[2] || undefined)[field]);
