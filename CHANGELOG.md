# @kethalia/workflows

## 1.1.1

### Patch Changes

- 7287332: fix(retag-stack): remove unevaluated `${{ github... }}` expression from `ref` input description

  GitHub's expression parser evaluates `${{ ... }}` tokens even inside `description:` text. The example in the `ref` input description referenced `github.event.workflow_run.head_sha`, which isn't available in the inputs declaration context, causing the entire workflow file to fail validation. The example is now described in prose.

## 1.1.0

### Minor Changes

- 959cb63: retag-stack: add optional `ref` input to pin source SHA across reusable boundaries

  `retag-stack.yml` previously derived its source `:sha-<short>` tag from `${GITHUB_SHA:0:7}` and checked out the repo at `github.sha`. When invoked from a `workflow_run`-triggered caller (e.g. `release.yml` gated on `Build images` completion), `github.sha` resolves to the default-branch HEAD at the moment the caller starts — not to the SHA the triggering build was for. If a new commit lands on `main` between the build finishing and the release job starting, retag would look for a `:sha-<short>` tag that the upstream build never pushed.

  Adds an optional `ref` input to `retag-stack.yml` (and pass-through to the `setup-pnpm` composite action). When provided, both `actions/checkout` and the `source-sha-short` derivation use it; when omitted, behavior is unchanged.

  Callers gated on `workflow_run` should now pass:

  ```yaml
  uses: kethalia/workflows/.github/workflows/retag-stack.yml@v1
  with:
    ref: ${{ github.event.workflow_run.head_sha }}
  ```

  `retag-image.yml` is unchanged — it already takes `source-tag` directly and performs no checkout, so the caller is already in control.

## 1.0.1

### Patch Changes

- 8530bf5: Replace relative `uses: ./.github/workflows/*.yml` references inside reusable workflows with absolute `kethalia/workflows/.github/workflows/*.yml@<tag>` references.

  Annotated tags (e.g. `v1.0.0`) trigger a GitHub Actions resolver bug on `push` and `schedule` events: the resolver records the tag-object SHA and then cannot walk relative paths against it, causing nested reusable lookups to fail with "workflow was not found" and the workflow to load with 0 jobs. Absolute references skip the relative-lookup code path entirely and resolve correctly under all event types. The `version` script (`scripts/sync-workflow-refs.mjs`) keeps these refs pinned to the current package version on every release.

- f8a9b26: Restore relative `uses:` refs in internal-only workflows and rename them with an `internal-` prefix.

  PR #9 over-applied the absolute-refs fix to every workflow. Internal workflows (those triggered by `push`, `pull_request`, or `workflow_dispatch`) only ever run inside this repo and are immune to the nested-reusable annotated-tag bug. Pinning them to absolute refs created a chicken-and-egg problem: `sync-workflow-refs.mjs` would rewrite them to `@vX.Y.Z` on the auto-generated "Version Packages" PR, but `vX.Y.Z` doesn't exist until that PR merges, so the PR's own CI failed to resolve its references and blocked every release.

  Internal workflows now use relative refs (`./.github/workflows/...`, `./.github/actions/...`); the sync script detects reusables by the presence of a `workflow_call` trigger and only rewrites those plus composite actions. The script normalizes path separators so the workflow-directory check works on Windows, and the `workflow_call` detection comment clarifies it's a heuristic rather than `on:`-block-anchored.

  Renames (so reusable vs internal workflows are distinguishable from the file tree alone):

  - `release.yml` → `internal-release.yml`
  - `ci-pr-changeset-required.yml` → `internal-ci-pr-changeset-required.yml`
  - `retag-smoke.yml` → `internal-retag-smoke.yml`
  - `retag-smoke.Dockerfile` → `internal-retag-smoke.Dockerfile`

  If branch protection rules reference required checks by job name from `release.yml` or `ci-pr-changeset-required.yml`, update them after this releases.

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
