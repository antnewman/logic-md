---
spec_version: "1.0"
name: bad-input-violation
description: Invalid — on_input_violation uses output-only value
contracts:
  validation:
    mode: strict
    on_input_violation: escalate
---

# Invalid input violation handler

This fixture should fail because `escalate` is only valid for `on_output_violation`, not `on_input_violation`. Valid input violation values are: reject, coerce, warn.
