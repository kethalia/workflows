---
"@kethalia/workflows": minor
---

Add reusable `update-snapshots.yml` workflow that centralizes the
`/update-snapshots` PR-comment dispatcher pattern. Consumer repos drop in
a ~10-line caller that owns the `issue_comment` trigger and gates on the
comment prefix; the reusable handles commenter-permission check, fork-PR
refusal, PR head-branch resolution, `gh workflow run` dispatch, and the
follow-up confirmation comment.

Inputs are parameterized so the dispatcher can target any workflow that
exposes a boolean `workflow_dispatch` input, not just `visual-tests.yml`
with `update-baselines` — the defaults cover the common case.
