import { describe, expect, it } from "vitest";
import { createValidator, getSchema } from "./schema.js";

describe("LogicSpec JSON Schema", () => {
	it("schema.json is valid JSON Schema draft-07", () => {
		const schema = getSchema();
		expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
		expect(schema.title).toBe("LogicSpec");
		const required = schema.required as string[];
		expect(required).toContain("spec_version");
		expect(required).toContain("name");
	});

	it("validates minimal valid LogicSpec", () => {
		const validate = createValidator();
		const valid = validate({ spec_version: "1.0", name: "test" });
		expect(valid).toBe(true);
		expect(validate.errors).toBeNull();
	});

	it("validates complete LogicSpec with all sections", () => {
		const validate = createValidator();
		const spec = {
			spec_version: "1.0",
			name: "full-spec",
			description: "A complete spec for testing",
			imports: [{ ref: "./other.logic.md", as: "other" }],
			reasoning: {
				strategy: "cot",
				max_iterations: 5,
				temperature: 0.7,
				thinking_budget: 4096,
				strategy_config: { depth: 3 },
			},
			steps: {
				analyze: {
					description: "Analyze input",
					instructions: "Think step by step",
					input_schema: { type: "object" },
					output_schema: { type: "object" },
					confidence: { minimum: 0.7, target: 0.9, escalate_below: 0.5 },
					branches: [
						{ if: "{{ confidence > 0.9 }}", then: "output" },
						{ default: true, then: "refine" },
					],
					retry: {
						max_attempts: 3,
						initial_interval: "1s",
						backoff_coefficient: 2.0,
						maximum_interval: "30s",
						non_retryable_errors: ["auth_error"],
					},
					verification: {
						check: "{{ output.valid == true }}",
						on_fail: "retry",
						on_fail_message: "Output not valid",
					},
					timeout: "30s",
					allowed_tools: ["search"],
					denied_tools: ["execute"],
					execution: "sequential",
				},
			},
			contracts: {
				inputs: [
					{
						name: "query",
						type: "string",
						required: true,
						description: "User query",
					},
				],
				outputs: [
					{
						name: "answer",
						type: "object",
						required: ["text"],
						properties: { text: { type: "string" } },
					},
				],
				capabilities: {
					name: "Analyzer",
					version: "1.0.0",
					supported_domains: ["analysis"],
					max_input_tokens: 8000,
				},
				validation: {
					mode: "strict",
					on_input_violation: "reject",
					on_output_violation: "retry",
				},
			},
			quality_gates: {
				pre_output: [
					{
						name: "confidence-check",
						check: "{{ confidence >= 0.8 }}",
						severity: "error",
						on_fail: "retry",
					},
				],
				invariants: [
					{
						name: "no-hallucination",
						check: "{{ grounded == true }}",
						on_breach: "escalate",
					},
				],
				self_verification: {
					enabled: true,
					strategy: "rubric",
					rubric: {
						criteria: [
							{ name: "accuracy", weight: 0.6 },
							{ name: "relevance", weight: 0.4 },
						],
						minimum_score: 0.7,
					},
				},
			},
			decision_trees: {
				route: {
					description: "Route based on input type",
					root: "check_type",
					nodes: {
						check_type: {
							condition: "{{ input.type }}",
							branches: [
								{ value: "text", next: "text_handler" },
								{ default: true, next: "fallback_handler" },
							],
						},
					},
					terminals: {
						text_handler: { action: "analyze", message: "Processing text" },
						fallback_handler: { action: "skip", message: "Unsupported type" },
					},
				},
			},
			fallback: {
				strategy: "graceful_degrade",
				escalation: [
					{
						level: 1,
						trigger: "{{ failures > 2 }}",
						action: "switch_strategy",
						new_strategy: "react",
						message: "Switching to ReAct",
					},
				],
				degradation: [
					{
						when: "timeout",
						fallback_to: "cached_response",
						message: "Using cached response",
						include_fields: ["summary"],
					},
				],
			},
			global: {
				max_total_time: "5m",
				max_total_cost: 1.0,
				fail_fast: true,
				max_parallelism: 4,
			},
			nodes: {
				agent_a: {
					logic_ref: "./agent-a.logic.md",
					depends_on: [],
					overrides: { temperature: 0.5 },
				},
			},
			edges: [{ from: "agent_a", to: "agent_b" }],
			visual: {
				icon: "brain",
				category: "reasoning",
				color: "#4a90d9",
				inspector: [
					{
						key: "reasoning.strategy",
						label: "Strategy",
						type: "select",
						options: ["cot", "react", "tot"],
					},
				],
				ports: {
					inputs: [{ name: "query", type: "string", required: true }],
					outputs: [{ name: "result", type: "object" }],
				},
			},
			metadata: {
				author: "test",
				version: "1.0",
				tags: ["test", "complete"],
			},
		};
		const valid = validate(spec);
		if (!valid) {
			console.error("Validation errors:", JSON.stringify(validate.errors, null, 2));
		}
		expect(valid).toBe(true);
	});

	it("rejects missing required fields", () => {
		const validate = createValidator();
		const valid = validate({});
		expect(valid).toBe(false);
		const errorPaths = validate.errors?.map((e) => e.params) ?? [];
		const missingProps = errorPaths
			.filter((p): p is { missingProperty: string } => "missingProperty" in p)
			.map((p) => p.missingProperty);
		expect(missingProps).toContain("spec_version");
		expect(missingProps).toContain("name");
	});

	it("rejects invalid strategy enum", () => {
		const validate = createValidator();
		const valid = validate({
			spec_version: "1.0",
			name: "test",
			reasoning: { strategy: "invalid" },
		});
		expect(valid).toBe(false);
		expect(validate.errors?.length).toBeGreaterThan(0);
	});

	it("rejects invalid spec_version", () => {
		const validate = createValidator();
		const valid = validate({
			spec_version: "2.0",
			name: "test",
		});
		expect(valid).toBe(false);
		expect(validate.errors?.length).toBeGreaterThan(0);
	});

	it("reports all errors at once (allErrors mode)", () => {
		const validate = createValidator();
		const valid = validate({
			spec_version: "2.0",
			reasoning: { strategy: "invalid" },
			extra_field: true,
		});
		expect(valid).toBe(false);
		expect(validate.errors).toBeDefined();
		// Should have multiple errors: wrong spec_version, missing name, invalid strategy, extra field
		expect(validate.errors?.length).toBeGreaterThan(1);
	});
});
