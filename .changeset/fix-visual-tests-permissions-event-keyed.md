---
"@kethalia/workflows": patch
---

fix(visual-tests): key `contents` permission on `github.event_name == 'workflow_dispatch'` instead of unconditionally requesting `write`. The unconditional `write` in v1.3.1 caused `startup_failure` on caller workflows (e.g. PR/push triggers) that did not grant `contents: write` at the caller-job level — a reusable workflow cannot exceed its caller's permissions. Baseline-update runs are dispatched manually via `workflow_dispatch`, so the keyed expression preserves that capability while letting PR/push test runs fall back to `read`.
