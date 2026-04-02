// =============================================================================
// LOGIC.md v1.1 - Compiler Module
// =============================================================================
// Pure functions only: no side effects, no I/O, no LLM calls, model-agnostic.
// =============================================================================

import { resolve } from "./dag.js";
import type {
	CompiledStep,
	CompiledWorkflow,
	ExecutionContext,
	LogicSpec,
	Reasoning,
	Step,
	WorkflowContext,
} from "./types.js";

/** Error thrown by compiler functions */
export class CompilerError extends Error {
	override readonly name = "CompilerError";
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Format the reasoning strategy preamble section.
 * Returns empty string if no reasoning config is provided.
 */
function formatStrategyPreamble(reasoning: Reasoning): string {
	const lines: string[] = [
		"## Reasoning Strategy",
		`You are using ${reasoning.strategy} reasoning.`,
		`Max iterations: ${reasoning.max_iterations ?? "unlimited"}`,
	];

	if (reasoning.temperature !== undefined) {
		lines.push(`Temperature: ${reasoning.temperature}`);
	}

	if (reasoning.thinking_budget !== undefined) {
		lines.push(`Thinking budget: ${reasoning.thinking_budget} tokens`);
	}

	return lines.join("\n");
}

/**
 * Format the step instructions section.
 * Handles missing description and/or instructions gracefully.
 */
function formatStepInstructions(stepName: string, step: Step): string {
	const lines: string[] = [`## Current Step: ${stepName}`];

	if (step.description) {
		lines.push(step.description);
	}

	if (step.instructions) {
		if (step.description) {
			lines.push(""); // blank line between description and instructions
		}
		lines.push(step.instructions);
	}

	return lines.join("\n");
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Compile a single named step from a LogicSpec into an executable form.
 *
 * Pure function -- no I/O, no side effects.
 */
export function compileStep(
	spec: LogicSpec,
	stepName: string,
	context: ExecutionContext,
): CompiledStep {
	const steps = spec.steps;

	if (!steps || Object.keys(steps).length === 0) {
		throw new CompilerError(`Cannot compile step "${stepName}": spec has no steps`);
	}

	const step = steps[stepName];
	if (!step) {
		throw new CompilerError(`Step "${stepName}" not found in spec "${spec.name}"`);
	}

	// Resolve DAG to compute depth levels
	const dagResult = resolve(steps);
	let dagLevel = 0;
	if (dagResult.ok) {
		for (let level = 0; level < dagResult.levels.length; level++) {
			const levelSteps = dagResult.levels[level];
			if (levelSteps?.includes(stepName)) {
				dagLevel = level;
				break;
			}
		}
	}

	// Build systemPromptSegment
	const segments: string[] = [];

	if (spec.reasoning) {
		segments.push(formatStrategyPreamble(spec.reasoning));
	}

	segments.push(formatStepInstructions(stepName, step));

	const systemPromptSegment = segments.join("\n\n");

	return {
		systemPromptSegment,
		outputSchema: (step.output_schema as object) ?? null,
		qualityGates: [],
		selfReflection: null,
		retryPolicy: null,
		metadata: {
			stepName,
			dagLevel,
			totalSteps: Object.keys(steps).length,
			attemptNumber: context.attemptNumber,
			branchTaken: context.branchReason,
		},
	};
}

/**
 * Compile an entire workflow (all steps + DAG ordering) from a LogicSpec.
 *
 * Pure function -- no I/O, no side effects.
 */
export function compileWorkflow(_spec: LogicSpec, _context: WorkflowContext): CompiledWorkflow {
	throw new CompilerError("Not implemented");
}

/**
 * Estimate token count for a text string.
 *
 * Pure function -- no I/O, no side effects.
 */
export function estimateTokens(_text: string): number {
	throw new CompilerError("Not implemented");
}
