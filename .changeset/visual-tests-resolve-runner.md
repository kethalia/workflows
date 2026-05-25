---
"@kethalia/workflows": major
---

`reusable-visual-tests.yml` and `update-snapshots.yml` now resolve their runner labels via `resolve-runner.yml@v2.0.0` instead of hardcoding `runs-on: ubuntu-latest`. This brings both workflows in line with `ci-build-lint-test.yml` and `ci-quality.yml`, so a caller repo (or its org) can opt the Playwright suite onto the self-hosted heavy tier via `vars.RUNNER_HEAVY` without forking the reusables.

**Breaking change.** Both workflows now default to the heavy tier:

- `reusable-visual-tests.yml` visual-tests job → `vars.RUNNER_HEAVY` → `self-hosted`
- `update-snapshots.yml` dispatch job → `vars.RUNNER_HEAVY` → `self-hosted`

Existing callers under the kethalia/chillwhales/phlox-labs orgs (where `vars.RUNNER_HEAVY` is already pinned to `ubuntu-latest`) see no change. Standalone consumers that previously inherited the hardcoded `ubuntu-latest` and have no `RUNNER_HEAVY` set will fall back to `self-hosted` for both jobs — pin `vars.RUNNER_HEAVY=ubuntu-latest` on the caller repo (or org) to preserve prior behavior.

Self-hosted runners that consume the visual workflow must have Docker available and be able to pull the configured Playwright image, since the suite still runs inside `container:`.
