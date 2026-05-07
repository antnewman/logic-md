// =============================================================================
// Vitest config for the bench suite (`npm run bench`)
// =============================================================================
// Picks up only `__perf__/**/*.perf.ts`, runs them serially in a single fork
// for stable timings, and bypasses the default `**/*.test.ts` glob so the
// bench suite never runs as part of `npm test`.
// =============================================================================

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["**/__perf__/**/*.perf.ts"],
		// One fork, serialised, to minimise cross-test interference on timings.
		// (vitest 4 moved pool sub-options to top level; `pool: "forks"` plus
		// per-file warm-up is sufficient for stable timings here.)
		pool: "forks",
		// 60s ceiling — well above any realistic threshold; only fires on hangs.
		testTimeout: 60_000,
	},
});
