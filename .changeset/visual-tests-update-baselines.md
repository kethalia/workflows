---
'@kethalia/workflows': minor
---

`visual-tests.yml`: add `update-baselines` mode. When invoked with `update-baselines: true` (typically via `workflow_dispatch`), the reusable workflow runs the new `update-command` input (the test command with `--update-snapshots`) instead of `test-command`, then commits any regenerated files under `screenshots-path` back to the source branch using `GITHUB_TOKEN`. The peer `label-gate` job is skipped in this mode since the entire point of the run is to produce baseline changes. Closes the local-vs-CI baseline drift gap that forces consumers to ship antialiasing tolerance bands as a workaround.
