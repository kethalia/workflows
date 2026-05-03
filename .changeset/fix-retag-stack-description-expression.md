---
"@kethalia/workflows": patch
---

fix(retag-stack): remove unevaluated `${{ github... }}` expression from `ref` input description

GitHub's expression parser evaluates `${{ ... }}` tokens even inside `description:` text. The example in the `ref` input description referenced `github.event.workflow_run.head_sha`, which isn't available in the inputs declaration context, causing the entire workflow file to fail validation. The example is now described in prose.
