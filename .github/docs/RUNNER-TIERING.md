# Runner Tiering Proposal

**Status:** Proposal
**Scope:** All reusable workflows in `kethalia/workflows`

## Problem

Every workflow currently hardcodes `runs-on: ubuntu-latest`. To move CI to the
self-hosted `chillwhales-runners` pool we'd have to edit every workflow — and
to roll back during an outage we'd edit them again. The runner-pool decision
belongs to ops, not to workflow authors. The heavy-vs-light judgment belongs
to the workflow author, not to ops.

## Proposal

Two tiers, two org/repo vars, one resolver job per workflow.

### Tiers

- **heavy** — multi-minute jobs that justify a self-hosted slot: pnpm install,
  prisma generate, `next build`, full test suites, Docker buildx, multi-arch
  publishing.
- **light** — sub-minute jobs that should never tie up a self-hosted runner:
  jq/API calls, changeset checks, manifest validation, GHCR retention prune,
  Claude PR review (network-bound idle waits).

Two tiers only. No "medium" — see [Why not medium?](#why-not-medium).

### Vars

| Var             | Default (when unset) | Meaning                                                     |
| --------------- | -------------------- | ----------------------------------------------------------- |
| `RUNNER_HEAVY`  | `self-hosted`        | Pool for heavy jobs                                         |
| `RUNNER_LIGHT`  | `ubuntu-latest`      | Pool for light jobs                                         |
| `RUNNER_RESOLVER` | `ubuntu-latest`    | Pool for the resolver job itself (escape hatch for outages) |

Set at the org level for global default; override at repo level for opt-out.

### Resolver pattern

Every reusable workflow gets a `resolve-runner` job that downstream jobs
depend on:

```yaml
jobs:
  resolve-runner:
    runs-on: ${{ vars.RUNNER_RESOLVER || 'ubuntu-latest' }}
    outputs:
      heavy: ${{ steps.r.outputs.heavy }}
      light: ${{ steps.r.outputs.light }}
    steps:
      - id: r
        run: |
          echo "heavy=${{ vars.RUNNER_HEAVY || 'self-hosted' }}" >> "$GITHUB_OUTPUT"
          echo "light=${{ vars.RUNNER_LIGHT || 'ubuntu-latest' }}"      >> "$GITHUB_OUTPUT"

  build:
    needs: resolve-runner
    runs-on: ${{ needs.resolve-runner.outputs.heavy }}
    # ...

  audit:
    needs: resolve-runner
    runs-on: ${{ needs.resolve-runner.outputs.light }}
    # ...
```

The resolver defaults to `ubuntu-latest` so it can run when the self-hosted
pool is down — that's how "set `RUNNER_HEAVY=ubuntu-latest` during a self-hosted
outage" actually works. The inverse outage matters too: if GitHub-hosted minutes
are exhausted (paid-tier exceeded, billing block, GitHub-hosted incident), ops
flips `RUNNER_RESOLVER=chillwhales-runners` to keep the resolver — and therefore
every workflow — running on the self-hosted pool. Same lever, opposite
direction.

## Operational scenarios

| Goal                                  | `RUNNER_HEAVY`          | `RUNNER_LIGHT`         | `RUNNER_RESOLVER`      |
| ------------------------------------- | ----------------------- | ---------------------- | ---------------------- |
| Default (heavy on self-hosted)        | unset                   | unset                  | unset                  |
| Everything on self-hosted             | unset                   | `chillwhales-runners`  | unset                  |
| Self-hosted pool is down              | `ubuntu-latest`         | unset                  | unset                  |
| Everything on GitHub-hosted           | `ubuntu-latest`         | unset                  | unset                  |
| Drain a stuck self-hosted queue       | `ubuntu-latest`         | `ubuntu-latest`        | unset                  |
| One repo opts out of self-hosted      | repo var: `ubuntu-latest`| —                      | —                      |
| GitHub-hosted minutes exhausted       | unset                   | `chillwhales-runners`  | `chillwhales-runners`  |

No workflow file changes for any of these.

## Per-workflow classification

Caller workflows in consumer repos (e.g. `chillpass`) do not need the resolver —
they only call reusables and pass inputs. Classification applies to the
reusables in this repo.

| Workflow                      | Job                  | Tier   | Notes                                                |
| ----------------------------- | -------------------- | ------ | ---------------------------------------------------- |
| `ci-build-lint-test.yml`      | `install`            | heavy  | pnpm fetch + install                                 |
|                               | `format`             | heavy  | needs install cache; trivial without it              |
|                               | `lint`               | heavy  | same                                                 |
|                               | `build`              | heavy  | `next build` / package builds                        |
|                               | `typecheck`          | heavy  | tsc across workspace                                 |
|                               | `test`               | heavy  | vitest matrix                                        |
|                               | `coverage`           | heavy  | merges coverage reports                              |
| `ci-quality.yml`              | `pkg-verify`         | light  | jq/json checks                                       |
|                               | `changeset-check`    | light  | changesets CLI status only                           |
| `ci-changeset-check.yml`      | (single job)         | light  | same                                                 |
| `ci-publish-validation.yml`   | (single job)         | light  | manifest/sha verification                            |
| `publish-docker-ghcr.yml`     | (build/push)         | heavy  | buildx multi-platform                                |
| `release-docker-stack.yml`    | matrix publish       | heavy  | calls `publish-docker-ghcr.yml` per image            |
| `release-changesets.yml`      | (version/publish)    | light  | changesets/action — minutes idle, seconds working    |
| `ghcr-prune.yml`              | (prune)              | light  | GHCR API + jq                                        |

The `format`/`lint`/`typecheck` calls in `ci-build-lint-test.yml` could
plausibly be `light`, but every one of them re-runs `pnpm install` (no shared
workspace between jobs), so they spend most of their time doing heavy work.
Classifying them `heavy` keeps them on the same pool as `install` and lets
self-hosted runner cache (e.g. pnpm store, node_modules) actually pay off.

## Why not `RUNNER_MEDIUM`?

Two-tier is a binary judgment any author can make in two seconds: "does this
job justify a self-hosted slot, yes or no?" Three tiers force authors to
decide between three buckets, and "medium" drifts — one author's medium is
another's heavy.

Operational levers also collapse: "drain self-hosted" is one var flip in the
two-tier model; in three tiers it's two flips and a decision about where
medium goes in each scenario.

If a real workload cluster needs a different pool later (GPU, ARM,
large-disk), add a **named** tier (`RUNNER_GPU`, `RUNNER_ARM`) — never a
generic size tier. Named tiers stay meaningful; size tiers don't.

## Tradeoffs

- **+1 job per workflow.** ~3s each, defaults to `ubuntu-latest` (free). Worth
  it for the ops control.
- **`needs: resolve-runner` boilerplate** on every job. Minor noise, but
  enforced by review.
- **Resolver pool is its own var.** `RUNNER_RESOLVER` defaults to
  `ubuntu-latest` so a self-hosted outage doesn't strand the resolver. It's
  separate from `RUNNER_LIGHT` to avoid a deadlock from a misconfigured
  `RUNNER_LIGHT` during an outage, and it lets ops flip the resolver to
  self-hosted independently when GitHub-hosted minutes run out.
- **Self-hosted prerequisites.** Buildx + DinD support and GHCR egress must
  be confirmed on the runner pool before flipping any heavy workflow over.
  Buildx cache strategy may want to switch from `type=registry` to
  `type=local` once on self-hosted.

## Rollout

1. Land this PR with the resolver wired into all reusables, defaults unset
   (everything still runs on `ubuntu-latest` — zero behavior change).
2. Verify a heavy workflow end-to-end on `chillwhales-runners` by setting
   `RUNNER_HEAVY` at the *repo* level on one consumer repo (e.g. chillpass).
3. Confirm buildx + GHCR work on self-hosted; tune cache strategy.
4. Promote `RUNNER_HEAVY=chillwhales-runners` to org-level default once one
   repo has been green for a week.
5. Document the outage playbook: self-hosted down → set `RUNNER_HEAVY=ubuntu-latest`
   org-wide; GitHub-hosted minutes exhausted → set `RUNNER_LIGHT=chillwhales-runners`
   and `RUNNER_RESOLVER=chillwhales-runners` org-wide.

## Open questions

- Do any consumer repos currently override `runs-on` via the reusable's
  inputs? (None today — confirmed via grep, but worth re-checking before
  merge.)
- Should the resolver also expose `runner_meta` (labels, OS) for jobs that
  need to branch on platform? Defer until a real case appears.
