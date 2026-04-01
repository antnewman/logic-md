# Phase 4: Schema Validator - Research

**Researched:** 2026-03-31
**Domain:** JSON Schema validation with YAML source position mapping
**Confidence:** HIGH

## Summary

Phase 4 bridges the existing ajv-based schema validator (`createValidator()` in `schema.ts`) with human-friendly error reporting that includes YAML source line numbers. The core challenge is that ajv validates JavaScript objects and reports errors using JSON Pointers (e.g., `/steps/analyze/timeout`), but users author YAML frontmatter and need line numbers pointing back to the source.

The solution is a two-layer approach: (1) use the `yaml` npm package (v2.x) to parse the raw YAML frontmatter into a Document that preserves source position ranges on every node, and (2) when ajv reports validation errors, convert each error's `instancePath` JSON Pointer into a document path, look up the corresponding node in the YAML Document, and use its `range` property with a `LineCounter` to produce line numbers. The existing `createValidator()` already has `allErrors: true` set, so multi-error collection is handled.

Gray-matter (already used by the parser) exposes the raw YAML string via its `matter` property on the result object. This raw string can be re-parsed with the `yaml` package to build the source-position-aware Document without changing the parser's public API.

**Primary recommendation:** Add the `yaml` package as a dependency, build a `validate()` function that takes the raw file content (or ParseSuccess + raw source), runs ajv validation, and maps each ajv error to a `ValidationError` with line number, column, and human-readable message.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PARS-03 | Validate parsed YAML against embedded JSON Schema using ajv | `createValidator()` already exists with ajv + schema.json. Wrap it in a `validate()` function that accepts parsed data and returns structured results. |
| PARS-04 | Report validation errors with line numbers and clear messages | Use `yaml` package's `parseDocument()` + `LineCounter` + `getIn()` to map ajv `instancePath` JSON Pointers to YAML source line/column positions. Format ajv's terse messages into human-readable descriptions. |
| PARS-05 | Support multiple errors per file (don't bail on first error) | Already handled: `createValidator()` uses `allErrors: true`. The `validate()` function collects all errors from `validate.errors` array. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ajv | ^8.0.0 | JSON Schema validation | Already installed. Industry standard for draft-07 validation. `allErrors: true` already configured. |
| yaml | ^2.8.0 | YAML parsing with source positions | Only YAML parser for JS that provides `range` offsets on every parsed node + `LineCounter` for offset-to-line conversion. Zero dependencies. |
| ajv-formats | ^3.0.1 | Format keyword support for ajv | Already installed. Enables "uri" and other format validators. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | ^4.0.3 | Frontmatter extraction | Already used by parser. Its `matter` property gives us the raw YAML string to re-parse with `yaml`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `yaml` package for source positions | `js-yaml-source-map` | Unmaintained (6+ years old), limited API, doesn't support nested path lookups |
| `yaml` package for source positions | `better-ajv-errors` | Designed for JSON source strings only, not YAML. Would require serializing back to JSON and losing original line numbers. |
| Custom error messages | `ajv-errors` | Embeds messages in schema, doesn't solve line-number mapping. Could complement but doesn't replace. |

**Installation:**
```bash
npm install yaml
```

## Architecture Patterns

### Recommended Project Structure
```
packages/core/
  validator.ts          # validate() function + ValidationError type
  validator.test.ts     # Tests for validator
  schema.ts             # Existing createValidator() -- unchanged
  parser.ts             # Existing parse() -- unchanged
  types.ts              # Add ValidationError, ValidationResult types
  index.ts              # Export validate, ValidationError, etc.
```

### Pattern 1: Two-Pass Parse Strategy
**What:** Parse YAML twice -- once with gray-matter for data extraction (existing parser), once with `yaml` package for source position mapping (validator internals).
**When to use:** When the validator receives raw file content alongside parsed data.
**Why:** Keeps the parser module untouched. The validator is the only consumer of source positions.

```typescript
import { parseDocument, LineCounter } from 'yaml';

function buildSourceMap(yamlSource: string) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(yamlSource, { lineCounter, keepSourceTokens: true });
  return { doc, lineCounter };
}
```

### Pattern 2: JSON Pointer to Document Path Conversion
**What:** Convert ajv's `instancePath` (e.g., `/steps/analyze/timeout`) to an array path for `doc.getIn()`.
**When to use:** For every ajv error that needs a line number.

```typescript
// ajv instancePath: "/steps/analyze/timeout"
// yaml doc.getIn path: ["steps", "analyze", "timeout"]

function instancePathToDocPath(instancePath: string): string[] {
  if (!instancePath || instancePath === '') return [];
  return instancePath.split('/').filter(Boolean);
}

function getLineForPath(
  doc: Document,
  lineCounter: LineCounter,
  instancePath: string
): { line: number; col: number } | undefined {
  const path = instancePathToDocPath(instancePath);
  const node = doc.getIn(path, true); // true = keep scalar node wrapper
  if (node && typeof node === 'object' && 'range' in node && node.range) {
    return lineCounter.linePos(node.range[0]);
  }
  // Fallback: try parent path if exact node not found
  if (path.length > 0) {
    const parentPath = path.slice(0, -1);
    const parentNode = doc.getIn(parentPath, true);
    if (parentNode && typeof parentNode === 'object' && 'range' in parentNode && parentNode.range) {
      return lineCounter.linePos(parentNode.range[0]);
    }
  }
  return undefined;
}
```

### Pattern 3: Discriminated Union Result Type
**What:** Follow the existing `ParseResult` pattern with `ok: true | false` discriminated unions.
**When to use:** For the `validate()` return type. Consistent with parser conventions.

```typescript
export interface ValidationError {
  message: string;
  path: string;        // JSON Pointer path (e.g., "/steps/analyze/timeout")
  line?: number;       // 1-indexed line in source
  column?: number;     // 1-indexed column in source
}

export interface ValidationSuccess {
  ok: true;
  data: LogicSpec;     // Pass through the validated spec
}

export interface ValidationFailure {
  ok: false;
  errors: ValidationError[];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;
```

### Pattern 4: Line Number Offset for Frontmatter
**What:** The `yaml` package parses the raw YAML string (without `---` delimiters). But in the original file, the frontmatter starts after the opening `---\n`. Line numbers from the YAML parser need to be offset by +1 to account for the `---` delimiter line.
**When to use:** Always, when converting yaml-package line numbers back to original file line numbers.

```typescript
// The opening "---\n" is line 1 of the file
// YAML content starts at line 2
// So yaml package's line 1 = file line 2
const FRONTMATTER_OFFSET = 1; // +1 for the opening "---" line

function fileLineNumber(yamlLine: number): number {
  return yamlLine + FRONTMATTER_OFFSET;
}
```

### Anti-Patterns to Avoid
- **Modifying the parser to return source maps:** The parser's job is extraction. Keep source position logic in the validator.
- **Serializing to JSON to use json-source-map:** Loses YAML-specific line numbers. The whole point is to map back to the YAML source.
- **Using `verbose: true` on ajv:** Bloats error objects with full schema/data copies. Not needed when we have our own source mapping.
- **Building line-number lookup from string scanning:** Fragile, error-prone with multi-line values, comments, etc. Use the `yaml` package's proper parser instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML source positions | Regex/string scanning for line numbers | `yaml` package `parseDocument()` + `LineCounter` | YAML has multi-line strings, anchors, aliases, comments -- manual scanning will miss edge cases |
| JSON Schema validation | Custom validation logic | ajv (already installed) | Schema is already defined, ajv handles all draft-07 keywords |
| Offset-to-line conversion | Manual newline counting | `yaml` `LineCounter` class | Binary search over newline positions, handles edge cases |
| Human-readable error messages | Manual message construction for every keyword | ajv's built-in `message` property + path context | ajv already generates decent messages per keyword; enhance, don't replace |

**Key insight:** The hard problem here is NOT validation (ajv handles that) -- it's the source position mapping. The `yaml` package solves this completely with its Document model, and trying to approximate it with string manipulation will produce incorrect results for any non-trivial YAML.

## Common Pitfalls

### Pitfall 1: Frontmatter Line Offset
**What goes wrong:** Reporting line 1 when the error is actually on line 2 of the file, because the `---` delimiter isn't part of the YAML string.
**Why it happens:** The raw YAML extracted by gray-matter starts after `---\n`. The `yaml` package's line 1 is the first YAML key, but in the file that's line 2.
**How to avoid:** Always add +1 to line numbers from the YAML parser to account for the opening `---` delimiter.
**Warning signs:** Line numbers in tests are consistently off by 1.

### Pitfall 2: Missing Nodes for additionalProperties Errors
**What goes wrong:** Trying to look up a node for an `additionalProperties` error but the path points to the *parent* object, not the extra property.
**Why it happens:** ajv's `instancePath` for `additionalProperties` errors points to the containing object, and the extra property name is in `error.params.additionalProperty`. You need to append it to find the actual node.
**How to avoid:** Check `error.keyword` -- for `additionalProperties`, construct path as `instancePath + '/' + params.additionalProperty`.
**Warning signs:** All `additionalProperties` errors point to the parent object's line instead of the offending property.

### Pitfall 3: Array Index Paths
**What goes wrong:** ajv uses `/imports/0` for array items, but `doc.getIn(['imports', '0'])` won't work because `'0'` is a string, not a number.
**Why it happens:** JSON Pointers use string segments. `yaml` package's `getIn()` needs numeric indices for sequences.
**How to avoid:** When building the path array, detect numeric segments and convert: `path.map(s => /^\d+$/.test(s) ? Number(s) : s)`.
**Warning signs:** Array-item errors never get line numbers.

### Pitfall 4: Root-Level Errors Have Empty instancePath
**What goes wrong:** Errors like "missing required property" at the root have `instancePath: ""`. Trying to look up an empty path returns the document root.
**Why it happens:** Root-level schema errors don't have a path to a specific property.
**How to avoid:** For root-level errors (`instancePath === ""`), use line 1 (or 2 accounting for `---`). For `required` keyword, try looking up the parent + missing property name from `params.missingProperty`.
**Warning signs:** Root errors show line 0 or undefined.

### Pitfall 5: CJS/ESM Interop with yaml Package
**What goes wrong:** Import errors when adding `yaml` package.
**Why it happens:** The project uses `verbatimModuleSyntax` and the `yaml` package is ESM-native.
**How to avoid:** The `yaml` package (v2.x) is a proper ESM package with `exports` field. Standard ESM imports should work: `import { parseDocument, LineCounter } from 'yaml'`. No `createRequire` hack needed (unlike `ajv-formats`).
**Warning signs:** Build errors mentioning module resolution.

## Code Examples

### Complete validate() Function Skeleton

```typescript
import { parseDocument, LineCounter, type Document } from 'yaml';
import { createValidator } from './schema.js';
import type { LogicSpec } from './types.js';

const FRONTMATTER_OFFSET = 1;

export function validate(
  data: LogicSpec,
  yamlSource: string
): ValidationResult {
  const validator = createValidator();
  const valid = validator(data);

  if (valid) {
    return { ok: true, data };
  }

  // Build source map from raw YAML
  const lineCounter = new LineCounter();
  const doc = parseDocument(yamlSource, { lineCounter });

  const errors: ValidationError[] = (validator.errors ?? []).map((err) => {
    const fullPath = resolveErrorPath(err);
    const pos = getLineForPath(doc, lineCounter, fullPath);

    return {
      message: formatErrorMessage(err),
      path: err.instancePath || '/',
      line: pos ? pos.line + FRONTMATTER_OFFSET : undefined,
      column: pos?.col,
    };
  });

  return { ok: false, errors };
}

function resolveErrorPath(err: ErrorObject): string {
  // For additionalProperties, append the extra property name
  if (err.keyword === 'additionalProperties' && err.params?.additionalProperty) {
    return `${err.instancePath}/${err.params.additionalProperty}`;
  }
  // For required, try the missing property
  if (err.keyword === 'required' && err.params?.missingProperty) {
    return `${err.instancePath}/${err.params.missingProperty}`;
  }
  return err.instancePath;
}

function formatErrorMessage(err: ErrorObject): string {
  const location = err.instancePath || 'root';
  switch (err.keyword) {
    case 'required':
      return `Missing required property "${err.params.missingProperty}" at ${location}`;
    case 'additionalProperties':
      return `Unknown property "${err.params.additionalProperty}" at ${location}`;
    case 'type':
      return `Expected ${err.params.type} at ${location}`;
    case 'enum':
      return `Invalid value at ${location}. Allowed: ${err.params.allowedValues?.join(', ')}`;
    case 'const':
      return `Invalid value at ${location}. Expected: ${err.params.allowedValue}`;
    default:
      return `${err.message} at ${location}`;
  }
}
```

### Extracting Raw YAML from gray-matter

```typescript
import matter from 'gray-matter';

const result = matter(fileContent);
// result.matter  => raw YAML string (without --- delimiters)
// result.data    => parsed JavaScript object
// result.content => markdown body after frontmatter
```

### Using yaml Package's LineCounter

```typescript
import { LineCounter, parseDocument } from 'yaml';

const yamlStr = 'spec_version: "1.0"\nname: test\nsteps:\n  analyze:\n    timeout: 30s';
const lineCounter = new LineCounter();
const doc = parseDocument(yamlStr, { lineCounter });

// Get node at path
const node = doc.getIn(['steps', 'analyze', 'timeout'], true);
if (node && node.range) {
  const pos = lineCounter.linePos(node.range[0]);
  console.log(`Line: ${pos.line}, Col: ${pos.col}`);
  // Both are 1-indexed
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `js-yaml` + manual line tracking | `yaml` v2 with built-in `range` + `LineCounter` | yaml v2.0 (2022) | Source positions are first-class, no hacks needed |
| `ajv` v6 `dataPath` property | `ajv` v8 `instancePath` property | ajv v8.0 (2021) | Property renamed, uses JSON Pointer format |
| `json-source-map` for line numbers | `yaml` package `parseDocument` for YAML sources | N/A | json-source-map is for JSON strings only; yaml package handles YAML natively |

**Deprecated/outdated:**
- `ajv` v6 `dataPath`: Renamed to `instancePath` in v8. The project uses ajv v8.
- `js-yaml-source-map`: Last published 6+ years ago. Use `yaml` package instead.

## Open Questions

1. **Should `validate()` accept raw file content or parsed results?**
   - What we know: The parser returns `ParseSuccess` with `data` and `content` but NOT the raw YAML string. Gray-matter's `matter` property has the raw YAML.
   - What's unclear: Should `validate()` take the full file string and internally extract YAML, or should the parser be modified to also return the raw YAML?
   - Recommendation: Have `validate()` accept the full file content string. It can internally call gray-matter to get both parsed data and raw YAML. This avoids changing the parser's API and keeps the validator self-contained. Alternatively, accept `{ data: LogicSpec, yamlSource: string }` as input.

2. **How precise should line numbers be for "missing required" errors?**
   - What we know: A missing property doesn't have a corresponding node in the YAML document. We can point to the parent object.
   - What's unclear: Is pointing to the parent object's line helpful enough?
   - Recommendation: For missing properties, point to the parent object's line. The error message should name the missing property clearly so the user knows what to add.

## Sources

### Primary (HIGH confidence)
- [yaml v2 official docs](https://eemeli.org/yaml/) - parseDocument, LineCounter, range property, getIn() API
- [ajv API reference](https://ajv.js.org/api.html) - ErrorObject structure, instancePath, allErrors option
- Existing codebase: `schema.ts`, `parser.ts`, `types.ts` - verified current implementation

### Secondary (MEDIUM confidence)
- [gray-matter README](https://github.com/jonschlinkert/gray-matter) - `matter` property for raw YAML access
- [ajv issue #763](https://github.com/epoberezkin/ajv/issues/763) - Confirmed ajv does not provide line numbers; external mapping required
- [better-ajv-errors](https://github.com/atlassian/better-ajv-errors) - Confirmed JSON-only, not suitable for YAML source mapping

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ajv already in use, yaml package is the clear choice for source positions with well-documented API
- Architecture: HIGH - pattern is well-established (parse for positions, validate separately, map errors back)
- Pitfalls: HIGH - verified through ajv docs and yaml docs; frontmatter offset and path conversion are concrete, testable issues

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable libraries, unlikely to change)
