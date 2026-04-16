---
spec_version: "1.0"
name: bad-output-violation
description: Invalid — on_output_violation uses input-only value
contracts:
  validation:
    mode: strict
    on_output_violation: reject
---

# Invalid output violation handler

This fixture should fail because `reject` is only valid for `on_input_violation`, not `on_output_violation`. Valid output violation values are: retry, warn, escalate.
