---
phase: 09-test-coverage-and-integration
plan: 01
subsystem: testing
tags: [vitest, coverage, v8, baseline]

requires:
  - phase: 08-cli
    provides: complete core library with 152 passing tests
provides:
  - "@vitest/coverage-v8 configured with 90% thresholds"
  - "COVERAGE-BASELINE.md with per-module gap analysis"
affects: [09-02, 09-03]

tech-stack:
  added: ["@vitest/coverage-v8"]
  patterns: ["v8 coverage provider", "per-file coverage include lists"]

key-files:
  created:
    - ".planning/phases/09-test-coverage-and-integration/COVERAGE-BASELINE.md"
  modified:
    - "vitest.config.ts"
    - "packages/core/vitest.config.ts"

key-decisions:
  - "Include imports.ts and schema.ts in coverage targets alongside the four primary modules"
  - "Set 90% thresholds on all four metrics (lines, branches, functions, statements)"

patterns-established:
  - "Coverage config in both root and package-level vitest configs for workspace compatibility"

requirements-completed: [TEST-01, TEST-02, TEST-03, TEST-04]

duration: 3min
completed: 2026-03-31
---

# Phase 9 Plan 01: Coverage Baseline Summary

**Vitest v8 coverage configured with 90% thresholds; baseline shows 83.86% branch coverage with imports.ts as primary gap (67.74% branches)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T22:13:32Z
- **Completed:** 2026-04-01T22:16:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Installed @vitest/coverage-v8 and configured coverage for 6 core modules
- Ran baseline coverage: 152 tests passing, 93% statements, 83.86% branches globally
- Documented per-module gap analysis with specific uncovered lines and test priorities

## Task Commits

Each task was committed atomically:

1. **Task 1: Install coverage tooling and configure vitest** - `46b125a` (chore)
2. **Task 2: Run baseline coverage and document gaps** - `87dbf39` (docs)

## Files Created/Modified
- `vitest.config.ts` - Added v8 coverage provider config with include list and 90% thresholds
- `packages/core/vitest.config.ts` - Same coverage config with package-relative paths
- `.planning/phases/09-test-coverage-and-integration/COVERAGE-BASELINE.md` - Per-module coverage numbers, uncovered lines, and prioritized test plan

## Decisions Made
- Included imports.ts and schema.ts in coverage targets (imports.ts needed for Plan 03 integration tests, schema.ts for completeness)
- Set thresholds at 90% for all metrics -- currently failing on branches only (83.86%)
- Identified imports.ts as highest priority for Plan 02 (67.74% branches, lowest overall)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Coverage tooling ready for Plan 02 test writing
- Priority order established: imports.ts > dag.ts > validator.ts > parser.ts > expression.ts > schema.ts
- expression.ts already above 90% on all metrics; focus on branch coverage for the rest

---
*Phase: 09-test-coverage-and-integration*
*Completed: 2026-03-31*
