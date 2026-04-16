---
spec_version: "1.0"
name: out-of-range-confidence
description: Invalid — confidence minimum exceeds 1.0 bound
steps:
  analyze:
    description: A step with invalid confidence values
    instructions: Analyze the data
    confidence:
      minimum: 1.5
      target: 2.0
      escalate_below: -0.5
---

# Out-of-range confidence values

This fixture should fail validation because confidence values must be in [0, 1].
