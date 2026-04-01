import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: ["packages/*"],
		coverage: {
			provider: "v8",
			include: [
				"packages/core/parser.ts",
				"packages/core/validator.ts",
				"packages/core/expression.ts",
				"packages/core/dag.ts",
				"packages/core/imports.ts",
				"packages/core/schema.ts",
			],
			reporter: ["text", "json-summary"],
			thresholds: {
				lines: 90,
				functions: 90,
				branches: 90,
				statements: 90,
			},
		},
	},
});
