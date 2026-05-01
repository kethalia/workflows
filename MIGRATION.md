# Migration TODO

Repos that still reference `chillwhales/.github`. Per-repo migration to `kethalia/workflows` is deferred and tracked by R021.

Sourced from `gh search code 'chillwhales/.github' --owner <org> --limit 100` across the three orgs on 2026-05-01. The source repo (`chillwhales/.github`) and destination (`kethalia/workflows`) are excluded. Entries with workflow/action `uses:` references are listed under their org section. Hits inside `.gsd/`, `Projects/`, or other documentation are listed under **Documentation references** as informational — no migration action required for those, but they may want a follow-up edit when the source repo is decommissioned.

Private or otherwise inaccessible repos do not appear in `gh search code` results — manual triage may be needed once `chillwhales/.github` is archived.

## chillwhales

- [ ] chillwhales/chillpass — workflow refs in `.github/workflows/{ci,release,ghcr-prune,smoke-build-and-push,build-images}.yml`
- [ ] chillwhales/lsp-indexer — workflow ref in `.github/workflows/ci.yml`

## kethalia

- [ ] kethalia/github-runners — workflow ref in `.github/workflows/runner-image.yml`

## phlox-labs

No matches found via `gh search code` for workflow/action references (may need manual check for private repos).

## Documentation references

These hits are inside docs, planning artifacts, or `.gsd/` notes — no `uses:` line to rewrite, but worth a sweep when the source repo is archived.

- chillwhales/chillpass — `.gsd/PROJECT.md`, `.gsd/REQUIREMENTS.md`, `.gsd/DECISIONS.md`
- chillwhales/lsp-indexer — `.gsd/milestones/M001/...` planning/summary/research files
- kethalia/second-brain — `Projects/ChillWhales Org Automation.md`, `Skills/devops-infra/references/ci-cd-patterns.md`
- phlox-labs/.github — `.gsd/DECISIONS.md`, `.gsd/REQUIREMENTS.md`, `.gsd/milestones/M001/...`, `.gsd/state-manifest.json`
