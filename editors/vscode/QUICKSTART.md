# Quick Start Guide - LOGIC.md VSCode Extension

## Installation

### Option 1: From VSIX File (Easiest)

1. Build the extension:
   ```bash
   cd editors/vscode
   npm install
   npm run package
   ```

2. Install in VSCode:
   ```bash
   code --install-extension logic-md-vscode-0.1.0.vsix
   ```

3. Reload VSCode (Cmd+Shift+P → "Reload Window")

### Option 2: From Source

1. Clone the repository
2. Navigate to `editors/vscode`
3. Run:
   ```bash
   npm install
   npm run esbuild
   ```
4. Press `F5` to launch VSCode Extension Development Host

### Option 3: Marketplace (Future)

Once published, search "LOGIC.md" in VSCode Extensions panel.

## First Steps

1. **Create a test file:**
   ```bash
   touch example.logic.md
   ```

2. **Use a snippet to scaffold:**
   - Type `logic-init` and press `Tab`
   - Edit the generated template

3. **See syntax highlighting:**
   - Open any `.logic.md` file
   - Keywords like `spec_version`, `reasoning`, `steps` should be highlighted
   - Expressions in `{{ ... }}` should show syntax coloring

## Common Snippets

| Prefix | Purpose |
|--------|---------|
| `logic-init` | Full LOGIC.md template |
| `logic-step` | New step definition |
| `logic-gates` | Quality gates |
| `logic-branch` | Conditional branching |
| `logic-fallback` | Fallback configuration |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+/` (Windows/Linux) or `Cmd+/` (Mac) | Toggle line comment |
| `Shift+Alt+F` | Format document |
| `Ctrl+Shift+P` | Command palette |
| `Tab` | Expand snippet |

## Verification

Check that these are working:

1. **File Association**: Open a `.logic.md` file → Language should show "LOGIC.md" (bottom right)
2. **Syntax Highlighting**: YAML keywords should be colored (not plain text)
3. **Snippets**: Type `logic-` and press `Ctrl+Space` to see suggestions
4. **Bracket Matching**: Type `{{` and observe auto-closing `}}`

## Example Files

Use the provided `example.logic.md` to test all features:
- Complex multi-step workflow
- All LOGIC.md constructs
- Comprehensive comments

## Troubleshooting

**Extension not showing up?**
```bash
# Check installation
code --list-extensions | grep logic-md

# Reinstall
code --uninstall-extension singlesourcestudios.logic-md-vscode
code --install-extension logic-md-vscode-0.1.0.vsix
```

**Syntax highlighting not working?**
1. Check file extension: must be `.logic.md`
2. Reload window: Cmd+Shift+P → "Reload Window"
3. Check language mode: should be "LOGIC.md" (bottom right)

**Snippets not appearing?**
1. File must be `logic-md` language
2. Type prefix and press `Ctrl+Space` (not just `Tab`)
3. Wait a moment for suggestions to appear

## Next Steps

1. Read the full [README.md](./README.md)
2. Review [DEVELOPMENT.md](./DEVELOPMENT.md) for contributing
3. Check out example specifications in `example.logic.md`
4. Submit issues or feature requests to the GitHub repository

## Support

- **Bugs**: https://github.com/singlesourcestudios/logic-md/issues
- **Discussions**: https://github.com/singlesourcestudios/logic-md/discussions
- **Documentation**: See `/docs/SPEC.md` in the logic-md repository

Enjoy\! 🚀
