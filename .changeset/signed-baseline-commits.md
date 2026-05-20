---
"@kethalia/workflows": patch
---

Sign baseline-refresh commits in `reusable-visual-tests.yml` via the GitHub Git Data API. The `update-baselines` mode previously created the refresh commit with `git commit` + `git push` from the runner, producing unsigned commits that fail branch-protection rules requiring signed commits (and blocking PR merges via the "verified" badge). The commit is now created with `createBlob` → `createTree` → `createCommit` → `updateRef` using the workflow's `GITHUB_TOKEN`, which GitHub signs with its web-flow key and attributes to `github-actions[bot]`. No caller changes required; the `git-user-name` / `git-user-email` inputs are now deprecated (accepted-but-ignored) since the author is fixed by web-flow signing.
