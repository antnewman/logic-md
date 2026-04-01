---
spec_version: "1.0"
name: "base-reasoning"
reasoning:
  strategy: cot
  temperature: 0.7
steps:
  analyze:
    description: "Analyze input data"
  synthesize:
    description: "Synthesize findings"
    needs: [analyze]
---
