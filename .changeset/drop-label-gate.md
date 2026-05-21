---
"@kethalia/workflows": major
---

BREAKING: Remove the `label-gate` job and the `approval-label` input from `reusable-visual-tests.yml`. Baseline-approval enforcement was redundant with ordinary PR review and the `pull_request` trigger lacked the `labeled` activity type, so the gate stayed red until the workflow was manually re-run after the label was applied — pure friction for no added security. Callers must (1) drop `label-gate` from any required-check list in branch protection, and (2) remove `approval-label:` from their `with:` block — passing an unknown input now fails workflow startup.
