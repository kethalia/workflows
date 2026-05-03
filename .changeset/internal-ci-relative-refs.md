---
"@kethalia/workflows": patch
---

Restore relative `uses:` refs in internal-only workflows and teach `sync-workflow-refs.mjs` to skip them.

PR #9 over-applied the absolute-refs fix to every workflow. Internal workflows (those triggered by `push`, `pull_request`, or `workflow_dispatch` — currently `release.yml`, `ci-pr-changeset-required.yml`, and `retag-smoke.yml`) only ever run inside this repo and are immune to the nested-reusable annotated-tag bug. Pinning them to absolute refs created a chicken-and-egg problem: `sync-workflow-refs.mjs` would rewrite them to `@vX.Y.Z` on the auto-generated "Version Packages" PR, but `vX.Y.Z` doesn't exist until that PR merges, so the PR's own CI failed to resolve its references and blocked every release.

Internal workflows now use relative refs (`./.github/workflows/...`, `./.github/actions/...`); the sync script detects reusables by the presence of a `workflow_call` trigger and only rewrites those plus composite actions.
