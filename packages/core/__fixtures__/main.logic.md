---
spec_version: "1.0"
name: "main-workflow"
imports:
  - ref: "./base.logic.md"
    as: "base"
reasoning:
  strategy: react
  temperature: 0.5
steps:
  local_step:
    description: "A local step"
---
