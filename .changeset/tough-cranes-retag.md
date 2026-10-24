---
"@kethalia/workflows": patch
---

Pin and verify the `crane` installer used by `retag-image.yml` so retag jobs no longer depend on an unchecked live `latest-release` API lookup. The workflow now refuses non-GHCR registries before using `GITHUB_TOKEN`.
