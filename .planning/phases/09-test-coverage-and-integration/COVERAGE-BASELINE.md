# Coverage Baseline Report

**Date:** 2026-03-31
**Tool:** @vitest/coverage-v8
**Tests:** 152 passing (9 test files)

## Summary Table

| File           | % Stmts | % Branch | % Funcs | % Lines | Status    |
|----------------|---------|----------|---------|---------|-----------|
| parser.ts      |     100 |    72.72 |     100 |     100 | Branch gap |
| validator.ts   |   93.87 |    76.74 |     100 |   93.75 | Below 90% branches |
| expression.ts  |   95.68 |    94.07 |     100 |   95.60 | Above 90% |
| dag.ts         |   93.61 |    81.81 |     100 |   93.75 | Branch gap |
| imports.ts     |   79.45 |    67.74 |   77.77 |   81.15 | Below 90% all |
| schema.ts      |     100 |       75 |     100 |     100 | Branch gap |
| **All files**  |      93 |    83.86 |   95.91 |   93.27 | **Below 90% branches** |

## Per-Module Gap Analysis

### parser.ts -- Lines: 100%, Branches: 72.72%

**Status:** Lines/functions fully covered. Branch coverage gap only.

**Uncovered branches (lines 88-89):**
- Error handling branch in YAML parse catch block: fallback when `err.reason` and `err.message` are both undefined
- `err.mark?.line` null-check branch (line not provided by error)

**Tests needed:** 1-2 tests exercising malformed YAML that triggers different error shapes.

### validator.ts -- Lines: 93.75%, Branches: 76.74%

**Status:** Functions 100%. Lines and branches below 90%.

**Uncovered lines and branches:**
- **Line 79:** Default case in `formatError()` -- generic "Validation error" fallback when error type is unrecognized
- **Lines 118-119:** Catch block in `validate()` -- gray-matter throws during frontmatter parsing
- **Line 189:** Empty object return in position mapping when no source position found

**Tests needed:** 3-4 tests:
1. Trigger an unrecognized AJV error type to hit the default case in `formatError()`
2. Content that causes gray-matter to throw (not just return bad data)
3. Validation error with no mappable source position

### expression.ts -- Lines: 95.6%, Branches: 94.07%

**Status:** Above 90% on all metrics. Closest to target.

**Uncovered lines (error branches):**
- **Line 166:** `isAlpha()` helper -- some character range branches not exercised
- **Line 466:** Default case in infix parsing -- `Unexpected infix token` error
- **Line 473:** Trailing token after complete expression -- `Unexpected token after expression` error
- **Line 547:** Unknown binary operator error in evaluator
- **Line 556:** Unknown unary operator error in evaluator
- **Line 593:** Unknown method call error in evaluator

**Tests needed:** 4-5 tests for error edge cases (malformed expressions, unknown operators/methods).

### dag.ts -- Lines: 93.75%, Branches: 81.81%

**Status:** Functions 100%. Branch coverage needs improvement.

**Uncovered lines:**
- **Lines 50-53:** Early termination path in cycle-detection DFS -- `gray.delete(node)`, `black.add(node)`, `path.pop()`, `return false` when a node's dependencies are all already fully explored
- **Line 162:** Unreachable step detection -- steps in topological order but not reachable from any root

**Tests needed:** 2-3 tests:
1. Graph where DFS explores a node fully before encountering a cycle elsewhere
2. Steps that are valid (no cycles) but unreachable from roots (orphaned subgraph)

### imports.ts -- Lines: 81.15%, Branches: 67.74%, Functions: 77.77%

**Status:** Lowest coverage across all metrics. Needs the most new tests.

**Uncovered lines and branches (major gaps):**
- **Lines 96-106:** Parse error handling when imported file fails to parse
- **Lines 148-168:** `namespaceSpec()` -- namespacing of `needs`, `parallel_steps`, and `branches` references
- **Lines 172-178:** `namespaceSpec()` -- namespacing of `decision_trees`
- **Lines 189-195:** `mergeSpecs()` -- reasoning merge branch
- **Lines 199-201:** `mergeSpecs()` -- steps merge branch
- **Lines 203-206:** `mergeSpecs()` -- contracts merge branch
- **Lines 208-214:** `mergeSpecs()` -- quality_gates merge branch
- **Lines 217-219:** `mergeSpecs()` -- decision_trees merge branch
- **Lines 222-224:** `mergeSpecs()` -- fallback merge branch
- **Lines 227-229:** `mergeSpecs()` -- metadata merge branch

**Tests needed:** 8-10 tests covering:
1. Import with parse errors in referenced file
2. Namespacing with `needs`, `parallel_steps`, `branches` references
3. Namespacing with `decision_trees`
4. Merge of each optional section: reasoning, contracts, quality_gates, decision_trees, fallback, metadata

### schema.ts -- Lines: 100%, Branches: 75%

**Status:** Lines/functions fully covered. Single branch gap.

**Uncovered branch (line 55):**
- CJS interop fallback: `addFormats.default ?? addFormats` -- the `.default` path is taken at runtime; the direct `addFormats` fallback is never exercised

**Tests needed:** This is an environment-dependent branch (CJS vs ESM interop). May not be practically testable. Consider marking as acceptable.

## Modules Already at 90%+ (All Metrics)

- **expression.ts** -- All metrics above 90%. Only error-path edge cases remain.

## Priority Order for Plan 02 (Test Writing)

1. **imports.ts** (highest gap, 67.74% branches) -- Needs 8-10 new tests
2. **dag.ts** (81.81% branches) -- Needs 2-3 new tests
3. **validator.ts** (76.74% branches) -- Needs 3-4 new tests
4. **parser.ts** (72.72% branches) -- Needs 1-2 new tests
5. **expression.ts** (94.07% branches, already close) -- Needs 4-5 edge case tests
6. **schema.ts** (75% branches) -- Environment-dependent, may skip

## Global Threshold Status

The 90% threshold is currently failing on **branches** (83.86% vs 90% target). Lines (93.27%), statements (93%), and functions (95.91%) all pass. The primary focus for Plan 02 should be branch coverage improvements across imports.ts, dag.ts, validator.ts, and parser.ts.
