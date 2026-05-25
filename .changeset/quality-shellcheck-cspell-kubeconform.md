---
"@kethalia/workflows": minor
---

feat(ci-quality): add opt-in `shellcheck-command` and `cspell-command` inputs

feat(helm-lint): add `validate-templates` input that runs kubeconform against
helm-rendered manifests. Configurable via `kubernetes-version` and
`kubeconform-version`. Defaults to off — non-breaking.

feat(kubeconform): new `kubeconform.yml` reusable for validating raw
Kubernetes manifests outside helm charts. Takes `install-command` (optional)
and `lint-command` (required). Routes through `resolve-runner` heavy tier.

All new jobs are additive opt-ins; existing callers are unaffected.
