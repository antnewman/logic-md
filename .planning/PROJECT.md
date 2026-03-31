# logic-md

## What This Is

An open-source TypeScript toolkit for parsing, validating, and compiling LOGIC.md files — a new declarative specification format for AI agent reasoning scaffolds. LOGIC.md fills the gap between identity (CLAUDE.md/SOUL.md) and capability (SKILL.md/TOOLS.md), defining *how* an agent thinks using YAML frontmatter in Markdown.

## Core Value

Developers can define agent reasoning strategies, step DAGs, quality gates, and inter-agent contracts in a portable, declarative file format — parsed and validated by a standalone library with zero framework lock-in.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Monorepo scaffolding with npm workspaces (packages/core, packages/cli)
- [ ] TypeScript strict mode, ESM output, Node 18+ target
- [ ] CI pipeline (GitHub Actions: test, lint, typecheck)
- [ ] Parser: extract YAML frontmatter from .md files, return typed LogicSpec object
- [ ] Validator: validate parsed YAML against embedded JSON Schema (ajv)
- [ ] Expression engine: evaluate `{{ }}` template expressions with context injection (custom parser, no eval)
- [ ] DAG resolver: topologically sort steps, detect cycles, resolve `needs` dependencies
- [ ] Inheritance resolver: handle `imports` composition with `$ref` resolution
- [ ] CLI: `logic-md validate <file>` — validate a LOGIC.md file and report errors
- [ ] CLI: `logic-md lint <file>` — check best practices (unused steps, unreachable branches, missing fallbacks)
- [ ] CLI: `logic-md compile <file>` — output compiled reasoning scaffold for a given step
- [ ] 90%+ test coverage on parser, validator, expression engine, and DAG resolver

### Out of Scope

- Reasoning compiler / prompt middleware (M2) — separate milestone
- Visual builder integration / Modular9 wiring (M3) — separate milestone
- Template marketplace (M4) — separate milestone
- Open source launch campaign (M5) — separate milestone
- npm publishing — deferred until package is stable
- Framework-specific integrations (LangGraph, CrewAI) — post-M1

## Context

The LOGIC.md specification v1.0 is complete and lives at `docs/LOGIC-md-Specification-v1.0.md` in the modular9 repo. It defines: reasoning strategies (CoT, ReAct, ToT, GoT, Plan-Execute), step DAGs with typed I/O and `{{ }}` expressions, inter-agent contracts, quality gates with self-verification loops, decision trees, fallback/escalation chains, and visual builder integration patterns.

No existing implementation exists anywhere — this is genuinely greenfield. The spec draws from GitHub Actions (conditionals, dependencies), Temporal (retry policies), MCP (typed schemas), and A2A (capability advertisement).

The 5-milestone implementation roadmap is documented at `docs/LOGIC.md.gsd-prompts.md` in the modular9 repo. This project covers scaffolding + M1 only.

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
| npm workspaces over nx/turborepo | Simplicity — two packages don't need complex orchestration | — Pending |
| biome over eslint+prettier | Single tool for lint+format, faster, less config | — Pending |
| vitest over jest | Native ESM support, faster, better TypeScript integration | — Pending |
| Custom expression parser over eval | Security — no code execution from user-authored LOGIC.md files | — Pending |
| Flat package structure (no src/) | Less nesting, simpler imports, monorepo packages are already namespaced | — Pending |
| GitHub repo at SingleSourceStudios | Use existing org, move to logic-md org later if needed | — Pending |

---
*Last updated: 2026-03-31 after initialization*
