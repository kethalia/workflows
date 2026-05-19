---
"@kethalia/workflows": patch
---

fix(visual-tests): drop expression from job-level `permissions`

`jobs.<id>.permissions` does not support `${{ }}` expressions — GitHub
rejects such files at static-parse time, leaving callers with a 0-job
`failure` run and an empty `referenced_workflows` array. The v1.3.2
`contents: ${{ ... && 'write' || 'read' }}` expression triggered exactly
that.

Remove the `permissions:` block from the `visual-tests` job entirely.
Callers that need `update-baselines: true` must grant
`permissions: contents: write` on the calling job (or workflow); test-only
callers keep the repo default (`read`) and run cleanly.
