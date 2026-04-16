# /logic:fix-spec-drift

Detect and fix drift between `docs/SPEC.md` and `spec/schema.json`.

Drift happens when the spec documents one set of allowed values but the schema accepts a different set — or vice versa. This is a conformance risk: two implementations reading different sources will disagree on validity.

## Detection

1. **Read both files** — `docs/SPEC.md` and `spec/schema.json`
2. **Compare enum values** — For every `enum` in the schema, find the corresponding SPEC.md section and verify the allowed values match exactly.
3. **Compare constraints** — For numeric fields with documented ranges (like "0-1"), verify the schema enforces `minimum`/`maximum`.
4. **Compare required fields** — Verify `required` arrays match what SPEC.md says is mandatory.
5. **Check examples** — Verify SPEC.md examples would pass schema validation.

## Common Drift Patterns

- **Schema is too permissive**: Schema accepts values SPEC.md doesn't document (e.g., all 5 enum values when spec only documents 3)
- **Schema is too restrictive**: Schema rejects values SPEC.md documents as valid
- **Description says one thing, constraint says another**: e.g., description says "0-1" but no min/max enforced
- **New spec section, no schema update**: A SPEC.md section was added but the schema wasn't updated to match

## Resolution

When drift is found, decide which source is correct:
- **Option A (preferred)**: Tighten schema to match SPEC.md — the spec is the source of truth
- **Option B**: Expand SPEC.md — if the schema's broader set makes semantic sense

Then follow the `/logic:fix-schema` workflow to apply the fix.

## Audit Checklist

After fixing, run a full audit:
- [ ] All enum fields in schema match SPEC.md documentation
- [ ] All numeric constraints match SPEC.md descriptions  
- [ ] All SPEC.md examples pass schema validation
- [ ] Conformance fixtures cover the fixed fields
- [ ] Both schema copies are identical (`spec/schema.json` = `packages/core/schema.json`)
