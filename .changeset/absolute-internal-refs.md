---
"@kethalia/workflows": patch
---

Replace relative `uses: ./.github/workflows/*.yml` references inside reusable workflows with absolute `kethalia/workflows/.github/workflows/*.yml@<tag>` references.

Annotated tags (e.g. `v1.0.0`) trigger a GitHub Actions resolver bug on `push` and `schedule` events: the resolver records the tag-object SHA and then cannot walk relative paths against it, causing nested reusable lookups to fail with "workflow was not found" and the workflow to load with 0 jobs. Absolute references skip the relative-lookup code path entirely and resolve correctly under all event types. The `version` script (`scripts/sync-workflow-refs.mjs`) keeps these refs pinned to the current package version on every release.
