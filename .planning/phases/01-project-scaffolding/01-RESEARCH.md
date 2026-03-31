# Phase 1: Project Scaffolding - Research

**Researched:** 2026-03-31
**Domain:** Monorepo scaffolding (npm workspaces, TypeScript ESM, Biome, Vitest, GitHub Actions)
**Confidence:** HIGH

## Summary

Phase 1 sets up a greenfield npm workspaces monorepo with two packages (`packages/core` and `packages/cli`), TypeScript in strict mode with ESM output, Biome for linting/formatting, Vitest for testing, and GitHub Actions for CI. The repo is empty -- there is no existing code, no package.json, nothing to migrate.

All tools in this phase are well-documented and widely used. npm workspaces are native to npm and require minimal configuration. Biome v2 has first-class monorepo support with `extends: "//"` syntax. Vitest v4 supports monorepo via `projects` configuration. The constraint is flat package structure (no `src/` directory inside packages), which affects TypeScript path configuration.

**Primary recommendation:** Use TypeScript 5.8 (stable, well-supported) with `module: "nodenext"` and `moduleResolution: "nodenext"`, Biome 2.x with a root `biome.json`, Vitest 4.x with root-level `projects` config, and a single GitHub Actions workflow file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-01 | Monorepo with npm workspaces containing packages/core and packages/cli | npm workspaces config in root package.json |
| SCAF-02 | TypeScript strict mode with ESM output targeting Node 18+ | tsconfig.json with `strict: true`, `module: "nodenext"`, `target: "ES2022"` |
| SCAF-03 | Path aliases between packages (core importable from cli) | TypeScript project references + workspace dependency |
| SCAF-04 | Biome configured for lint and format across all packages | Root biome.json with recommended rules |
| SCAF-05 | Vitest configured with empty passing tests in each package | Root vitest.config.ts with `projects` pointing to packages |
| SCAF-06 | GitHub Actions CI: test + lint + typecheck on PR to main/develop | Single workflow yaml with npm ci + vitest + biome + tsc |
| SCAF-07 | README.md with project description, quick start placeholder, license badge | Standard markdown template |
| SCAF-08 | LICENSE (MIT) and CONTRIBUTING.md skeleton | Standard MIT text + minimal contributing guide |
| SCAF-09 | .gitignore covering node_modules, dist, .env, coverage | Standard Node/TypeScript gitignore |
| SCAF-10 | Branch strategy: main (stable) + develop (active) | Git branch creation |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | ~5.8.x | Type checking and compilation | Latest stable before 6.0 transitional release; `node18` moduleResolution available |
| @biomejs/biome | ~2.4.x | Lint + format (replaces ESLint + Prettier) | Single tool, Rust-based, fast, monorepo support in v2 |
| vitest | ~4.1.x | Test runner | Native ESM, fast, TypeScript-first, monorepo `projects` support |
| @types/node | ^18 | Node.js type definitions | Matches Node 18+ target |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gray-matter | ^4.0.3 | YAML frontmatter parsing | Phase 3+, but install now as declared dependency |
| ajv | ^8.x | JSON Schema validation | Phase 4+, but install now as declared dependency |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TypeScript 5.8 | TypeScript 6.0 | 6.0 released March 23 2026 -- transitional release with deprecations preparing for Go rewrite; 5.8 is more stable |
| npm workspaces | pnpm/turborepo | Constraint: npm workspaces specified in PROJECT.md |
| Biome | ESLint + Prettier | Constraint: Biome specified in PROJECT.md |
| Vitest | Jest | Constraint: Vitest specified in PROJECT.md |

**Installation (root):**
```bash
npm install --save-dev typescript@~5.8 @biomejs/biome@~2.4 vitest@~4.1 @types/node@^18
```

**Installation (packages/core):**
```bash
npm install --workspace=packages/core gray-matter@^4 ajv@^8
```

## Architecture Patterns

### Recommended Project Structure

```
logic-md/
├── package.json              # Root: workspaces config, shared scripts
├── tsconfig.json             # Root: base TypeScript config
├── tsconfig.build.json       # Root: build-only config with project references
├── biome.json                # Root: lint + format rules
├── vitest.config.ts          # Root: test projects config
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI
├── .gitignore
├── LICENSE
├── README.md
├── CONTRIBUTING.md
└── packages/
    ├── core/
    │   ├── package.json      # name: @logic-md/core
    │   ├── tsconfig.json     # extends root, project-specific
    │   ├── index.ts          # Main entry (FLAT - no src/)
    │   └── index.test.ts     # Test file (FLAT - no src/)
    └── cli/
        ├── package.json      # name: @logic-md/cli, depends on @logic-md/core
        ├── tsconfig.json     # extends root, references core
        ├── index.ts          # Main entry (FLAT - no src/)
        └── index.test.ts     # Test file (FLAT - no src/)
```

### Pattern 1: Root package.json with Workspaces

**What:** npm workspaces defined in root package.json
**When to use:** Always -- this is the monorepo entry point

```json
{
  "name": "logic-md",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "vitest run",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --build",
    "build": "tsc --build"
  },
  "devDependencies": {
    "typescript": "~5.8.0",
    "@biomejs/biome": "~2.4.0",
    "vitest": "~4.1.0",
    "@types/node": "^18.0.0"
  }
}
```

### Pattern 2: TypeScript Project References for Cross-Package Imports

**What:** Use TypeScript project references so `packages/cli` can import from `packages/core`
**When to use:** When one workspace package depends on another

Root `tsconfig.json` (base config only, not a project reference root):
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": ".",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Root `tsconfig.build.json` (project references):
```json
{
  "files": [],
  "references": [
    { "path": "packages/core" },
    { "path": "packages/cli" }
  ]
}
```

Package `tsconfig.json` (e.g., `packages/core/tsconfig.json`):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["*.ts", "**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

Package `packages/cli/tsconfig.json` (with reference to core):
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "."
  },
  "include": ["*.ts", "**/*.ts"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"],
  "references": [
    { "path": "../core" }
  ]
}
```

### Pattern 3: Workspace Package Dependency

**What:** `packages/cli` declares dependency on `packages/core` using workspace protocol
**When to use:** For cross-package imports

In `packages/cli/package.json`:
```json
{
  "name": "@logic-md/cli",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "@logic-md/core": "*"
  }
}
```

npm workspaces resolves `"@logic-md/core": "*"` to the local `packages/core` via symlink.

### Pattern 4: Biome Root Configuration

**What:** Single biome.json at root level for the entire monorepo
**When to use:** Simple monorepos where all packages share the same lint/format rules

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "files": {
    "ignore": ["dist", "node_modules", "coverage"]
  }
}
```

### Pattern 5: Vitest Root Config with Projects

**What:** Root vitest.config.ts that discovers test projects in packages
**When to use:** Monorepo test execution from root

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
  },
});
```

Each package gets a `vitest.config.ts` (or tests run based on package-level config):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
  },
});
```

### Anti-Patterns to Avoid

- **`src/` directory inside packages:** Constraint explicitly forbids this. Use flat structure: `packages/core/index.ts`, not `packages/core/src/index.ts`
- **Individual lint scripts per package:** Use single root `biome check .` instead -- Biome traverses the monorepo
- **`module: "commonjs"` or `module: "esnext"`:** Use `"nodenext"` for proper Node.js ESM interop
- **Relative `.ts` imports:** With `moduleResolution: "nodenext"`, imports must use `.js` extensions (e.g., `import { parse } from "./parser.js"`) even though source files are `.ts`
- **`@ts-ignore` or `any` types:** Strict mode is a constraint; no workarounds

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monorepo package linking | Custom symlink scripts | npm workspaces | Native npm feature, handles hoisting and resolution |
| Lint + format | ESLint + Prettier config | Biome | Single config file, 10-20x faster, constraint |
| Test running | Custom test harness | Vitest | Native ESM, watch mode, coverage built-in |
| CI pipeline | Shell scripts for CI | GitHub Actions workflow | Declarative, cached, status checks on PRs |
| .gitignore | Manual file listing | github/gitignore Node template | Comprehensive, maintained |
| License text | Writing MIT text | Standard MIT template | Legal accuracy |

## Common Pitfalls

### Pitfall 1: Missing `"type": "module"` in package.json
**What goes wrong:** Node.js treats `.js` files as CommonJS, breaking ESM imports
**Why it happens:** Forgetting to add `"type": "module"` to root AND each package's package.json
**How to avoid:** Add `"type": "module"` to ALL package.json files (root + packages/core + packages/cli)
**Warning signs:** `ERR_REQUIRE_ESM` or `SyntaxError: Cannot use import statement` errors

### Pitfall 2: Import Extensions with nodenext
**What goes wrong:** TypeScript compiles but Node.js cannot resolve imports at runtime
**Why it happens:** `moduleResolution: "nodenext"` requires explicit `.js` extensions in import paths, even when source is `.ts`
**How to avoid:** Always write `import { foo } from "./bar.js"` not `import { foo } from "./bar"`
**Warning signs:** TypeScript error "Relative import paths need explicit file extensions"

### Pitfall 3: Vitest Coverage in Root vs Package Config
**What goes wrong:** Coverage doesn't work or reports incorrectly
**Why it happens:** Coverage and reporter settings MUST be in root vitest.config.ts, not per-package configs
**How to avoid:** Only configure coverage at root level
**Warning signs:** Empty coverage reports, coverage not running

### Pitfall 4: TypeScript Project References Not Building
**What goes wrong:** `tsc --build` fails or produces no output
**Why it happens:** Missing `composite: true` in package tsconfig, or incorrect `references` paths
**How to avoid:** Each package tsconfig MUST have `"composite": true` when used with project references
**Warning signs:** "Referenced project must have setting 'composite': true" error

### Pitfall 5: Biome and TypeScript Disagreeing on Import Order
**What goes wrong:** Biome auto-formats imports, then TypeScript complains about order
**Why it happens:** Biome's import organizer and TypeScript's expectations can conflict
**How to avoid:** Let Biome own import organization; disable any TypeScript import ordering rules
**Warning signs:** Formatting ping-pong between tools

### Pitfall 6: npm Workspaces Hoisting Conflicts
**What goes wrong:** A dependency installed in one package isn't found
**Why it happens:** npm hoists dependencies to root by default; version conflicts prevent hoisting
**How to avoid:** Use `--save-dev` at root for shared dev deps (typescript, biome, vitest); package-specific deps in their own package.json
**Warning signs:** "Cannot find module" at runtime despite `npm ls` showing it installed

## Code Examples

### Empty Passing Test (packages/core/index.test.ts)
```typescript
import { describe, it, expect } from "vitest";

describe("core", () => {
  it("should be importable", () => {
    expect(true).toBe(true);
  });
});
```

### Package Entry Point (packages/core/index.ts)
```typescript
export const VERSION = "0.0.0";
```

### Cross-Package Import Test (packages/cli/index.test.ts)
```typescript
import { describe, it, expect } from "vitest";
import { VERSION } from "@logic-md/core";

describe("cli", () => {
  it("should import from core", () => {
    expect(VERSION).toBe("0.0.0");
  });
});
```

### GitHub Actions CI Workflow (.github/workflows/ci.yml)
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
```

### Package-level package.json (packages/core/package.json)
```json
{
  "name": "@logic-md/core",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier | Biome 2.x | 2024-2025 | Single config, 10-20x faster |
| Jest | Vitest 4.x | 2024-2025 | Native ESM, no transform config |
| Vitest `workspace` | Vitest `projects` | Vitest 3.2+ | `workspace` deprecated, use `projects` |
| `moduleResolution: "node"` | `moduleResolution: "nodenext"` | TS 5.0+ | Proper ESM resolution |
| TypeScript 5.x | TypeScript 6.0 | March 2026 | 6.0 is transitional; 5.8 recommended for stability |
| Biome 1.x single config | Biome 2.x `extends: "//"` | 2025 | First-class monorepo support |

**Deprecated/outdated:**
- `vitest` workspace config: Use `projects` instead (deprecated since Vitest 3.2)
- `moduleResolution: "node"`: Does not support ESM properly; use `"nodenext"` or `"node18"`
- TypeScript 6.0 `--stableTypeOrdering`: Diagnostic-only flag, adds 25% slowdown, not for production

## Open Questions

1. **TypeScript 5.8 vs 6.0**
   - What we know: TS 6.0 released March 23, 2026. It is stable but transitional with deprecations for Go-based 7.0
   - What's unclear: Whether all tooling (Biome 2.4, Vitest 4.1) fully supports TS 6.0 defaults
   - Recommendation: Use TypeScript 5.8.x for stability. Upgrade to 6.0 after ecosystem catches up. TS 5.8 has `node18` moduleResolution and all needed features.

2. **Package Scope Naming**
   - What we know: PROJECT.md mentions `@logic-md/core` scoping convention via package naming
   - What's unclear: Whether an npm org `@logic-md` exists or is needed
   - Recommendation: Use `@logic-md/core` and `@logic-md/cli` for package names -- npm workspaces resolve locally regardless of npm registry state

3. **Biome indent style**
   - What we know: Biome defaults to tabs; many TypeScript projects use 2-space indent
   - What's unclear: No explicit preference in PROJECT.md
   - Recommendation: Use tabs (Biome default) -- simpler config, accessibility-friendly

## Sources

### Primary (HIGH confidence)
- [npm workspaces docs](https://docs.npmjs.com/cli/v10/using-npm/workspaces) - workspace configuration
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig/) - module/moduleResolution options
- [Biome official docs](https://biomejs.dev/guides/big-projects/) - monorepo configuration with `extends: "//"`
- [Vitest projects guide](https://vitest.dev/guide/projects) - monorepo test project configuration

### Secondary (MEDIUM confidence)
- [Vitest 3 Monorepo Setup blog](https://www.thecandidstartup.org/2025/09/08/vitest-3-monorepo-setup.html) - practical monorepo patterns and gotchas
- [npm workspaces + TypeScript blog](https://yieldcode.blog/post/npm-workspaces/) - workspace setup walkthrough
- [TypeScript 6.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) - version decision context
- [Biome vs ESLint comparison](https://betterstack.com/community/guides/scaling-nodejs/biome-eslint/) - tooling rationale

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools are well-documented, versions verified via npm/official releases
- Architecture: HIGH - npm workspaces + TS project references is the standard pattern, verified across multiple sources
- Pitfalls: HIGH - ESM/nodenext gotchas are well-documented and widely experienced

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable tooling, slow-moving domain)
