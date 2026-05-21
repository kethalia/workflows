---
"@kethalia/workflows": minor
---

Remove the `label-gate` job from `reusable-visual-tests.yml`. Baseline-approval enforcement was redundant with ordinary PR review and the `pull_request` trigger lacked the `labeled` activity type, so the gate stayed red until the workflow was manually re-run after the label was applied — pure friction for no added security. Callers that previously listed `label-gate` as a required branch-protection check must drop it from the required set after upgrading. The `approval-label` input is kept as accepted-but-ignored for caller backwards-compatibility.
