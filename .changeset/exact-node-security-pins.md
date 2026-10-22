---
"@kethalia/workflows": patch
---

Allow exact Node.js security versions through a string `node-version-spec` input
in the build/lint/test and quality workflows. Preserve the existing numeric
`node-version` input for callers selecting a major version.
