# @kethalia/workflows

## 1.0.0

### Major Changes

- d521b8f: Initial 1.0.0 release of the org-wide reusable workflows and composite actions.

  Stabilizes the public surface so consumer repos can pin to `@v1`:

  - `ci-build-lint-test.yml` — install/build/lint/format/typecheck/test matrix with coverage reporting and per-tool incremental caches.
  - `ci-quality.yml` — changeset gate, pnpm audit, and optional `verify-command`, `sherif-command`, `knip-command`, `madge-command` hooks.
  - `ci-changeset-check.yml`, `ci-publish-validation.yml` — standalone changeset gate and pkg-pr-new preview publishing.
  - `release-changesets.yml` — versioning + npm publish with `published` / `published-packages` outputs.
  - `build-stack.yml`, `build-and-push.yml`, `publish-docker-ghcr.yml`, `release-docker-stack.yml` — Docker build/publish flows with buildcache.
  - `retag-stack.yml`, `retag-image.yml`, `verify-ghcr-tags.yml`, `ghcr-prune.yml` — release-time GHCR promotion, preflight verification, retention.
  - `helm-lint.yml`, `resolve-runner.yml` — Helm linting and dynamic runner-label resolution.
  - `actions/setup-pnpm`, `actions/build-and-upload` — composite actions for pnpm bootstrap and image build/upload.

  Internal cross-references between workflows and composite actions are now version-pinned (rewritten by `scripts/sync-workflow-refs.mjs` during `changeset version`) so a release at `vX.Y.Z` references its own actions at `@vX.Y.Z`.
