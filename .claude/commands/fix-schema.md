# /logic:fix-schema

Fix a constraint or definition issue in the LOGIC.md JSON Schema.

When fixing schema issues, you need to update **two identical copies** of the schema and keep them in sync:
- `spec/schema.json` — the canonical spec-level schema
- `packages/core/schema.json` — the copy bundled with `@logic-md/core`

## Workflow

1. **Read the issue** — Understand what's wrong. Common categories:
   - Missing numeric constraints (min/max on 0-1 fields)
   - Enum mismatches between schema and SPEC.md
   - Missing or overly permissive `additionalProperties`
   - Type mismatches between schema and TypeScript types

2. **Check SPEC.md** — Read `docs/SPEC.md` to find what the spec says about the affected fields. The spec is the source of truth; the schema should encode it.

3. **Check TypeScript types** — Read `packages/core/types.ts` to see if the TS types already encode constraints the schema doesn't.

4. **Edit the schema** — Make the fix in `spec/schema.json` first.

5. **Sync the copy** — Copy the exact same change to `packages/core/schema.json`. Both files must be byte-identical.

6. **Update SPEC.md if needed** — If the spec was ambiguous or silent on the constraint, add clarifying language.

7. **Add test fixtures** — Add invalid fixtures to `spec/fixtures/invalid/` that test the new constraint. Each fixture should be a `.logic.md` file that violates the new rule.

8. **Run validation** — Execute `npm run build:core && npm test` to verify:
   - Existing valid fixtures still pass
   - New invalid fixtures correctly fail
   - No regressions in the 307+ core tests

## Checklist
- [ ] `spec/schema.json` updated
- [ ] `packages/core/schema.json` synced (identical)
- [ ] `docs/SPEC.md` clarified if ambiguous
- [ ] Invalid fixture(s) added to `spec/fixtures/invalid/`
- [ ] All tests pass
- [ ] Commit message follows: `fix(schema): <description>`
