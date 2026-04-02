# logic-md

## What This Is

An open-source TypeScript toolkit for parsing, validating, and compiling LOGIC.md files — a new declarative specification format for AI agent reasoning scaffolds. LOGIC.md fills the gap between identity (CLAUDE.md/SOUL.md) and capability (SKILL.md/TOOLS.md), defining *how* an agent thinks using YAML frontmatter in Markdown.

## Core Value

Developers can define agent reasoning strategies, step DAGs, quality gates, and inter-agent contracts in a portable, declarative file format — parsed and validated by a standalone library with zero framework lock-in.

## Current State

**Shipped:** v1.0 (parser, validator, expression engine, DAG resolver, CLI) + v1.1 (reasoning compiler)

The full parse-validate-compile pipeline is operational. A developer can write a LOGIC.md file, validate it, and compile individual steps or full workflows into injectable prompt segments ready for any LLM.

## Requirements

### Validated

- ✓ Monorepo scaffolding with npm workspaces (packages/core, packages/cli) — v1.0
- ✓ TypeScript strict mode, ESM output, Node 18+ target — v1.0
- ✓ CI pipeline (GitHub Actions: test, lint, typecheck) — v1.0
- ✓ Parser: extract YAML frontmatter from .md files, return typed LogicSpec object — v1.0
- ✓ Validator: validate parsed YAML against embedded JSON Schema (ajv) — v1.0
- ✓ Expression engine: evaluate `{{ }}` template expressions with context injection (custom parser, no eval) — v1.0
- ✓ DAG resolver: topologically sort steps, detect cycles, resolve `needs` dependencies — v1.0
- ✓ Import resolver: handle `imports` composition with namespace merging — v1.0
- ✓ CLI: `logic-md validate <file>` — validate a LOGIC.md file and report errors — v1.0
- ✓ CLI: `logic-md lint <file>` — check best practices — v1.0
- ✓ CLI: `logic-md compile <file>` — output compiled reasoning scaffold — v1.0
- ✓ 90%+ test coverage on parser, validator, expression engine, and DAG resolver — v1.0
- ✓ compileStep() returns CompiledStep with systemPromptSegment, outputSchema, qualityGates, retryPolicy — v1.1
- ✓ compileWorkflow() returns DAG-ordered pre-compiled steps with global quality gates and fallback — v1.1
- ✓ Quality gates compile to executable validators using expression engine — v1.1
- ✓ Token estimation (~4 chars/token) with 2000-token budget warnings — v1.1
- ✓ CLI `--step` flag for single-step compilation with self-reflection output — v1.1
- ✓ 90%+ test coverage on compiler module (100% stmts, 95.9% branches) — v1.1

### Active

(Next milestone requirements TBD — run `/gsd:new-milestone`)

### Out of Scope

- Visual builder integration / Modular9 wiring (M3) — separate milestone
- Template marketplace (M4) — separate milestone
- Open source launch campaign (M5) — separate milestone
- npm publishing — deferred until package is stable
- Framework-specific integrations (LangGraph, CrewAI) — post-M2
- LLM API calls — compiler is model-agnostic, produces text only

## Context

The LOGIC.md specification v1.0 is complete and lives at `docs/LOGIC-md-Specification-v1.0.md` in the modular9 repo. It defines: reasoning strategies (CoT, ReAct, ToT, GoT, Plan-Execute), step DAGs with typed I/O and `{{ }}` expressions, inter-agent contracts, quality gates with self-verification loops, decision trees, fallback/escalation chains, and visual builder integration patterns.

No competing implementation exists — this is the reference implementation of the LOGIC.md spec. The spec draws from GitHub Actions (conditionals, dependencies), Temporal (retry policies), MCP (typed schemas), and A2A (capability advertisement).

v1.0 shipped the parse-validate-resolve pipeline. v1.1 added the compiler layer that transforms parsed specs into LLM-injectable prompt segments. The codebase is ~8500 LOC TypeScript across two packages (core + cli), 328 tests passing, tagged at v1.1.0.

## Constraints

- **Monorepo tool**: npm workspaces — no nx/turborepo
- **Testing**: vitest (not jest)
- **Linting**: biome (not eslint + prettier)
- **Package structure**: flat — `packages/core/index.ts` not `packages/core/src/index.ts`
- **Dependencies**: gray-matter (frontmatter), ajv (JSON Schema), zero other runtime deps
- **Expression engine**: custom parser only — no eval(), no Function constructor
- **Target**: Node 18+ and modern bundlers
- **License**: MIT
- **TypeScript**: strict mode, no `any` types

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| npm workspaces over nx/turborepo | Simplicity — two packages don't need complex orchestration | ✓ Good |
| biome over eslint+prettier | Single tool for lint+format, faster, less config | ✓ Good |
| vitest over jest | Native ESM support, faster, better TypeScript integration | ✓ Good |
| Custom expression parser over eval | Security — no code execution from user-authored LOGIC.md files | ✓ Good |
| Flat package structure (no src/) | Less nesting, simpler imports, monorepo packages are already namespaced | ✓ Good |
| GitHub repo at SingleSourceStudios | Use existing org, move to logic-md org later if needed | ✓ Good |
| Pure compiler functions (no I/O) | Compiler produces text, never calls LLMs — keeps it model-agnostic | ✓ Good |
| Gate validators use expression engine | Reuse existing Pratt parser rather than adding eval dependency | ✓ Good |
| DAG resolver called inline per step | Pure function, no caching needed — simplicity over premature optimization | ✓ Good |

---
*Last updated: 2026-04-02 after v1.1 milestone completion*
