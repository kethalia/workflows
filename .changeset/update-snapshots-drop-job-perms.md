---
"@kethalia/workflows": minor
---

**Breaking-ish:** `update-snapshots.yml` no longer declares a job-level
`permissions:` block. A reusable workflow's job permissions can only *cap*
the caller's grants, never elevate them — declaring them here masked the
real contract and gave consumers a false sense of security when their
caller omitted the grants. The caller must now declare the following
permissions at workflow-level or on the calling job:

```yaml
permissions:
  pull-requests: write   # PR-context comment reactions + dispatch follow-up
  actions: write         # gh workflow run (dispatch the target workflow)
  contents: read         # actions/github-script + gh CLI base scope
```

Also fixes the documented `issues: write` scope, which was wrong: PR-context
`issue_comment` API calls (reactions, comments) route through the
`pull-requests` scope despite the URL shape. Consumers using v1.4.0 with
`issues: write` instead of `pull-requests: write` will 403 on the
"React to comment" and "Comment with dispatch confirmation" steps.

Consumers should update their caller's `permissions:` block (workflow- or
job-level) in lockstep with the version bump.
