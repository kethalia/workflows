---
"@kethalia/workflows": patch
---

Restore relative `uses:` refs in internal-only workflows and rename them with an `internal-` prefix.

PR #9 over-applied the absolute-refs fix to every workflow. Internal workflows (those triggered by `push`, `pull_request`, or `workflow_dispatch`) only ever run inside this repo and are immune to the nested-reusable annotated-tag bug. Pinning them to absolute refs created a chicken-and-egg problem: `sync-workflow-refs.mjs` would rewrite them to `@vX.Y.Z` on the auto-generated "Version Packages" PR, but `vX.Y.Z` doesn't exist until that PR merges, so the PR's own CI failed to resolve its references and blocked every release.

Internal workflows now use relative refs (`./.github/workflows/...`, `./.github/actions/...`); the sync script detects reusables by the presence of a `workflow_call` trigger and only rewrites those plus composite actions.

Renames (so reusable vs internal workflows are distinguishable from the file tree alone):
- `release.yml` → `internal-release.yml`
- `ci-pr-changeset-required.yml` → `internal-ci-pr-changeset-required.yml`
- `retag-smoke.yml` → `internal-retag-smoke.yml`
- `retag-smoke.Dockerfile` → `internal-retag-smoke.Dockerfile`

If branch protection rules reference required checks by job name from `release.yml` or `ci-pr-changeset-required.yml`, update them after this releases.
