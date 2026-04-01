import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveImports } from "./imports.js";
import { parse } from "./parser.js";
import type { LogicSpec } from "./types.js";

const fixturesDir = resolve(import.meta.dirname!, "__fixtures__");

function loadFixture(name: string): LogicSpec {
	const content = readFileSync(resolve(fixturesDir, name), "utf-8");
	const result = parse(content);
	if (!result.ok) throw new Error(`Failed to parse fixture ${name}: ${result.errors[0]!.message}`);
	return result.data;
}

describe("resolveImports", () => {
	it("returns spec unchanged when no imports", () => {
		const spec: LogicSpec = { spec_version: "1.0", name: "no-imports" };
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.name).toBe("no-imports");
		}
	});

	it("resolves a single import and namespaces steps", () => {
		const spec = loadFixture("main.logic.md");
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			const stepKeys = Object.keys(result.data.steps ?? {});
			expect(stepKeys).toContain("base.analyze");
			expect(stepKeys).toContain("base.synthesize");
			expect(stepKeys).toContain("local_step");
			expect(result.data.steps!["base.synthesize"]!.needs).toEqual(["base.analyze"]);
		}
	});

	it("merges configs with local taking precedence", () => {
		const spec = loadFixture("main.logic.md");
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.reasoning?.strategy).toBe("react");
			expect(result.data.reasoning?.temperature).toBe(0.5);
		}
	});

	it("detects circular imports", () => {
		const spec = loadFixture("circular-a.logic.md");
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]!.type).toBe("circular_import");
			expect(result.errors[0]!.chain.length).toBeGreaterThan(0);
		}
	});

	it("reports file not found errors", () => {
		const spec: LogicSpec = {
			spec_version: "1.0",
			name: "missing-import",
			imports: [{ ref: "./nonexistent.logic.md", as: "x" }],
		};
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors[0]!.type).toBe("file_not_found");
		}
	});

	it("handles transitive imports (A->B->C)", () => {
		const spec = loadFixture("transitive-a.logic.md");
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			const stepKeys = Object.keys(result.data.steps ?? {});
			expect(stepKeys).toContain("b.c.deep_step");
			expect(stepKeys).toContain("b.mid_step");
			expect(stepKeys).toContain("top_step");
		}
	});

	it("strips imports array from resolved output", () => {
		const spec = loadFixture("main.logic.md");
		const result = resolveImports(spec, fixturesDir);
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.imports).toBeUndefined();
		}
	});
});
