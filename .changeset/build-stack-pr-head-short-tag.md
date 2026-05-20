---
"@kethalia/workflows": patch
---

Add additive `pr-<num>-<head_short_sha_8>` tag to `build-stack.yml` so ArgoCD's PullRequest-generated ApplicationSets can resolve per-PR images. The existing `pr-<num>-<github.sha>` tag (which on `pull_request` events is the synthetic merge-commit SHA, not the PR head SHA) is unchanged and continues to be published — the new tag is additive and non-breaking. ArgoCD's PullRequest generator exposes only `head_sha` / `head_short_sha`; without an 8-char head-sha tag, every preview Application ImagePullBackOff'd because the merge ref and head ref never match. GHCR retention prunes both tags together since they share the `pr-` prefix; no extra cleanup configuration required.
