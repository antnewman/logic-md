---
spec_version: "1.0"
name: bad-verification
steps:
  analyze:
    instructions: "Analyze data"
    verification:
      check: "{{ output.valid }}"
      on_fail: explode
---

on_fail must be one of: retry, escalate, skip, abort, revise.
