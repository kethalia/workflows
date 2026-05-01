---
"@kethalia/workflows": patch
---

Add `ci-pr-changeset-required.yml` PR check that blocks pull requests touching `.github/workflows/**` or `.github/actions/**` without an accompanying changeset, so reusable-workflow edits cannot land without a release.
