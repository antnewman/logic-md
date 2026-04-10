# Conformance Test Fixtures

Each fixture is a pair of files:

- `*.logic.md` — the input LOGIC.md file
- `*.expected.json` — the expected parse/validation result

## Expected Result Format

```json
{
  "valid": true,
  "parsed": { ... }
}
```

Or for invalid fixtures:

```json
{
  "valid": false,
  "errors": [
    {
      "path": "/steps/analyze/needs",
      "message": "must be array",
      "keyword": "type"
    }
  ]
}
```

## Fixture Categories

- `valid/` — Specs that MUST parse and validate successfully
- `invalid/` — Specs that MUST fail validation (with specific error paths)
- `edge-cases/` — Specs that test boundary conditions and ambiguous inputs

## Conformance Rules

A conformant LOGIC.md implementation:

- **MUST** successfully parse and validate all `valid/` fixtures
- **MUST** reject all `invalid/` fixtures with errors at the specified paths
- **MUST** handle all `edge-cases/` fixtures as documented in their expected results
- **SHOULD** report errors with paths matching the `path` field in expected results
- **MAY** include additional error detail beyond what the expected result specifies
