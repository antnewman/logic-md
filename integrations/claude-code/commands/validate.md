# /logic:validate

Validate all LOGIC.md files in the project and report results.

Find all `*.logic.md` files using `find . -name "*.logic.md" -not -path "*/node_modules/*"`.

For each file found:
1. Read the file content
2. Call `logic_md_validate` with the content as the `content` argument
3. If the file is valid, also call `logic_md_lint` with the content as the `content` argument to check for warnings

Present results for each file:
- File path (as a header or bold)
- Validation status: VALID or INVALID
- If invalid: list all validation errors
- If valid: list any lint warnings (severity and message); if none, say "No warnings"

At the end, print a summary:
```
Summary: X valid, Y invalid, Z warnings total
```

If no `*.logic.md` files are found, say so and suggest `/logic:init` to create one.
