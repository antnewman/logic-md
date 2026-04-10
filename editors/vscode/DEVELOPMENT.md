# LOGIC.md VSCode Extension - Development Guide

## Quick Start

### Prerequisites
- Node.js 16+
- npm 8+
- Visual Studio Code 1.80.0+

### Setup

```bash
# Install dependencies
npm install

# Build the extension
npm run esbuild

# Watch for changes (development)
npm run esbuild-watch

# Package as VSIX
npm run package

# Publish to marketplace (requires vsce authentication)
npm run publish
```

## Project Structure

```
editors/vscode/
├── src/
│   └── extension.ts          # Extension entry point, activation logic
├── syntaxes/
│   └── logic-md.tmLanguage.json  # TextMate grammar (core syntax highlighting)
├── snippets/
│   └── logic-md.json         # Code snippets
├── out/
│   └── extension.js          # Compiled extension (generated)
├── package.json              # VSCode extension manifest
├── language-configuration.json   # Language configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
├── CHANGELOG.md              # Version history
├── DEVELOPMENT.md            # This file
├── .gitignore                # Git ignore patterns
└── .vscodeignore             # Files to exclude from package
```

## Key Files

### syntaxes/logic-md.tmLanguage.json
The heart of the extension. This TextMate grammar defines:
- YAML frontmatter structure
- LOGIC.md-specific keyword recognition
- Expression syntax (`{{ ... }}`)
- Markdown body parsing
- Color scope assignments

To test grammar changes:
1. Edit the grammar file
2. Reload the VSCode window
3. Open a `.logic.md` file to see updates

### snippets/logic-md.json
Provides quick templates for common LOGIC.md patterns. To add a snippet:
1. Add a new entry to the JSON object
2. Use `${1:placeholder}` for tab stops
3. Reload VSCode to see the snippet

### src/extension.ts
The extension runtime code. Currently provides:
- Basic document validation (frontmatter structure)
- Required field detection
- Activation/deactivation lifecycle

To enhance:
1. Add new event listeners in `activate()`
2. Add diagnostic checks in `validateDocument()`
3. Consider integrating `@logic-md/core` for full schema validation

## Development Workflow

### Local Testing

1. **Run in development mode:**
   ```bash
   npm run esbuild-watch
   ```

2. **Launch VSCode Extension Host:**
   - Press `F5` or go to Run → Run Without Debugging
   - This opens a new VSCode window with the extension loaded
   - Changes in `src/` files require recompilation
   - Grammar/snippet changes are hot-reloaded

3. **Test on a `.logic.md` file:**
   - Create or open a test file with `.logic.md` extension
   - Verify syntax highlighting and snippets work

### Testing Syntax Highlighting

Create `test.logic.md`:
```logic.md
---
spec_version: 1.0
name: "Test Spec"
description: "For testing syntax highlighting"
reasoning: cot
steps:
  - id: test_step
    instructions: "Do something {{ like_this }}"
    needs:
      - input
quality_gates:
  - metric: success
    threshold: 0.95
    on_fail: retry
    severity: error
---

# Test Document

This is a test with **bold** and *italic* text.

- List item 1
- List item 2
```

Expected highlighting:
- `spec_version`, `name`, `reasoning`, `steps`, etc. should be blue
- String values should be green
- `{{ like_this }}` should be highlighted as an expression
- Markdown below `---` should use standard Markdown colors

### Testing Snippets

1. Open a `.logic.md` file
2. Type `logic-` and press `Ctrl+Space` to see suggestions
3. Select a snippet and press `Enter` to expand

## Building and Packaging

### Development Build
```bash
npm run esbuild
```
Creates `out/extension.js` with source maps for debugging.

### Production Build
```bash
npm run vscode:prepublish
```
Creates minified `out/extension.js` for release.

### Package as VSIX
```bash
npm run package
```
Creates `logic-md-vscode-0.1.0.vsix` file that can be:
- Shared with others
- Installed locally: `code --install-extension logic-md-vscode-0.1.0.vsix`
- Uploaded to VSCode Marketplace

## Publishing to Marketplace

### Prerequisites
1. Create a publisher account at https://marketplace.visualstudio.com
2. Install vsce: `npm install -g vsce`
3. Create a Personal Access Token (PAT) in VSCode Marketplace

### Publish
```bash
vsce login <publisher-name>
npm run publish
```

Or directly:
```bash
vsce publish --pat <your-pat>
```

## Grammar Syntax

### Scope Names
TextMate grammars use scope names for color assignment. Common scopes:

- `keyword.control` - Control keywords
- `keyword.operator` - Operators
- `string.quoted.double` - Double-quoted strings
- `constant.numeric` - Numbers
- `constant.language` - Language constants (true, false, null)
- `variable.other` - Variable references
- `comment.line` - Comments
- `markup.bold` - Bold Markdown
- `markup.heading` - Markdown headings

### Pattern Matching

Pattern syntax uses ONIGURUMA regex:
- `match`: Single-line pattern
- `begin`/`end`: Multi-line pattern (capture groups possible)
- `include`: Include another pattern from the repository

### Adding New Keywords

To highlight a new LOGIC.md keyword:

1. Find or create a pattern in the `logic-keys` section
2. Add a `name` scope for coloring
3. Update the `match` regex to include your keyword
4. Example:
   ```json
   {
     "name": "variable.other.logic-key.new",
     "match": "^\\s*(new_keyword)(?=:)"
   }
   ```

## Validation Architecture

Current implementation:
- Basic structure validation in `extension.ts`
- Checks for frontmatter delimiters
- Detects missing required fields

Future enhancements:
- Integrate `@logic-md/core` validator
- Full schema validation
- Expression syntax checking
- Step reference resolution
- Contract verification

To integrate @logic-md/core:
```typescript
import { validateLogic } from '@logic-md/core';

function validateDocument(doc: vscode.TextDocument) {
  const result = validateLogic(doc.getText());
  // Convert result to vscode.Diagnostic[]
}
```

## Troubleshooting

### Syntax highlighting not applying
- Grammar changes require VSCode reload
- Press `Ctrl+Shift+P` → "Developer: Reload Window"
- Check that language ID is `logic-md`

### Snippets not appearing
- Ensure snippet file is in `snippets/` directory
- Language ID in snippet declaration must match package.json
- Reload VSCode after changing snippets

### Extension not activating
- Check `activationEvents` in package.json
- Verify `.logic.md` file has correct extension
- Open DevTools: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"

### Compilation errors
- Run `npm install` to ensure dependencies
- Check TypeScript: `npx tsc --noEmit`
- Verify Node.js version: `node --version`

## Performance Considerations

For large documents:
- Grammar matching is incremental
- Avoid overly broad regex patterns
- Test performance with 10k+ line files

For validation:
- Debounce `onDidChangeTextDocument` events
- Lazy-load heavy validators
- Consider WebAssembly for complex parsing

## Version Management

Versions follow Semantic Versioning:
- **0.1.0**: Initial release with syntax highlighting
- **0.2.0**: Add schema validation
- **0.3.0**: Add debugging and visualization
- **1.0.0**: Stable production release

Update version in:
- `package.json` (version field)
- `CHANGELOG.md` (new section)
- Git tag: `git tag v0.1.0`

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [TextMate Grammar Docs](https://macromates.com/manual/en/language_grammars)
- [Scope Name Reference](https://macromates.com/manual/en/scope_selectors)
- [ONIGURUMA Regex](https://github.com/kkos/oniguruma)
- [VSCode Extension Examples](https://github.com/microsoft/vscode-extension-samples)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test locally
4. Run `npm run esbuild` to verify compilation
5. Commit with clear messages
6. Push and create a pull request

## License

MIT - See LICENSE file in repository root
