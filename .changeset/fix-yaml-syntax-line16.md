---
"@kethalia/workflows": patch
---

Fix YAML syntax error in `reusable-visual-tests.yml` `playwright-image` input description. The unquoted plain scalar contained `` `defaults.run.shell: bash` ``, whose embedded `: ` broke YAML parsing and triggered GitHub's "Invalid workflow file" phantom failure run on every push touching the file. Converted the description to a `|` block scalar to match neighboring inputs.
