import { readFileSync } from "node:fs";
import { dirname, normalize, resolve } from "node:path";
import { parse } from "./parser.js";
import type { LogicSpec, Step } from "./types.js";

export interface ImportError {
	type: "file_not_found" | "parse_error" | "circular_import" | "merge_error";
	message: string;
	chain: string[];
}

export interface ImportSuccess {
	ok: true;
	data: LogicSpec;
}

export interface ImportFailure {
	ok: false;
	errors: ImportError[];
}

export type ImportResult = ImportSuccess | ImportFailure;

export function resolveImports(spec: LogicSpec, basedir: string): ImportResult {
	return resolveImportsRecursive(spec, basedir, new Set<string>(), []);
}

function resolveImportsRecursive(
	spec: LogicSpec,
	basedir: string,
	visited: Set<string>,
	chain: string[],
): ImportResult {
	if (!spec.imports?.length) {
		return { ok: true, data: spec };
	}

	// Check for duplicate `as` namespaces
	const namespaces = spec.imports.map((imp) => imp.as);
	const seen = new Set<string>();
	for (const ns of namespaces) {
		if (seen.has(ns)) {
			return {
				ok: false,
				errors: [
					{
						type: "merge_error",
						message: `Duplicate namespace "${ns}" in imports`,
						chain,
					},
				],
			};
		}
		seen.add(ns);
	}

	// Process imports in order (first = lowest precedence)
	let accumulated: LogicSpec = { spec_version: "1.0", name: "" };

	for (const imp of spec.imports) {
		const absPath = normalize(resolve(basedir, imp.ref));

		// Circular detection
		if (visited.has(absPath)) {
			return {
				ok: false,
				errors: [
					{
						type: "circular_import",
						message: `Circular import detected: ${[...chain, absPath].join(" -> ")}`,
						chain: [...chain, absPath],
					},
				],
			};
		}

		// Read file
		let content: string;
		try {
			content = readFileSync(absPath, "utf-8");
		} catch {
			return {
				ok: false,
				errors: [
					{
						type: "file_not_found",
						message: `Import file not found: ${absPath}`,
						chain: [...chain, absPath],
					},
				],
			};
		}

		// Parse
		const parseResult = parse(content);
		if (!parseResult.ok) {
			return {
				ok: false,
				errors: [
					{
						type: "parse_error",
						message: `Failed to parse import ${absPath}: ${parseResult.errors[0]!.message}`,
						chain: [...chain, absPath],
					},
				],
			};
		}

		// Add to visited before recursing
		visited.add(absPath);

		// Recurse for transitive imports
		const resolved = resolveImportsRecursive(parseResult.data, dirname(absPath), visited, [
			...chain,
			absPath,
		]);
		if (!resolved.ok) {
			return resolved;
		}

		// Namespace and merge
		const namespaced = namespaceSpec(resolved.data, imp.as);
		accumulated = mergeSpecs(accumulated, namespaced);
	}

	// Apply local spec on top (local wins)
	const local = stripImports(spec);
	const merged = mergeSpecs(accumulated, local);

	return { ok: true, data: merged };
}

function stripImports(spec: LogicSpec): LogicSpec {
	const { imports: _, ...rest } = spec;
	return rest as LogicSpec;
}

function namespaceSpec(spec: LogicSpec, ns: string): LogicSpec {
	const result = { ...spec };

	// Namespace steps
	if (spec.steps) {
		const namespacedSteps: Record<string, Step> = {};
		for (const [key, step] of Object.entries(spec.steps)) {
			const newKey = `${ns}.${key}`;
			const namespacedStep = { ...step };

			// Namespace needs references
			if (namespacedStep.needs) {
				namespacedStep.needs = namespacedStep.needs.map((need) => `${ns}.${need}`);
			}

			// Namespace parallel_steps references
			if (namespacedStep.parallel_steps) {
				namespacedStep.parallel_steps = namespacedStep.parallel_steps.map((s) => `${ns}.${s}`);
			}

			// Namespace branch then references
			if (namespacedStep.branches) {
				namespacedStep.branches = namespacedStep.branches.map((branch) => ({
					...branch,
					then: branch.then ? `${ns}.${branch.then}` : branch.then,
				}));
			}

			namespacedSteps[newKey] = namespacedStep;
		}
		result.steps = namespacedSteps;
	}

	// Namespace decision_trees
	if (spec.decision_trees) {
		const namespacedTrees: Record<string, unknown> = {};
		for (const [key, tree] of Object.entries(spec.decision_trees)) {
			namespacedTrees[`${ns}.${key}`] = tree;
		}
		result.decision_trees = namespacedTrees as typeof spec.decision_trees;
	}

	return result;
}

function mergeSpecs(base: LogicSpec, override: LogicSpec): LogicSpec {
	const result: LogicSpec = {
		spec_version: override.spec_version || base.spec_version,
		name: override.name || base.name,
	};

	if (override.description ?? base.description) {
		result.description = override.description ?? base.description;
	}

	// Merge reasoning (shallow merge, override wins)
	if (base.reasoning || override.reasoning) {
		result.reasoning = { ...base.reasoning, ...override.reasoning } as LogicSpec["reasoning"];
	}

	// Merge steps (record merge)
	if (base.steps || override.steps) {
		result.steps = { ...base.steps, ...override.steps };
	}

	// Merge contracts (shallow merge)
	if (base.contracts || override.contracts) {
		result.contracts = { ...base.contracts, ...override.contracts } as LogicSpec["contracts"];
	}

	// Merge quality_gates (shallow merge)
	if (base.quality_gates || override.quality_gates) {
		result.quality_gates = {
			...base.quality_gates,
			...override.quality_gates,
		} as LogicSpec["quality_gates"];
	}

	// Merge decision_trees (record merge)
	if (base.decision_trees || override.decision_trees) {
		result.decision_trees = { ...base.decision_trees, ...override.decision_trees };
	}

	// Merge fallback (override wins entirely)
	if (override.fallback ?? base.fallback) {
		result.fallback = override.fallback ?? base.fallback;
	}

	// Merge metadata (shallow merge)
	if (base.metadata || override.metadata) {
		result.metadata = { ...base.metadata, ...override.metadata };
	}

	return result;
}
