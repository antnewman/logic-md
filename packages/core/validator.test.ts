import { describe, expect, it } from "vitest";
import { validate } from "./validator.js";

describe("validate()", () => {
	it("returns success for a valid minimal spec", () => {
		const input = ["---", 'spec_version: "1.0"', "name: test", "---", ""].join("\n");

		const result = validate(input);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data.name).toBe("test");
			expect(result.data.spec_version).toBe("1.0");
		}
	});

	it("returns error when required field 'name' is missing", () => {
		const input = ["---", 'spec_version: "1.0"', "---", ""].join("\n");

		const result = validate(input);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThanOrEqual(1);
			const messages = result.errors.map((e) => e.message).join(" ");
			expect(messages).toMatch(/name/i);
		}
	});

	it("collects multiple errors in a single pass (PARS-05)", () => {
		const input = ["---", "foo: bar", "---", ""].join("\n");

		const result = validate(input);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			// Must report at least 2 errors: missing spec_version AND missing name
			expect(result.errors.length).toBeGreaterThanOrEqual(2);
		}
	});

	it("returns error for invalid type (string instead of object)", () => {
		const input = [
			"---",
			'spec_version: "1.0"',
			"name: test",
			"reasoning: not-an-object",
			"---",
			"",
		].join("\n");

		const result = validate(input);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThanOrEqual(1);
			const messages = result.errors.map((e) => e.message).join(" ");
			expect(messages).toMatch(/type|object/i);
		}
	});

	it("returns error for non-frontmatter input", () => {
		const input = "This is just plain text without any frontmatter delimiters.";

		const result = validate(input);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThanOrEqual(1);
		}
	});

	it("returns error for empty input", () => {
		const result = validate("");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThanOrEqual(1);
			expect(result.errors[0].message).toMatch(/empty/i);
		}
	});
});
