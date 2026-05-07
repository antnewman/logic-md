// =============================================================================
// Perf assertion: resolve() scaling on a 1000-step linear chain
// =============================================================================
// Pins the cost of topological sort + level grouping on the worst-case DAG
// shape (linear chain, where depth = N). Catches regressions in the per-pop
// queue sort, neighbour sort, and level-filter loop in `dag.ts`.
// Threshold calibrated against current `main` (5 runs, take worst, +25%).
// =============================================================================

import { describe, expect, test } from "vitest";
import { resolve } from "../index.js";
import { makeLinearChainSteps } from "./_helpers.js";

/**
 * Calibrated threshold for resolve() on a 1000-step linear chain.
 *
 * Calibration methodology: 5 runs on `main`, take worst, ×1.25 for headroom.
 *
 * Calibration data captured 2026-05-07 on Node v22.18.0:
 *   run 1: 152.1ms
 *   run 2: 215.0ms
 *   run 3: 117.9ms
 *   run 4: 128.4ms
 *   run 5: 143.9ms
 *   worst = 215.0ms  →  ceil(215.0 × 1.25) = 269ms
 */
const RESOLVE_1000_STEP_THRESHOLD_MS = 269;

describe("perf: dag.resolve scaling", () => {
	test(`resolve(1000-step linear chain) completes <${RESOLVE_1000_STEP_THRESHOLD_MS}ms`, () => {
		const steps = makeLinearChainSteps(1000);

		// Warm-up.
		const warm = resolve(steps);
		expect(warm.ok).toBe(true);

		const t0 = performance.now();
		const r = resolve(steps);
		const elapsed = performance.now() - t0;

		expect(r.ok).toBe(true);
		expect(elapsed).toBeLessThan(RESOLVE_1000_STEP_THRESHOLD_MS);
	});
});
