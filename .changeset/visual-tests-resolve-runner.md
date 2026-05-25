---
"@kethalia/workflows": minor
---

`reusable-visual-tests.yml` and `update-snapshots.yml` now resolve their runner labels via `resolve-runner.yml@v2.0.0` instead of hardcoding `runs-on: ubuntu-latest`. This brings both workflows in line with `ci-build-lint-test.yml` and `ci-quality.yml`, so a caller repo (or its org) can opt the Playwright suite onto the self-hosted heavy tier via `vars.RUNNER_HEAVY` (and the `/update-snapshots` dispatcher onto `vars.RUNNER_LIGHT`) without forking the reusables.

Behavior is governed by `resolve-runner` precedence:
- `reusable-visual-tests.yml` visual-tests job → `vars.RUNNER_HEAVY` → `self-hosted`
- `update-snapshots.yml` dispatch job → `vars.RUNNER_LIGHT` → `ubuntu-latest`

Existing callers under the kethalia/chillwhales/phlox-labs orgs (where `vars.RUNNER_HEAVY` and `vars.RUNNER_LIGHT` are already pinned to `ubuntu-latest`) see no change. Standalone consumers that previously inherited the hardcoded `ubuntu-latest` and have no `RUNNER_HEAVY` set will fall back to `self-hosted` for the visual suite — pin `vars.RUNNER_HEAVY=ubuntu-latest` on the caller repo to preserve prior behavior. The dispatcher's default (`ubuntu-latest`) is unchanged.

Self-hosted runners that consume the visual workflow must have Docker available and be able to pull the configured Playwright image, since the suite still runs inside `container:`.
