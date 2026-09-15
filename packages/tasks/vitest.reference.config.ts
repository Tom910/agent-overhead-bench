import { defineConfig } from "vitest/config";

/** Used only by `npm run validate:reference`. Must include the overlay file. */
export default defineConfig({
  test: {
    include: ["src/validate.reference.test.ts"],
  },
});
