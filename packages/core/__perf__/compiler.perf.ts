// =============================================================================
// Perf assertion: compileWorkflow scaling
// =============================================================================
// Pins the cost of compiling a 200-step linear-chain workflow against current
// `main`. Linear chains are the worst-case shape for `compileWorkflow` because
// every `compileStep` call re-resolves the full DAG (Candidate 1 in #46).
//
// Chain size of 200 (rather than 1000) keeps the bench under 2 seconds per
// run; once Candidate 1's fix lands the same workload should drop ~100×, and
// the assertion margin will widen dramatically — exactly the proof-of-fix
// signal Rain asked for in his sequencing comment.
//
// Threshold calibration methodology (per #46 review):
//   1. Run on `main` 5 times.
//   2. Take the worst observed elapsed time.
//   3. Multiply by 1.25 (Math.ceil) for slower-machine headroom.
//   4. Lock that value in as the assertion threshold.
//
// Calibration data captured 2026-05-07 on Node v22.18.0:
//   run 1: 1326.2ms
//   run 2: 1318.4ms
//   run 3: 1398.7ms
//   run 4:  746.8ms
//   run 5:  778.5ms
//   worst = 1398.7ms  →  ceil(1398.7 × 1.25) = 1749ms
// =============================================================================

import { describe, expect, test } from "vitest";
import { compileWorkflow } from "../index.js";
import { makeLinearChainSpec, makeWorkflowContext } from "./_helpers.js";

/**
 * Calibrated threshold for compileWorkflow on a 200-step linear chain.
 * See header comment for methodology and raw data.
 */
const COMPILE_200_STEP_THRESHOLD_MS = 1749;

describe("perf: compileWorkflow scaling", () => {
	test(`compileWorkflow on 200-step linear chain completes <${COMPILE_200_STEP_THRESHOLD_MS}ms`, () => {
		const spec = makeLinearChainSpec(200);
		const ctx = makeWorkflowContext();

		// Warm-up: let v8 optimise the hot path before measurement.
		compileWorkflow(spec, ctx);

		const t0 = performance.now();
		compileWorkflow(spec, ctx);
		const elapsed = performance.now() - t0;

		expect(elapsed).toBeLessThan(COMPILE_200_STEP_THRESHOLD_MS);
	});
});
