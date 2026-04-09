# Claude Code Plugin for LOGIC.md

Gives Claude Code users a first-class LOGIC.md experience via slash commands that orchestrate the `@logic-md/mcp` MCP server tools. Includes ready-made workflow templates for common Claude Code tasks.

## Quick Setup

**Step 1 -- Copy slash commands into your project:**

```bash
cp -r integrations/claude-code/commands/ /your-project/.claude/commands/logic/
```

Or symlink for a shared install:

```bash
ln -s /path/to/logic-md/integrations/claude-code/commands /your-project/.claude/commands/logic
```

**Step 2 -- Add MCP server config to `.claude/settings.json`:**

```json
{
  "mcpServers": {
    "logic-md": {
      "command": "npx",
      "args": ["-y", "@logic-md/mcp"]
    }
  }
}
```

For local development (using the monorepo build directly):

```json
{
  "mcpServers": {
    "logic-md": {
      "command": "node",
      "args": ["./packages/mcp/dist/index.js"]
    }
  }
}
```

---

## Slash Commands Reference

| Command | What it does | Arguments | Example |
|---------|-------------|-----------|---------|
| `/logic:status` | Find all `*.logic.md` files in the project and show a validation summary table | None | `/logic:status` |
| `/logic:apply` | Compile a LOGIC.md file into its full reasoning scaffold and apply it to your task | `<file_path>` | `/logic:apply ./review.logic.md` |
| `/logic:validate` | Validate and lint all `*.logic.md` files with detailed error and warning report | None | `/logic:validate` |
| `/logic:init` | Scaffold a new LOGIC.md from a template, interactively | `[template_name]` | `/logic:init code-review` |
| `/logic:compile` | Compile a single step from a LOGIC.md file into its prompt segment | `<file_path> <step_name>` | `/logic:compile ./debug.logic.md diagnose` |

---

## Workflow Templates

Four Claude Code-specific templates are included in `packages/cli/templates/`. Use them as starting points with `/logic:init`.

### code-review -- Chain-of-thought PR review

**Strategy:** `cot` | **Steps:** understand -> analyze -> assess_style -> summarize

When to use: Reviewing a PR or diff with structured analysis of correctness, edge cases, security, and style before giving a verdict.

```bash
/logic:init code-review
# Save as ./code-review.logic.md
/logic:apply ./code-review.logic.md
```

### debug-workflow -- ReAct debugging for Claude Code

**Strategy:** `react` (8 iterations) | **Steps:** gather_context -> reproduce -> diagnose -> fix_and_verify

When to use: Debugging an issue end-to-end using Claude Code's file reading, grep, and terminal tools. Distinct from the generic `debugger` template -- this one is optimized for iterative tool-use loops.

```bash
/logic:init debug-workflow
# Save as ./debug-workflow.logic.md
/logic:apply ./debug-workflow.logic.md
```

### refactor -- Impact-aware refactoring

**Strategy:** `cot` | **Steps:** scope -> impact -> plan -> execute

When to use: Any refactoring where you need to understand all callers, assess test coverage, and execute changes safely in incremental steps.

```bash
/logic:init refactor
# Save as ./refactor.logic.md
/logic:apply ./refactor.logic.md
```

### architecture -- Tree-of-thought ADR generator

**Strategy:** `tot` | **Steps:** context -> explore -> evaluate -> decide

When to use: Technology selection, system design decisions, or any architectural choice where you need to explore multiple options and produce a decision record.

```bash
/logic:init architecture
# Save as ./architecture.logic.md
/logic:apply ./architecture.logic.md
```

---

## CLAUDE.md Integration

Add this snippet to your project's `CLAUDE.md` to remind Claude Code to use LOGIC.md reasoning templates:

```markdown
## Reasoning Templates

Use `/logic:status` to see available LOGIC.md reasoning templates in this project.
Apply structured reasoning to complex tasks with `/logic:apply path/to/file.logic.md`.

Available workflows:
- `./code-review.logic.md` -- structured PR review
- `./debug-workflow.logic.md` -- end-to-end debugging
- `./refactor.logic.md` -- impact-aware refactoring
- `./architecture.logic.md` -- architecture decision records
```

---

## Available MCP Tools

The slash commands orchestrate these 7 MCP tools provided by `@logic-md/mcp`:

| Tool | What it does |
|------|-------------|
| `logic_md_parse` | Parse a LOGIC.md file content into a structured spec object |
| `logic_md_validate` | Validate a LOGIC.md file against the schema; returns errors if invalid |
| `logic_md_lint` | Run lint rules on a valid LOGIC.md file; returns warnings and suggestions |
| `logic_md_list_templates` | List all available built-in templates with their names and descriptions |
| `logic_md_init` | Generate a new LOGIC.md file from a named template |
| `logic_md_compile_step` | Compile a single step from a LOGIC.md file into its prompt segment |
| `logic_md_compile_workflow` | Compile the full workflow from a LOGIC.md file into the complete reasoning scaffold |
