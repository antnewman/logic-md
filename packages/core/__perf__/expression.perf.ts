// =============================================================================
// Perf assertion: evaluate() throughput on repeated expressions
// =============================================================================
// Pins the cost of evaluating the same `{{ ... }}` expression 10,000 times
// against varying contexts. Catches regressions in tokenize/parse hot path
// (e.g. accidental disabling of an AST cache once one is added in PR 3).
// Threshold calibrated against current `main` (5 runs, take worst, +25%).
// =============================================================================

import { describe, expect, test } from "vitest";
import { evaluate } from "../index.js";

/**
 * Calibrated threshold for 10,000 evaluate() calls on the same template.
 *
 * Calibration methodology: 5 runs on `main`, take worst, ×1.25 for headroom.
 *
 * Calibration data captured 2026-05-07 on Node v22.18.0:
 *   run 1: 234.7ms
 *   run 2: 382.8ms
 *   run 3: 268.0ms
 *   run 4: 135.7ms
 *   run 5: 197.1ms
 *   worst = 382.8ms  →  ceil(382.8 × 1.25) = 479ms
 */
const EVAL_10K_THRESHOLD_MS = 479;

describe("perf: evaluate() throughput", () => {
	test(`evaluate same expression 10,000 times <${EVAL_10K_THRESHOLD_MS}ms`, () => {
		const tmpl = "{{ output.findings.length > 3 && output.confidence >= 0.6 }}";

		// Warm-up: prime the parser path.
		for (let i = 0; i < 100; i++) {
			evaluate(tmpl, { output: { findings: [], confidence: 0 } });
		}

		const t0 = performance.now();
		for (let i = 0; i < 10_000; i++) {
			evaluate(tmpl, {
				output: {
					findings: new Array(i % 5),
					confidence: (i % 100) / 100,
				},
			});
		}
		const elapsed = performance.now() - t0;

		expect(elapsed).toBeLessThan(EVAL_10K_THRESHOLD_MS);
	});
});
