# /logic:fix-build

Diagnose and fix build pipeline issues in the logic-md monorepo.

## Architecture

The monorepo has three packages with a strict build order:

```
@logic-md/core  →  @logic-md/cli  →  @logic-md/mcp
   (tsc)             (tsup)             (tsup)
```

Core MUST build first because cli and mcp bundle it via tsup's `noExternal`.

## Build Commands

```bash
npm run build:core   # tsc --build (core only)
npm run build        # core → cli → mcp (sequential)
npm test             # run all tests across all packages
```

## Common Issues

### Missing files in dist/
`tsc --build` only compiles `.ts` files. It does NOT copy:
- `schema.json` — needed by `packages/core/schema.ts` at runtime
- Template files, assets, or other non-TS resources

**Fixes:**
- Embed JSON via `import schema from "./schema.json" with { type: "json" }` (preferred — eliminates the bug class)
- Add a postbuild copy script in `package.json`
- Switch to tsup (already used by cli/mcp, handles assets natively)

### Import path issues
Core uses `NodeNext` module resolution. All relative imports need `.js` extensions:
```ts
import { parse } from "./parser.js";  // correct
import { parse } from "./parser";      // breaks at runtime
```

### tsup bundling failures
cli and mcp use tsup to bundle core. If core's exports change:
1. Check `packages/core/index.ts` exports
2. Check tsup configs in `packages/cli/tsup.config.ts` and `packages/mcp/tsup.config.ts`
3. Verify `noExternal: ["@logic-md/core"]` is present

### Test discrepancies
Core's vitest runs against TypeScript source (not compiled dist). This means:
- Tests can pass even if the build is broken
- `schema.ts` using `readFileSync(join(__dirname, "schema.json"))` works in vitest (source dir has schema.json) but fails in compiled dist (dist/ doesn't have it)

To catch this: always run `npm run build && node -e "require('@logic-md/core')"` after build changes.

## Workflow

1. Reproduce the issue: `npm run build && npm test`
2. Identify which package fails and at what stage
3. Apply fix
4. Verify: `npm run build && npm test` (both must pass)
5. Commit: `fix(build): <description>`
