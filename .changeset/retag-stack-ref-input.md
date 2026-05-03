---
"@kethalia/workflows": minor
---

retag-stack: add optional `ref` input to pin source SHA across reusable boundaries

`retag-stack.yml` previously derived its source `:sha-<short>` tag from `${GITHUB_SHA:0:7}` and checked out the repo at `github.sha`. When invoked from a `workflow_run`-triggered caller (e.g. `release.yml` gated on `Build images` completion), `github.sha` resolves to the default-branch HEAD at the moment the caller starts — not to the SHA the triggering build was for. If a new commit lands on `main` between the build finishing and the release job starting, retag would look for a `:sha-<short>` tag that the upstream build never pushed.

Adds an optional `ref` input to `retag-stack.yml` (and pass-through to the `setup-pnpm` composite action). When provided, both `actions/checkout` and the `source-sha-short` derivation use it; when omitted, behavior is unchanged.

Callers gated on `workflow_run` should now pass:

```yaml
uses: kethalia/workflows/.github/workflows/retag-stack.yml@v1
with:
  ref: ${{ github.event.workflow_run.head_sha }}
```

`retag-image.yml` is unchanged — it already takes `source-tag` directly and performs no checkout, so the caller is already in control.
