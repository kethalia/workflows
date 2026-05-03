---
"@kethalia/workflows": patch
---

Rename internal-only workflows with an `internal-` prefix so reusable vs internal workflows are distinguishable from the file tree alone.

Renames:
- `release.yml` → `internal-release.yml`
- `ci-pr-changeset-required.yml` → `internal-ci-pr-changeset-required.yml`
- `retag-smoke.yml` → `internal-retag-smoke.yml`
- `retag-smoke.Dockerfile` → `internal-retag-smoke.Dockerfile`

These workflows are triggered only by `push`, `pull_request`, or `workflow_dispatch` and are not consumed by other repos via `uses:`. The `internal-` prefix complements the `workflow_call`-based classification in `sync-workflow-refs.mjs` with a human-readable signal.

If branch protection rules reference required checks by job name from `release.yml` or `ci-pr-changeset-required.yml`, update them after this releases.
