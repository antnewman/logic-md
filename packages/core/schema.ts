// =============================================================================
// LOGIC.md v1.0 - JSON Schema Loader & Validator Factory
// =============================================================================
// Loads the embedded JSON Schema draft-07 file and creates a cached ajv
// ValidateFunction for runtime validation of LogicSpec objects.
// =============================================================================

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv, type ValidateFunction } from "ajv";
import type { LogicSpec } from "./types.js";

const require = createRequire(import.meta.url);
// ajv-formats is a CJS module with `export default` that doesn't resolve
// correctly under verbatimModuleSyntax + nodenext. Use createRequire instead.
const addFormats = require("ajv-formats") as {
	default: (ajv: Ajv) => Ajv;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Reads and parses the embedded JSON Schema from disk.
 * Uses `import.meta.url` for path resolution so it works regardless
 * of the caller's working directory.
 */
export function getSchema(): Record<string, unknown> {
	const schemaPath = join(__dirname, "schema.json");
	const raw = readFileSync(schemaPath, "utf8");
	return JSON.parse(raw) as Record<string, unknown>;
}

/** Cached validator instance (module-level singleton) */
let cachedValidator: ValidateFunction<LogicSpec> | undefined;

/**
 * Creates (or returns cached) ajv ValidateFunction for LogicSpec.
 *
 * Configuration:
 * - `allErrors: true` -- reports every validation error, not just the first
 * - `strict: true` -- enforces strict schema authoring
 * - `ajv-formats` -- enables format keywords like "uri"
 *
 * The validator is compiled once and cached for the lifetime of the module.
 */
export function createValidator(): ValidateFunction<LogicSpec> {
	if (cachedValidator) {
		return cachedValidator;
	}

	const ajv = new Ajv({ allErrors: true, strict: true });
	const applyFormats = addFormats.default ?? addFormats;
	(applyFormats as (ajv: Ajv) => Ajv)(ajv);

	const schema = getSchema();
	cachedValidator = ajv.compile<LogicSpec>(schema);
	return cachedValidator;
}
