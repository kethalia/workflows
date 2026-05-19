---
"@kethalia/workflows": patch
---

fix(visual-tests): declare `contents: write` unconditionally — `inputs` is not evaluated in `jobs.<id>.permissions`, so the previous `${{ inputs.update-baselines && 'write' || 'read' }}` expression failed parsing with "Unrecognized named-value: 'inputs'". Callers running in test-only mode should cap the effective token via their own job-level `permissions: contents: read` block.
