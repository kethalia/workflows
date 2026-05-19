---
'@kethalia/workflows': minor
---

Add reusable `visual-tests.yml` workflow for Playwright-based visual regression suites. Runs the test command inside the official `mcr.microsoft.com/playwright` container with caller-controlled image tag, and exposes a peer `label-gate` job that fails closed when committed baseline screenshots change without the configured approval label on the PR. Wraps the prior per-repo workflow used in `kethalia/top-decor` so other consumers (e.g. `kethalia/house-of-slabs`) can adopt it via a thin caller.
