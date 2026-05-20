---
"@kethalia/workflows": patch
---

fix(visual-tests): rename `visual-tests.yml` to `reusable-visual-tests.yml` to clear stuck workflow registration

The original `visual-tests.yml` file was first registered with a broken parse during the initial commit, leaving its registered `name` stuck at the file path (`.github/workflows/visual-tests.yml`) instead of the declared workflow name. GitHub never refreshes the registered name on subsequent commits, so every push that touches the file emits a phantom `push`-event startup-failure run with zero jobs. Renaming the file forces GitHub to create a fresh workflow registration row, clearing the noise.

The `update-snapshots.yml` reusable's `target-workflow` input default is updated to match (`reusable-visual-tests.yml`); callers that override this input are unaffected. Callers that pin a tag (e.g. `@v1.5.1`) are unaffected — the rename only changes the file path going forward. Callers consuming `@main` of this workflow must update their `uses:` path:

```diff
- uses: kethalia/workflows/.github/workflows/visual-tests.yml@main
+ uses: kethalia/workflows/.github/workflows/reusable-visual-tests.yml@main
```
