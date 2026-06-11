---
"@kethalia/workflows": major
---

Remove the shared runner resolver and all caller-controlled runner label inputs. Every reusable workflow job now runs directly on GitHub-hosted `ubuntu-latest`; callers no longer need org/repo runner variables or self-managed runner pools.
