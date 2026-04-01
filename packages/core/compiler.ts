// =============================================================================
// LOGIC.md v1.1 - Compiler Module
// =============================================================================
// Pure functions only: no side effects, no I/O, no LLM calls, model-agnostic.
// These stubs define the compiler API surface. Phases 11-15 will implement
// the actual compilation logic.
// =============================================================================

import type {
	CompiledStep,
	CompiledWorkflow,
	ExecutionContext,
	LogicSpec,
	WorkflowContext,
} from "./types.js";

/** Error thrown by compiler functions */
export class CompilerError extends Error {
	override readonly name = "CompilerError";
}

/**
 * Compile a single named step from a LogicSpec into an executable form.
 *
 * Pure function -- no I/O, no side effects.
 */
export function compileStep(
	_spec: LogicSpec,
	_stepName: string,
	_context: ExecutionContext,
): CompiledStep {
	throw new CompilerError("Not implemented");
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
