# kethalia/workflows

Canonical home for the reusable GitHub Actions **workflows** and **composite actions** shared across the kethalia, chillwhales, and phlox-labs orgs. Consumers reference workflows via absolute `uses:` (e.g. `uses: kethalia/workflows/.github/workflows/ci-build-lint-test.yml@<version>`) — no per-repo copies, one place to fix, one place to evolve.

> **Always pin to a specific released version** (e.g. `@v1.0.0`). The examples in this README use `@<version>` as a placeholder — substitute the tag you intend to consume. See [Versioning](#versioning) for the available ref styles and recommendations.

See also: [.github/docs/RUNNER-TIERING.md](.github/docs/RUNNER-TIERING.md) for the heavy/light runner resolution model used by `resolve-runner.yml` and downstream consumers.

## Table of Contents

- [Consumer-side alias pattern](#consumer-side-alias-pattern)
- [Versioning](#versioning)
- [Workflows](#workflows)
  - [Reusable — Build and push Docker image to GHCR](#reusable--build-and-push-docker-image-to-ghcr) — `build-and-push.yml`
  - [Reusable — Build stack of Docker images](#reusable--build-stack-of-docker-images) — `build-stack.yml`
  - [CI — Build, Lint & Test](#ci--build-lint--test) — `ci-build-lint-test.yml`
  - [CI — Changeset Check](#ci--changeset-check) — `ci-changeset-check.yml`
  - [CI — Publish Validation](#ci--publish-validation) — `ci-publish-validation.yml`
  - [CI — Quality Checks](#ci--quality-checks) — `ci-quality.yml`
  - [Reusable — GHCR retention prune](#reusable--ghcr-retention-prune) — `ghcr-prune.yml`
  - [CI — Helm Lint & Template](#ci--helm-lint--template) — `helm-lint.yml`
  - [Publish — Docker image to GHCR](#publish--docker-image-to-ghcr) — `publish-docker-ghcr.yml`
  - [Release — Changesets](#release--changesets) — `release-changesets.yml`
  - [Release — Docker stack](#release--docker-stack) — `release-docker-stack.yml`
  - [Reusable — Resolve runner labels](#reusable--resolve-runner-labels) — `resolve-runner.yml`
  - [Retag — Single GHCR image](#retag--single-ghcr-image) — `retag-image.yml`
  - [Smoke — retag-image](#smoke--retag-image) — `internal-retag-smoke.yml`
  - [Retag — Docker stack (promote on release)](#retag--docker-stack-promote-on-release) — `retag-stack.yml`
  - [Reusable — Verify GHCR tags](#reusable--verify-ghcr-tags) — `verify-ghcr-tags.yml`

## Consumer-side alias pattern

Wrap each shared workflow you consume in a thin local alias under `.github/workflows/` in the consumer repo. The wrapper centralizes the pin so the eventual version bump is one line per consumer, not N lines:

```yaml
name: ci
on: [push, pull_request]
jobs:
  ci:
    uses: kethalia/workflows/.github/workflows/ci-build-lint-test.yml@<version>
    with:
      build-command: pnpm build
      artifact-paths: |
        dist
```

When you upgrade, you change the `uses:` line in this wrapper to the new tag and every workflow run in that repo picks it up — no edits to caller jobs, no PR sprawl.

## Versioning

**Pin to a specific released version.** Examples in this README use `@<version>` as a placeholder — replace it with a real tag (e.g. `@v1.0.0`) before committing.

Releases are cut by [Changesets](https://github.com/changesets/changesets). On push to `main`, `internal-release.yml` opens (or updates) a `chore(release): version packages` PR. Merging that PR:

1. Bumps `package.json`, regenerates `CHANGELOG.md`, and runs `scripts/sync-workflow-refs.mjs` so every internal `uses: kethalia/workflows/...@<ref>` cross-reference in this repo is rewritten to the new `@vX.Y.Z`. The released tag therefore references its own actions and workflows at the same version — no drift inside a release.
2. Creates the immutable `vX.Y.Z` tag.
3. The `tag-major` job force-moves the floating `vX` and `vX.Y` tags to the same SHA so consumers can opt into non-breaking updates by pinning to a moving major or minor.

**Pinning recommendations for consumers, in order of preference:**

- `@vX.Y.Z` (e.g. `@v1.0.0`) — **recommended.** Fully reproducible; CI runs are deterministic and a forced retag of a major or minor cannot silently change behavior.
- `@vX.Y` (e.g. `@v1.0`) — receives patch fixes automatically; no minor or major drift. Acceptable when you trust the patch promise.
- `@vX` (e.g. `@v1`) — receives all non-breaking changes. Convenient, but a minor release that introduces a regression hits every consumer at once.
- `@main` — **not recommended.** Because internal `uses:` refs are pinned by the version PR, `main` references the *previous* release's actions until the next release PR rewrites them. Use only for ad-hoc testing of unreleased changes.

Breaking changes ship as a new major (`v2`, `v3`, ...) and are announced via the Changesets release notes before merging.

## Workflows

### Reusable — Build and push Docker image to GHCR

File: [`build-and-push.yml`](.github/workflows/build-and-push.yml). Builds a Docker image with a registry-backed BuildKit cache and optionally pushes it to GHCR. When `push: false`, builds only and skips `cache-to` (read-only tokens cannot export cache).

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `image` | string | true | — | GHCR image name without owner prefix or tag (e.g. "chillpass-smoke"). Lowercased automatically. |
| `tags` | string | true | — | Newline-separated full tag refs to apply (e.g. "ghcr.io/chillwhales/chillpass-smoke:smoke-abc1234"). |
| `context` | string | false | `.` | Docker build context path. |
| `dockerfile` | string | false | `Dockerfile` | Path to the Dockerfile, relative to the build context. |
| `platforms` | string | false | `linux/amd64` | Comma-separated build platforms. |
| `build-args` | string | false | `""` | Newline-separated KEY=VALUE build args. |
| `push` | boolean | false | `true` | Whether to push tags and export build cache. Set false for fork PR validation builds. |

```yaml
jobs:
  build:
    permissions:
      contents: read
      packages: write
    uses: kethalia/workflows/.github/workflows/build-and-push.yml@<version>
    with:
      image: chillpass-smoke
      tags: |
        ghcr.io/${{ github.repository_owner }}/chillpass-smoke:smoke-${{ github.sha }}
```

### Reusable — Build stack of Docker images

File: [`build-stack.yml`](.github/workflows/build-stack.yml). Fans out a matrix build of multiple GHCR images from a single JSON service spec. Calls `build-and-push.yml` per service.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `services` | string | true | — | JSON array of services to build. Each entry supports: image (required) — GHCR image name (no owner, no tag). Lowercased downstream. context (optional) — Docker build context. Default ".". dockerfile (optional) — Dockerfile path relative to context. Default "Dockerfile". platforms (optional) — Comma-separated. Default "linux/amd64". build-args (optional) — Newline-separated KEY=VALUE. Default "". |
| `push` | boolean | true | — | Whether to push tags and export build cache. Set false for fork-PR validation. Typically: github.event_name == 'push' \|\| github.event.pull_request.head.repo.full_name == github.repository |

```yaml
jobs:
  build-stack:
    permissions:
      contents: read
      packages: write
    uses: kethalia/workflows/.github/workflows/build-stack.yml@<version>
    with:
      services: |
        [
          { "image": "chillpass-api", "context": "apps/api" },
          { "image": "chillpass-web", "context": "apps/web" }
        ]
      push: ${{ github.event_name == 'push' }}
```

### CI — Build, Lint & Test

File: [`ci-build-lint-test.yml`](.github/workflows/ci-build-lint-test.yml). Build → lint → format → typecheck → test (matrix) pipeline with optional incremental build cache and artifact upload.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `node-version` | number | false | `22` | Node.js version |
| `build-command` | string | true | — | Build command (e.g., "pnpm build") |
| `lint-command` | string | false | `""` | Lint command (e.g., "pnpm lint") |
| `format-command` | string | false | `""` | Format check command (e.g., "pnpm format:check") |
| `test-command` | string | false | `""` | Test command (e.g., "pnpm test:coverage") |
| `typecheck-command` | string | false | `""` | Typecheck command (e.g., "pnpm typecheck") |
| `pre-lint-command` | string | false | `""` | Command to run before lint (e.g., build dependency packages) |
| `test-node-versions` | string | false | `"[20, 22]"` | JSON array of Node versions for test matrix |
| `artifact-paths` | string | true | — | Newline-separated paths to upload after build |
| `coverage-artifact-name` | string | false | `coverage-reports` | Name for coverage artifact |
| `build-cache-paths` | string | false | `""` | Newline-separated paths to cache across builds (e.g., .next/cache). Cache is keyed on the lockfile + source file hashes so incremental builds reuse prior compilation output. Leave empty to disable. |
| `build-cache-key-files` | string | false | `**/*.[jt]s\n**/*.[jt]sx` | Glob(s) for source files whose hash invalidates the build cache. Defaults to common JS/TS source patterns. |

```yaml
jobs:
  ci:
    uses: kethalia/workflows/.github/workflows/ci-build-lint-test.yml@<version>
    with:
      build-command: pnpm build
      artifact-paths: |
        dist
```

### CI — Changeset Check

File: [`ci-changeset-check.yml`](.github/workflows/ci-changeset-check.yml). Verifies that a PR includes (or intentionally skips) a changeset entry against the base branch.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `node-version` | number | false | `22` | Node.js version |
| `base-branch` | string | false | `main` | Base branch for changeset comparison |

```yaml
jobs:
  changeset-check:
    uses: kethalia/workflows/.github/workflows/ci-changeset-check.yml@<version>
```

### CI — Publish Validation

File: [`ci-publish-validation.yml`](.github/workflows/ci-publish-validation.yml). Validates package publish readiness and (optionally) publishes pkg-pr-new previews for selected packages.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `node-version` | number | false | `22` | Node.js version |
| `preview-packages` | string | false | `""` | Space-separated list of package directories for pkg-pr-new preview |

```yaml
jobs:
  publish-validation:
    uses: kethalia/workflows/.github/workflows/ci-publish-validation.yml@<version>
```

### CI — Quality Checks

File: [`ci-quality.yml`](.github/workflows/ci-quality.yml). Aggregate quality gate: package verify, changeset status (PRs), audit, sherif, knip, madge — each opt-in.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `node-version` | number | false | `22` | Node.js version |
| `verify-command` | string | false | `""` | Package verification command (e.g., "pnpm validate:publish") |
| `changeset-check` | boolean | false | `true` | Whether to run changeset status check on PRs |
| `base-branch` | string | false | `main` | Base branch for changeset comparison (e.g., "main") |
| `audit` | boolean | false | `true` | Whether to run pnpm audit |
| `audit-level` | string | false | `critical` | pnpm audit severity threshold (low/moderate/high/critical) |
| `sherif-command` | string | false | `""` | Sherif monorepo consistency check command (e.g., "pnpm sherif"). Empty = skip. |
| `knip-command` | string | false | `""` | Knip unused-code check command (e.g., "pnpm knip"). Empty = skip. |
| `madge-command` | string | false | `""` | Madge circular-dependency check command (e.g., "pnpm madge --circular ."). Empty = skip. |

```yaml
jobs:
  quality:
    uses: kethalia/workflows/.github/workflows/ci-quality.yml@<version>
```

### Reusable — GHCR retention prune

File: [`ghcr-prune.yml`](.github/workflows/ghcr-prune.yml). Deletes aged PR-tag versions from GHCR while preserving sha-, v*, latest, edge, and buildcache tags.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `org` | string | true | — | GitHub organization that owns the container packages. Lowercased automatically. |
| `packages` | string | true | — | Newline- or comma-separated list of container package names under the org (e.g. "chillpass\nchillpass-auth"). |
| `pr-tag-pattern` | string | false | `^pr-` | ERE matching tags considered "PR build" candidates for deletion. |
| `preserve-patterns` | string | false | `^sha-\|^v[0-9]\|^latest$\|^edge$\|^buildcache$` | ERE — if ANY tag on a version matches this, the version is kept regardless of age. Default protects sha-, v*, latest, edge, and buildcache. |
| `age-days` | number | false | `14` | Minimum age in days before a pr-* version is eligible for deletion. |
| `dry-run` | boolean | false | `false` | When true, log WOULD-DELETE decisions without calling DELETE. |

```yaml
jobs:
  prune:
    permissions:
      packages: write
    uses: kethalia/workflows/.github/workflows/ghcr-prune.yml@<version>
    with:
      org: chillwhales
      packages: |
        chillpass
        chillpass-auth
```

### CI — Helm Lint & Template

File: [`helm-lint.yml`](.github/workflows/helm-lint.yml). Runs `helm lint` (optionally `--strict`) and `helm template` against a matrix of charts.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `charts` | string | true | — | Newline-separated list of chart paths (relative to caller repo root) |
| `helm-version` | string | false | `v3.16.2` | Helm version to install via azure/setup-helm |
| `strict` | boolean | false | `true` | Pass --strict to helm lint |
| `runs-on` | string | false | `""` | Runner label for the lint matrix jobs. When empty, falls back to the tiered resolver (`vars.RUNNER_HEAVY` → default `self-hosted`). Pass a value to force a specific runner. |

```yaml
jobs:
  helm:
    uses: kethalia/workflows/.github/workflows/helm-lint.yml@<version>
    with:
      charts: |
        charts/api
        charts/web
```

### Publish — Docker image to GHCR

File: [`publish-docker-ghcr.yml`](.github/workflows/publish-docker-ghcr.yml). Builds and publishes a single image with semver + `:latest` tags. No-ops when `version` is empty so callers can wire it unconditionally.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `image-name` | string | true | — | Image name under ghcr.io/<owner>/ (e.g. "chillpass-api"). Lowercased automatically. |
| `version` | string | false | `""` | Semver version for the image (e.g. "1.4.0"). When empty, the workflow no-ops so callers can wire it unconditionally. |
| `context` | string | false | `.` | Docker build context path. |
| `dockerfile` | string | false | `Dockerfile` | Path to the Dockerfile, relative to the repo root. |
| `platforms` | string | false | `linux/amd64` | Comma-separated build platforms. |
| `build-args` | string | false | `""` | Newline-separated KEY=VALUE build args. |
| `push-latest` | boolean | false | `true` | Also tag and push :latest. |

```yaml
jobs:
  publish:
    permissions:
      contents: read
      packages: write
    uses: kethalia/workflows/.github/workflows/publish-docker-ghcr.yml@<version>
    with:
      image-name: chillpass-api
```

### Release — Changesets

File: [`release-changesets.yml`](.github/workflows/release-changesets.yml). Runs `changesets/action` to open Version PRs and (when `publish-command` is set) publish to npm.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `node-version` | number | false | `22` | Node.js version |
| `publish-command` | string | false | `""` | Command Changesets runs to publish (e.g. "pnpm release"). Leave empty to only open the Version PR. |
| `version-command` | string | false | `pnpm changeset version` | Command Changesets runs to bump versions and write changelogs. |
| `setup-command` | string | false | `""` | Optional command to run after install and before version/publish (e.g. build). |
| `pr-title` | string | false | `chore(release): version packages` | Title for the Version PR opened by Changesets. |
| `commit-message` | string | false | `chore(release): version packages` | Commit message used by Changesets when versioning. |

| Secret | Required | Description |
|---|---|---|
| `NPM_TOKEN` | required | npm auth token. Required when publish-command publishes to npm. |
| `GH_PAT` | required | PAT used by changesets/action to open the Version PR. Falls back to GITHUB_TOKEN. |

> Both secrets are declared with `required: false` upstream but should be supplied (`secrets: inherit` or explicit pass-through) — npm publish fails without `NPM_TOKEN`, and Version PRs against branch-protected `main` typically require `GH_PAT`.

```yaml
jobs:
  release:
    uses: kethalia/workflows/.github/workflows/release-changesets.yml@<version>
    secrets: inherit
```

### Release — Docker stack

File: [`release-docker-stack.yml`](.github/workflows/release-docker-stack.yml). Runs Changesets release, then for each published package whose name matches a key in `images`, builds and publishes the corresponding Docker image to GHCR.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `images` | string | true | — | JSON map: { "<published-package-name>": { "image": "<ghcr-image-name>", "context": "<docker-context>", "dockerfile": "<dockerfile-path>" } }. Keys must match `name` values in the changesets `publishedPackages` output; only intersecting entries are published. |
| `node-version` | number | false | `22` | Node.js version |

```yaml
jobs:
  release:
    permissions:
      contents: read
      packages: write
    uses: kethalia/workflows/.github/workflows/release-docker-stack.yml@<version>
    with:
      images: |
        {
          "@chillwhales/api": { "image": "chillpass-api", "context": "apps/api" }
        }
```

### Reusable — Resolve runner labels

File: [`resolve-runner.yml`](.github/workflows/resolve-runner.yml). Emits `heavy` and `light` runner labels resolved from repo/org `vars`, used by downstream callers to pick a runner tier. See [.github/docs/RUNNER-TIERING.md](.github/docs/RUNNER-TIERING.md).

(No inputs.)

```yaml
jobs:
  runners:
    uses: kethalia/workflows/.github/workflows/resolve-runner.yml@<version>
  build:
    needs: runners
    runs-on: ${{ needs.runners.outputs.heavy }}
    steps:
      - run: echo build
```

### Retag — Single GHCR image

File: [`retag-image.yml`](.github/workflows/retag-image.yml). Repoints destination tags at the manifest digest of an existing source tag — no rebuild, no new bytes pushed. Manifest digests are preserved across the retag.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `image` | string | true | — | Image name under ghcr.io/<owner>/ (e.g. "chillpass"). Lowercased automatically. Combined with the resolved owner to form the full reference ghcr.io/<owner>/<image>. |
| `source-tag` | string | true | — | Existing tag on the image to retag from (e.g. "sha-abc1234"). The image must already exist at ghcr.io/<owner>/<image>:<source-tag>; this workflow does NOT rebuild or push new content. Manifest digests are preserved across the retag (verifiable via crane). |
| `dest-tags` | string | true | — | Newline-separated list of destination tags to point at the same manifest digest as source-tag (e.g. "v1.2.3\nlatest"). Empty lines are skipped. |
| `registry` | string | false | `ghcr.io` | Container registry hostname. |
| `owner` | string | false | `""` | Registry namespace owner. Defaults to the repository owner of the calling workflow (lowercased). Override only if retagging into a different namespace. |

```yaml
jobs:
  retag:
    permissions:
      packages: write
    uses: kethalia/workflows/.github/workflows/retag-image.yml@<version>
    with:
      image: chillpass
      source-tag: sha-abc1234
      dest-tags: |
        v1.2.3
        latest
```

### Smoke — retag-image

File: [`internal-retag-smoke.yml`](.github/workflows/internal-retag-smoke.yml). Manual smoke test for `retag-image.yml` — exercises the retag flow end-to-end against a disposable GHCR image. Triggered via `workflow_dispatch` (Actions UI). This is **not** a reusable workflow and is not invoked via `uses:`.

The workflow file is published at `kethalia/workflows/.github/workflows/internal-retag-smoke.yml@<version>` for inspection but is not callable; trigger it from the Actions tab of this repo.

### Retag — Docker stack (promote on release)

File: [`retag-stack.yml`](.github/workflows/retag-stack.yml). On Changesets release, for each published package whose name matches a key in `images`, retags the existing `:sha-<short>` image to `:v<version>` and `:latest` (no rebuild).

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `images` | string | true | — | JSON map: { "<published-package-name>": { "image": "<ghcr-image-name>" } }. Keys must match `name` values in the changesets `publishedPackages` output; only intersecting entries are retagged. context/dockerfile are NOT consumed (no rebuild) — they may be present but are ignored. |
| `node-version` | number | false | `22` | Node.js version used for the changesets step. |
| `registry` | string | false | `ghcr.io` | Container registry hostname. |

```yaml
jobs:
  release:
    permissions:
      contents: read
      packages: write
    uses: kethalia/workflows/.github/workflows/retag-stack.yml@<version>
    with:
      images: |
        {
          "@chillwhales/api": { "image": "chillpass-api" }
        }
```

### Reusable — Verify GHCR tags

File: [`verify-ghcr-tags.yml`](.github/workflows/verify-ghcr-tags.yml). Asserts that an expected tag (sha-derived or explicit) exists on every named GHCR package.

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `org` | string | true | — | GitHub organization that owns the container packages. Lowercased automatically. |
| `packages` | string | true | — | JSON array of container package names under the org (e.g. '["chillpass", "chillpass-auth"]'). |
| `sha` | string | false | `""` | Full git sha to verify. The short form (first 7 chars) is checked as `:sha-<short>`. Defaults to the PR head sha on pull_request events. |
| `tag` | string | false | `""` | Explicit tag to verify (e.g., "v1.2.3"). Overrides `sha` when set. |
| `runner` | string | false | `ubuntu-latest` | Runner label (resolved by caller via resolve-runner.yml). |

```yaml
jobs:
  verify:
    uses: kethalia/workflows/.github/workflows/verify-ghcr-tags.yml@<version>
    with:
      org: chillwhales
      packages: '["chillpass", "chillpass-auth"]'
```
