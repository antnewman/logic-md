# /logic:add-fixtures

Add conformance test fixtures for the LOGIC.md spec.

Fixtures live in `spec/fixtures/` and are the ground truth for whether a LOGIC.md file is valid or invalid.

## Directory Structure

```
spec/fixtures/
├── valid/           # Files that MUST pass validation
│   ├── minimal.logic.md
│   ├── reasoning.logic.md
│   ├── dag.logic.md
│   ├── contracts.logic.md
│   ├── quality-gates.logic.md
│   ├── fallback.logic.md
│   └── multi-agent.logic.md
├── edge-cases/      # Valid but unusual files that test parser edge cases
│   ├── no-body.logic.md
│   ├── all-strategies.logic.md
│   ├── metadata-freeform.logic.md
│   └── kitchen-sink.logic.md
└── invalid/         # Files that MUST fail validation with specific errors
    ├── missing-spec-version.logic.md
    ├── missing-name.logic.md
    ├── bad-strategy.logic.md
    ├── unknown-property.logic.md
    ├── bad-step-ref.logic.md
    ├── empty-frontmatter.logic.md
    └── malformed-yaml.logic.md
```

## Writing Valid Fixtures

Each valid fixture should be a realistic, minimal example that exercises a specific spec feature. Include YAML frontmatter with at least `spec_version` and `name`, plus the feature under test.

```yaml
---
spec_version: "1.0"
name: feature-name-test
description: Tests <specific feature>
# ... feature-specific YAML
---

# Optional markdown body
```

## Writing Invalid Fixtures

Each invalid fixture should violate exactly ONE schema rule, so failure messages are unambiguous. Name the file after the violation.

The test suite uses these to verify the validator rejects them with the correct error path and message.

## Workflow

1. Identify what needs fixture coverage (new constraint, new feature, bug fix)
2. Write the fixture file(s)
3. Run `npm run build:core && npm test` to verify:
   - Valid fixtures pass validation
   - Invalid fixtures fail with expected errors
4. If adding invalid fixtures for a new constraint, also verify the error message is helpful
5. Commit: `test(fixtures): add <description> fixtures`

## Tips

- Check existing fixtures before adding new ones — avoid duplication
- Invalid fixtures should be as minimal as possible (only the violation, nothing else complex)
- Edge-case fixtures should push boundaries: maximum nesting, empty arrays, unicode names, etc.
- When fixing a schema bug, always add both a valid fixture (showing correct usage) and an invalid fixture (showing the violation)
