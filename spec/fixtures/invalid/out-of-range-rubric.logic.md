---
spec_version: "1.0"
name: out-of-range-rubric
description: Invalid — rubric weight exceeds 1.0 bound
quality_gates:
  self_verification:
    enabled: true
    strategy: rubric
    rubric:
      criteria:
        - name: accuracy
          weight: 1.5
          description: Weight exceeds valid 0-1 range
      minimum_score: -0.2
---

# Out-of-range rubric values

This fixture should fail validation because weight and minimum_score must be in [0, 1].
