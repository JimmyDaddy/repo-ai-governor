# DA-616 ga evidence dossier and cross-surface backlinks

- Status: completed
- Date: 2026-04-07
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`
- Sprint: `sprint-002-ga-evidence-consolidation-and-closeout`
- Task: `TK-616`

## 1. Summary

1. `project-055` now has one dossier that ties the real-target pilot evidence to the public support matrix, the maintainer validation playbook, and the program-level GA readiness matrix.
2. `playground` pilot-1 proves the supported `link` onboarding path through `pnpm install -> init -> doctor -> check -> verify --adapters -> run --dry-run --trace`; the full rehearsal finished in `50473ms` and preserved zero required-role failures.
3. `react-native-image-marker-1.1.x` pilot-2 proves the supported `dist-binary` plus `upgrade/workspace` closeout path on a recovered `1.1.x` baseline rerun; the full rerun finished in `5326ms`, preserved `git status`, switched to `repo_local` during execute, and returned to `tool_managed` on rollback.

## 2. Cross-surface alignment

1. `docs/support-matrix*.md`
   - added the two `project-055` pilot rows to the verification snapshot
   - added a dedicated `real adopter pilot dossier` truth row in the GA support truthfulness table
   - replaced the stale `project-052` prepared-closeout note with the current `project-055` prepared closeout packet
2. `docs/ga-readiness-evidence*.md`
   - refreshed signal `#1` with the real-target pilot timing evidence
   - refreshed signal `#6` with the real-target `tool_managed -> repo_local -> rollback` proof
   - updated the evidence date and follow-up guidance to point at the current pilot summaries
3. `docs/maintainer-validation-playbook*.md`
   - added the `project-055` pilot summaries and this dossier to the expected backlink set
   - kept the playbook as a runbook/backlink router rather than a second status table

## 3. Evidence dossier

1. Pilot-1: `playground`
   - install mode: `link`
   - command chain: `pnpm install -> init -> doctor -> check -> verify --adapters -> run --dry-run --trace`
   - total duration: `50473ms`
   - key facts:
     - `verify --adapters` ended with `required_role_failures=0`
     - the only degrade/fallback remained a non-blocking reviewer-route fallback from `claude-code` to `codex`
     - `run --dry-run --trace` succeeded and preserved trace/replay diagnostics
2. Pilot-2: `react-native-image-marker-1.1.x`
   - entry mode: `dist-binary`
   - onboarding subchain: `init -> doctor -> check` in `1711ms`
   - controlled acceptance rerun: `upgrade preview/apply/rollback` plus `workspace dry-run/execute/rollback`
   - total duration: `5326ms`
   - key facts:
     - `gitStatusPreserved=true`
     - `repoLocalWorkspaceExistsAfterExecute=true`
     - `repoLocalWorkspaceExistsAfterRollback=false`
     - `migrationScratchCleanupStatus=removed`
3. Public and maintainer truth surfaces
   - public support truth remains on `docs/support-matrix*.md`
   - program-level GA signal closure remains on `docs/ga-readiness-evidence*.md`
   - maintainer command ordering and backlink routing remain on `docs/maintainer-validation-playbook*.md`

## 4. Caveats and non-blockers

1. The complex pilot success claim is intentionally limited to the recovered `1.1.x` baseline rerun. The original frozen working copy was interrupted by an operator misconfiguration that pointed `--workspace-root` at the repository root and removed the original path.
2. External-adopter baseline warnings (`baseline_docs missing=5/5`, `script_not_found`) remain non-blocking signals in these pilots; they do not invalidate the supported public contract.
3. The complex pilot still requires evidence lookup across `.tmp/` and the tool-managed workspace for some rollback artifacts. That remains a documented troubleshooting caveat rather than a blocker.

## 5. Output paths

1. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
2. `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`
5. `docs/ga-readiness-evidence.md`
6. `docs/ga-readiness-evidence.zh-CN.md`
7. `docs/maintainer-validation-playbook.md`
8. `docs/maintainer-validation-playbook.zh-CN.md`
