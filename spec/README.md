# LOGIC.md Specification

This directory contains the canonical, implementation-independent specification for the LOGIC.md format.

## Contents

- `schema.json` — JSON Schema (draft-07) for validating LOGIC.md YAML frontmatter
- `fixtures/` — Conformance test suite for verifying parser implementations

## For Implementers

If you're building a LOGIC.md parser in any language, this directory is your source of truth:

1. Parse the YAML frontmatter from between `---` delimiters
2. Validate the parsed YAML against `schema.json`
3. Run your implementation against every fixture in `fixtures/`

A conformant implementation MUST pass all fixtures. See `fixtures/README.md` for the fixture format.

## Canonical Spec

The full human-readable specification is at [`../docs/SPEC.md`](../docs/SPEC.md).

## Versioning

The spec follows semver at the spec level (independent of package versions):

- **Minor versions** (1.1, 1.2): additive fields only. All 1.0 files are valid 1.x files.
- **Major versions** (2.0): may remove or change fields. Requires migration tooling.

The `spec_version` field in every LOGIC.md file declares which spec version it targets.
