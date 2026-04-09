# /logic:status

Find all `*.logic.md` files in the current project directory tree. Use glob or `find . -name "*.logic.md" -not -path "*/node_modules/*"` to locate them.

For each file found:
1. Read the file content
2. Call the `logic_md_validate` MCP tool with the file content as the `content` argument
3. Extract: the file path, whether it is valid, the strategy name (from `reasoning.strategy`), and the number of steps

Present results as a markdown table with columns: **File**, **Status**, **Strategy**, **Steps**.

Use a checkmark (✓) for valid and an X (✗) for invalid in the Status column.

If any files are invalid, list the validation errors beneath the table.

If no `*.logic.md` files are found, say so clearly and suggest running `/logic:init` to create a new LOGIC.md file from a template.

Example output:

```
| File | Status | Strategy | Steps |
|------|--------|----------|-------|
| ./review.logic.md | ✓ | cot | 3 |
| ./debug.logic.md | ✗ | react | 4 |
```
