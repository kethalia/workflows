---
"@kethalia/workflows": patch
---

fix(visual-tests): force bash for inline run steps inside the Playwright container

The reusable `visual-tests` job runs inside `mcr.microsoft.com/playwright`, where the default shell GitHub Actions selects is `sh` (dash). The "Guard refresh-mode ref is a branch" and "Commit and push" steps both begin with `set -euo pipefail`, which dash rejects (`set: Illegal option -o pipefail`), causing the refresh job to crash on its first real step.

Set `defaults.run.shell: bash` on the `visual-tests` job so every inline `run:` step uses bash. The playwright-jammy image ships bash. The `label-gate` job already runs on `ubuntu-latest` (no container) and is unaffected.
