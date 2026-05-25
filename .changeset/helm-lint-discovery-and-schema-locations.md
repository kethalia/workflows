---
"@kethalia/workflows": minor
---

`helm-lint.yml`: add two opt-in inputs.

- `chart-discovery-command`: optional bash command that prints newline-separated chart paths (or `Chart.yaml` paths, which are normalized to their parent directory). Use when the chart layout is dynamic (e.g. `find infrastructure -name Chart.yaml -not -path '*/charts/*'`). Either `charts` or `chart-discovery-command` must be provided; when both are set, `charts` wins.
- `kubeconform-schema-locations`: newline-separated list of `-schema-location` values passed to kubeconform when `validate-templates: true`. Defaults preserve the prior behavior (`default` + datreeio CRDs catalog). Override to point at internal CRD schema bundles.

The `charts` input is now optional but mutually-exclusive with discovery. Existing callers that pass `charts:` keep working unchanged.
