# LOGIC.md VSCode Extension

Syntax highlighting and validation for **LOGIC.md** reasoning specifications in Visual Studio Code.

## Features

### Syntax Highlighting

- **YAML Frontmatter**: Full syntax highlighting for LOGIC.md frontmatter between `---` delimiters
- **LOGIC.md-Specific Keys**: Intelligent highlighting of all LOGIC.md schema keywords:
  - Core: `spec_version`, `name`, `description`, `reasoning`, `steps`, `contracts`, `quality_gates`, `fallback`, `decision_trees`, `global`, `imports`
  - Step properties: `needs`, `instructions`, `branches`, `verification`, `retry`, `timeout`, `allowed_tools`, `denied_tools`, `output_schema`, `input_schema`
  - Contract properties: `invariants`, `preconditions`, `postconditions`, `error_handling`, `sla`
  - Decision trees: `condition`, `then_step`, `else_step`, `default_step`
  - Quality gates: `metric`, `threshold`, `on_fail`, `severity`
  - Retry logic: `max_attempts`, `delay`, `backoff`, `backoff_factor`

- **Reasoning Strategies**: Highlighting for reasoning strategy values: `cot`, `react`, `tot`, `got`, `plan-execute`, `custom`
- **Expression Syntax**: Full support for `{{ ... }}` expression syntax with:
  - Operators: logical (`and`, `or`, `not`), comparison (`==`, `!=`, `<`, `>`, etc.), arithmetic
  - Built-in functions: `len`, `type`, `keys`, `values`, `contains`, `split`, `join`, `map`, `filter`, etc.
  - Variable references and literals

- **Failure Handling**: Highlighting for `on_fail` values: `retry`, `escalate`, `skip`, `abort`, `revise`
- **Severity Levels**: Highlighting for severity values: `error`, `warning`, `info`

### Markdown Support

- **Headers**: Proper highlighting for Markdown headings (`#`, `##`, etc.)
- **Formatting**: Bold (`**text**`, `__text__`), italic (`*text*`, `_text_`), code (`` `code` ``)
- **Links**: Automatic detection and highlighting of Markdown links
- **Lists**: Numbered and bullet point lists

### Code Intelligence

- **Smart Indentation**: Automatic indentation rules for LOGIC.md structures
- **Auto-Closing Pairs**: Automatic closing of brackets, braces, quotes, and expression delimiters (`{{` → `}}`)
- **Comment Toggling**: Use `Ctrl+/` or `Cmd+/` to toggle line comments (YAML comments with `#`)
- **Bracket Matching**: Visual matching and navigation of brackets and braces
- **Code Folding**: Fold YAML frontmatter and Markdown sections by indentation

### Code Snippets

Quick access to common LOGIC.md patterns:

- `logic-init`: Complete LOGIC.md specification template
- `logic-step`: New step definition
- `logic-contracts`: Contract block
- `logic-gates`: Quality gates configuration
- `logic-branch`: Branch condition
- `logic-fallback`: Fallback configuration with decision tree
- `logic-retry`: Retry configuration
- `logic-decision-tree`: Decision tree structure
- `logic-import`: Import statements
- `logic-expr`: Expression placeholder

Type the prefix and press `Tab` or `Enter` to expand.

## Installation

### From the Marketplace

Search for "LOGIC.md" in the VSCode Extensions panel and click Install.

### From a VSIX File

1. Download the extension VSIX file
2. Open the Extensions panel in VSCode
3. Click the "..." menu and select "Install from VSIX..."
4. Select the downloaded file

### From Source

```bash
cd editors/vscode
npm install
npm run package
code --install-extension logic-md-vscode-0.1.0.vsix
```

## Usage

### Creating a New LOGIC.md File

1. Create a file with the `.logic.md` extension
2. Type `logic-init` and press `Tab` to generate a full template
3. Edit the frontmatter and Markdown body as needed

### Key Patterns

**YAML Frontmatter** (between `---` delimiters):
- Contains structured configuration
- LOGIC.md-specific keywords are highlighted in blue
- Invalid keys appear in red

**Expressions** (between `{{ ... }}`):
- Appear in instruction strings, conditions, and verification blocks
- Support variable references, operators, and function calls
- Type `{{` to auto-close with `}}`

**Markdown Body**:
- Everything after the closing `---` is treated as standard Markdown
- Headings, lists, and formatting work as expected
- Expressions in Markdown are also highlighted

## File Structure

```
.logic.md file structure:
├── --- (frontmatter delimiter)
├── YAML frontmatter
│   ├── spec_version
│   ├── name, description
│   ├── reasoning (strategy)
│   ├── steps (array of step definitions)
│   ├── contracts (array of contract definitions)
│   ├── quality_gates (array of gate definitions)
│   ├── fallback (configuration)
│   ├── decision_trees (array of trees)
│   ├── global (settings)
│   └── imports (external files)
├── --- (frontmatter delimiter)
└── Markdown body
    ├── Headings
    ├── Paragraphs
    ├── Lists
    └── Code blocks
```

## Example File

```logic.md
---
spec_version: 1.0
name: "Question Answering Agent"
description: "A reasoning agent that answers questions step by step"
reasoning: cot
global:
  timeout: 30
  allowed_tools:
    - search
    - calculate

steps:
  - id: analyze_question
    instructions: "Break down the question into key components"
    needs:
      - user_input
    verification:
      - condition: "{{ $output.components }}"
        message: "Must identify question components"

  - id: search_information
    instructions: "Search for relevant information"
    needs:
      - question_analysis
    allowed_tools:
      - search

quality_gates:
  - metric: answer_confidence
    threshold: 0.85
    on_fail: revise
    severity: error

fallback:
  step: provide_partial_answer
  message: "Could not find complete answer"

---

# Question Answering Agent

This agent answers user questions through systematic reasoning.

## Process

1. Analyze the question
2. Search for information
3. Synthesize an answer
4. Verify confidence level

## Quality Standards

- Answer confidence must exceed 85%
- Response time under 30 seconds
```

## Troubleshooting

**Syntax highlighting not working**
- Ensure the file has the `.logic.md` extension
- Reload the VSCode window (`Cmd+Shift+P` → "Reload Window")

**Auto-complete not showing**
- Check that the file language is set to "LOGIC.md" (bottom right corner)
- Type a snippet prefix like `logic-` to see suggestions

**Formatting/Indentation issues**
- Select code and press `Shift+Alt+F` to auto-format (requires a formatter extension)
- Check `language-configuration.json` for indentation rules

## Requirements

- Visual Studio Code 1.80.0 or later
- No additional dependencies required

## Contributing

Contributions welcome! Please report issues and suggest improvements at:
https://github.com/singlesourcestudios/logic-md

## License

MIT
