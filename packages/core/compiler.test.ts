import { describe, expect, it } from "vitest";
import { compileStep, CompilerError } from "./compiler.js";
import type { ExecutionContext, LogicSpec, Step } from "./types.js";

// =============================================================================
// Helpers
// =============================================================================

/** Build a minimal LogicSpec with given steps and optional reasoning */
function makeSpec(
	steps: Record<string, Step>,
	reasoning?: LogicSpec["reasoning"],
): LogicSpec {
	return {
		spec_version: "1.0",
		name: "test-spec",
		steps,
		reasoning,
	};
}

/** Build a minimal ExecutionContext */
function makeCtx(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
	return {
		currentStep: "test",
		previousOutputs: {},
		input: null,
		attemptNumber: 1,
		branchReason: null,
		...overrides,
	};
}

/** Research-synthesizer fixture (mirrors examples/research-synthesizer.logic.md) */
function researchSpec(): LogicSpec {
	return {
		spec_version: "1.0",
		name: "research-synthesizer",
		description:
			"Synthesizes multi-source research into structured reports with quality gates",
		reasoning: {
			strategy: "react",
			max_iterations: 12,
			temperature: 0.3,
			thinking_budget: 16000,
		},
		steps: {
			gather_sources: {
				description:
					"Search for and collect relevant sources on the research topic",
				instructions: [
					"Search for sources relevant to the query.",
					"Prioritize: peer-reviewed > official reports > news > blogs > forums.",
					"Minimum 3 independent sources required.",
				].join("\n"),
				output_schema: {
					type: "object",
					required: ["sources", "quality_scores"],
					properties: {
						sources: { type: "array", minItems: 3 },
						quality_scores: { type: "array" },
					},
				},
			},
			evaluate_credibility: {
				needs: ["gather_sources"],
				description:
					"Score each source for recency, authority, and corroboration",
				instructions: [
					"Evaluate each source for:",
					"- Recency (prefer last 12 months)",
					"- Authority (domain expertise of author/publication)",
					"- Corroboration (claims supported by other sources)",
					"Assign a credibility score 0.0-1.0 to each.",
				].join("\n"),
			},
			synthesize: {
				needs: ["evaluate_credibility"],
				description: "Combine findings into a coherent analysis",
				instructions: [
					"Cross-reference claims across minimum three independent sources.",
					"Lead with the most actionable insight.",
					"Flag any data gaps or low-confidence assessments.",
				].join("\n"),
			},
			expand_search: {
				needs: ["synthesize"],
				description:
					"Broaden search when initial sources are insufficient",
				instructions: [
					"Search additional databases and sources.",
					"Try alternative keywords and related topics.",
				].join("\n"),
			},
			draft_report: {
				needs: ["synthesize"],
				description: "Produce the final structured research report",
			},
		},
	};
}

// =============================================================================
// Error Cases
// =============================================================================

describe("compileStep error cases", () => {
	it("throws CompilerError for nonexistent step name", () => {
		const spec = researchSpec();
		expect(() =>
			compileStep(spec, "nonexistent", makeCtx()),
		).toThrow(CompilerError);
	});

	it("throws CompilerError when spec has no steps", () => {
		const spec = makeSpec({});
		expect(() => compileStep(spec, "any", makeCtx())).toThrow(
			CompilerError,
		);
	});

	it("throws CompilerError when steps is undefined", () => {
		const spec: LogicSpec = {
			spec_version: "1.0",
			name: "empty",
		};
		expect(() => compileStep(spec, "any", makeCtx())).toThrow(
			CompilerError,
		);
	});

	it("error message includes the missing step name", () => {
		const spec = researchSpec();
		expect(() =>
			compileStep(spec, "ghost_step", makeCtx()),
		).toThrow(/ghost_step/);
	});
});

// =============================================================================
// Strategy Preamble
// =============================================================================

describe("systemPromptSegment: strategy preamble", () => {
	it("contains reasoning strategy header and name", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain("## Reasoning Strategy");
		expect(result.systemPromptSegment).toContain("react");
	});

	it("contains max_iterations value", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain("12");
	});

	it("includes temperature when present", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain("Temperature");
		expect(result.systemPromptSegment).toContain("0.3");
	});

	it("includes thinking_budget when present", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain("Thinking budget");
		expect(result.systemPromptSegment).toContain("16000");
	});

	it("omits strategy preamble when spec has no reasoning block", () => {
		const spec = makeSpec({
			simple: { description: "A simple step" },
		});
		const result = compileStep(spec, "simple", makeCtx());
		expect(result.systemPromptSegment).not.toContain(
			"## Reasoning Strategy",
		);
	});

	it("shows 'unlimited' when max_iterations is not set", () => {
		const spec = makeSpec(
			{ step: { description: "test" } },
			{ strategy: "cot" },
		);
		const result = compileStep(spec, "step", makeCtx());
		expect(result.systemPromptSegment).toContain("unlimited");
	});

	it("omits temperature line when temperature not set", () => {
		const spec = makeSpec(
			{ step: { description: "test" } },
			{ strategy: "cot", max_iterations: 5 },
		);
		const result = compileStep(spec, "step", makeCtx());
		expect(result.systemPromptSegment).not.toContain("Temperature");
	});

	it("omits thinking_budget line when not set", () => {
		const spec = makeSpec(
			{ step: { description: "test" } },
			{ strategy: "cot", max_iterations: 5 },
		);
		const result = compileStep(spec, "step", makeCtx());
		expect(result.systemPromptSegment).not.toContain("Thinking budget");
	});
});

// =============================================================================
// Step Instructions
// =============================================================================

describe("systemPromptSegment: step instructions", () => {
	it("contains step name header", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain(
			"## Current Step: gather_sources",
		);
	});

	it("contains step description", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain(
			"Search for and collect relevant sources",
		);
	});

	it("contains step instructions text", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.systemPromptSegment).toContain(
			"Minimum 3 independent sources required",
		);
	});

	it("handles step with no instructions (description only)", () => {
		const spec = makeSpec({
			no_instructions: { description: "Just a description" },
		});
		const result = compileStep(spec, "no_instructions", makeCtx());
		expect(result.systemPromptSegment).toContain("Just a description");
		expect(result.systemPromptSegment).toContain(
			"## Current Step: no_instructions",
		);
	});

	it("handles step with no description (instructions only)", () => {
		const spec = makeSpec({
			no_desc: { instructions: "Do the thing" },
		});
		const result = compileStep(spec, "no_desc", makeCtx());
		expect(result.systemPromptSegment).toContain("Do the thing");
		expect(result.systemPromptSegment).toContain(
			"## Current Step: no_desc",
		);
	});

	it("handles step with neither description nor instructions", () => {
		const spec = makeSpec({ bare: {} });
		const result = compileStep(spec, "bare", makeCtx());
		expect(result.systemPromptSegment).toContain("## Current Step: bare");
	});
});

// =============================================================================
// Metadata
// =============================================================================

describe("metadata", () => {
	it("stepName matches the requested step", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.metadata.stepName).toBe("gather_sources");
	});

	it("dagLevel is 0 for root step (gather_sources)", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.metadata.dagLevel).toBe(0);
	});

	it("dagLevel is 1 for evaluate_credibility (depends on gather_sources)", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "evaluate_credibility", makeCtx());
		expect(result.metadata.dagLevel).toBe(1);
	});

	it("dagLevel is 2 for synthesize (depends on evaluate_credibility)", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "synthesize", makeCtx());
		expect(result.metadata.dagLevel).toBe(2);
	});

	it("dagLevel is 3 for draft_report and expand_search (depend on synthesize)", () => {
		const spec = researchSpec();
		const draft = compileStep(spec, "draft_report", makeCtx());
		const expand = compileStep(spec, "expand_search", makeCtx());
		expect(draft.metadata.dagLevel).toBe(3);
		expect(expand.metadata.dagLevel).toBe(3);
	});

	it("totalSteps equals number of steps in spec", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.metadata.totalSteps).toBe(5);
	});

	it("attemptNumber comes from context", () => {
		const spec = researchSpec();
		const result = compileStep(
			spec,
			"gather_sources",
			makeCtx({ attemptNumber: 3 }),
		);
		expect(result.metadata.attemptNumber).toBe(3);
	});

	it("branchTaken comes from context.branchReason", () => {
		const spec = researchSpec();
		const result = compileStep(
			spec,
			"gather_sources",
			makeCtx({ branchReason: "low_confidence" }),
		);
		expect(result.metadata.branchTaken).toBe("low_confidence");
	});

	it("branchTaken is null when context.branchReason is null", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.metadata.branchTaken).toBeNull();
	});
});

// =============================================================================
// Output Fields (stubs for future phases)
// =============================================================================

describe("compiled step output fields", () => {
	it("outputSchema is step.output_schema when present", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.outputSchema).toEqual({
			type: "object",
			required: ["sources", "quality_scores"],
			properties: {
				sources: { type: "array", minItems: 3 },
				quality_scores: { type: "array" },
			},
		});
	});

	it("outputSchema is null when step has no output_schema", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "evaluate_credibility", makeCtx());
		expect(result.outputSchema).toBeNull();
	});

	it("qualityGates is empty array", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.qualityGates).toEqual([]);
	});

	it("selfReflection is null", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.selfReflection).toBeNull();
	});

	it("retryPolicy is null", () => {
		const spec = researchSpec();
		const result = compileStep(spec, "gather_sources", makeCtx());
		expect(result.retryPolicy).toBeNull();
	});
});
