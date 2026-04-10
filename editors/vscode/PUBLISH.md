# Publishing LOGIC.md VSCode Extension

This guide covers publishing the LOGIC.md extension to the VSCode Marketplace.

## Prerequisites

### 1. Create a Publisher Account

1. Go to https://marketplace.visualstudio.com
2. Sign in with your Microsoft account
3. Click "Create publisher" if you don't have one
4. Fill in publisher details:
   - **Name**: `singlesourcestudios` (as configured in package.json)
   - **Display Name**: "Single Source Studios"
   - **Description**: Organization behind LOGIC.md tools

### 2. Create a Personal Access Token (PAT)

1. Go to https://dev.azure.com/singlesourcestudios
2. Click "User settings" (top right) → "Personal access tokens"
3. New Token:
   - **Name**: `vsce-logic-md`
   - **Organization**: `singlesourcestudios`
   - **Scopes**: Select "Marketplace > Manage"
   - **Expiration**: 1 year (or as needed)
4. Copy the token (you won't see it again!)

### 3. Install vsce

```bash
npm install -g vsce
```

Or locally:
```bash
npm install --save-dev vsce
```

## Publishing Steps

### 1. Update Version Numbers

Update `package.json`:
```json
{
  "version": "0.1.0"
}
```

Update `CHANGELOG.md` with a new version section.

### 2. Build the Extension

```bash
cd editors/vscode
npm install
npm run vscode:prepublish
```

This creates an optimized, minified `out/extension.js`.

### 3. Create VSIX Package

```bash
npm run package
```

This generates `logic-md-vscode-0.1.0.vsix`.

### 4. Publish to Marketplace

#### Option A: Using vsce (Recommended)

```bash
# Login (first time only)
vsce login singlesourcestudios
# When prompted, paste your PAT

# Publish
vsce publish
```

#### Option B: Using PAT Directly

```bash
vsce publish --pat <your-personal-access-token>
```

#### Option C: Using .vscerc

Create `.vscerc` in the editor directory:
```json
{
  "publisher": "singlesourcestudios",
  "token": "<your-pat>"
}
```

Then just run:
```bash
vsce publish
```

## Pre-Publishing Checklist

Before publishing, verify:

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] `README.md` reflects current features
- [ ] All files in `.vscodeignore` are correct
- [ ] Extension builds without errors: `npm run vscode:prepublish`
- [ ] VSIX package created successfully: `npm run package`
- [ ] Tested locally with `code --install-extension logic-md-vscode-*.vsix`
- [ ] Marketplace account created and verified
- [ ] Publisher name matches `package.json` (`singlesourcestudios`)
- [ ] PAT has "Marketplace > Manage" scope
- [ ] Extension icon/logo is present (if added)

## Post-Publishing

### Update Marketplace Listing

After first publish, you can enhance the listing:

1. Go to https://marketplace.visualstudio.com/manage/publishers/singlesourcestudios
2. Click on the LOGIC.md extension
3. Edit:
   - **Long Description**: Detailed feature breakdown
   - **Categories**: Already set to "Programming Languages", "Linters"
   - **Keywords**: Add more for discoverability
   - **Icon**: Upload a 128x128 PNG icon
   - **Screenshots**: Add annotated screenshots of features
   - **Repository**: Link to GitHub
   - **Bugs**: Link to issues tracker
   - **License**: Link to LICENSE file

### Version Updates

For subsequent releases:

```bash
# Bump version in package.json (e.g., 0.2.0)
# Update CHANGELOG.md

# Rebuild and publish
npm run vscode:prepublish
vsce publish
```

Or use semver:
```bash
# Automatically bump patch version (0.1.0 → 0.1.1)
vsce publish patch

# Bump minor version (0.1.0 → 0.2.0)
vsce publish minor

# Bump major version (0.1.0 → 1.0.0)
vsce publish major
```

## Troubleshooting

### "Error: Missing publisher name in package.json"
Ensure `package.json` has:
```json
{
  "name": "logic-md-vscode",
  "publisher": "singlesourcestudios"
}
```

### "Error: The marketplace service returned error code 409"
Version already exists. Bump version in `package.json`:
```bash
vsce publish patch
```

### "Error: Invalid PAT"
1. Verify PAT hasn't expired
2. Check PAT has "Marketplace > Manage" scope
3. Ensure organization is correct
4. Try creating a new PAT

### "Error: HTTP 400: Bad Request"
Usually means validation errors. Check:
- All required fields in `package.json`
- Icons are valid PNG/SVG format
- Screenshots are valid image files
- No special characters in fields

### Extension not appearing in search

Indexing takes 5-10 minutes. If not showing after that:
1. Check publisher account is verified
2. Verify extension is listed in your publisher dashboard
3. Try searching by exact name: "LOGIC.md"
4. Try searching by publisher: "singlesourcestudios"

## Marketplace Keywords

Recommended keywords for discoverability:
- logic-md
- LOGIC.md
- reasoning
- AI
- agent
- workflow
- specification
- syntax highlighting
- validation

Update in `package.json`:
```json
{
  "keywords": [
    "logic-md",
    "reasoning",
    "AI",
    "agent",
    "workflow"
  ]
}
```

## GitHub Actions (Automated Publishing)

For CI/CD automated publishing, create `.github/workflows/publish.yml`:

```yaml
name: Publish to VSCode Marketplace

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: cd editors/vscode && npm install

      - run: cd editors/vscode && npm run vscode:prepublish

      - run: cd editors/vscode && npx vsce publish --pat ${{ secrets.VSCE_PAT }}
```

Then in GitHub:
1. Go to Settings → Secrets and variables → Actions
2. New secret: `VSCE_PAT` = your personal access token
3. Tag releases: `git tag v0.1.0 && git push origin v0.1.0`

## Resources

- [VSCode Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vsce)
- [Marketplace Publishing Guide](https://marketplace.visualstudio.com/manage)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Support

For publishing issues:
- Check vsce docs: `vsce --help`
- Review VSCode Extension guidelines
- Contact VSCode Marketplace support

## License

MIT - See LICENSE in repository root
