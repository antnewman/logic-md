# /logic:triage-issue

Triage a new GitHub issue for the logic-md repository.

## Process

1. **Read the issue** — Get the full issue text from GitHub (issue number or URL).

2. **Classify** — Determine the issue category:
   - `schema` — JSON Schema constraint or definition bug
   - `spec-drift` — Mismatch between SPEC.md and schema.json
   - `build` — Build pipeline, CI, or packaging issue
   - `parser` — Parser bug (incorrect accept/reject)
   - `compiler` — Compilation output bug
   - `cli` — CLI command bug or feature request
   - `mcp` — MCP server/tool bug
   - `docs` — Documentation issue
   - `feature` — Feature request or spec extension proposal

3. **Assess severity**:
   - `critical` — Conformance violation (two valid implementations disagree)
   - `high` — Schema accepts invalid input or rejects valid input
   - `medium` — Missing constraint, could cause silent errors
   - `low` — Documentation gap, cosmetic issue

4. **Identify affected files** — List the specific files that need changes.

5. **Propose fix** — Write a concrete fix plan:
   - What changes to make in each file
   - Whether fixtures need adding
   - Whether this is a breaking change (requires spec_version bump)

6. **Check for related issues** — Search existing issues and the codebase for related problems. Often one issue reveals a pattern (e.g., if one enum is wrong, check all enums).

7. **Suggest labels** — Based on classification:
   - Category label: `schema`, `spec`, `build`, `parser`, `compiler`, `cli`, `mcp`, `docs`
   - Severity label: `critical`, `high`, `medium`, `low`
   - Additional: `good-first-issue`, `breaking-change`, `spec-extension`

## Output Format

```markdown
## Triage: #<number> — <title>

**Category:** <category>
**Severity:** <severity>
**Labels:** <comma-separated>

### Affected Files
- `path/to/file` — what needs to change

### Fix Plan
1. Step-by-step fix description

### Related Issues
- #N — description of relationship

### Breaking Change?
Yes/No — explanation
```
