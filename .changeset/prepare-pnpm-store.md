---
"@kethalia/workflows": patch
---

Run the prepare job's frozen dependency install after restoring node_modules,
including cache hits. This initializes pnpm's store when its independent cache
misses, preventing setup-node's post-job cache save from failing on a missing path.
