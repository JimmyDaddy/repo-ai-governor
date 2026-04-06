# DA-591 cleanroom and dist-binary install-mode evidence refresh

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Task: `TK-591`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. Summary

1. `path` and `link` both passed one fresh clean-room iteration of the documented `--help -> init -> doctor -> check` baseline.
2. The clean-room report also passed `tool_managed -> repo_local -> rollback`, read-only attach precheck, service-host memory provider smoke, and remote-api smoke for both install modes.
3. The local distribution rehearsal passed again for the current `dist-binary` and packaged surface, including standards runtime-loader dist smoke and dist-binary remote-api smoke.
4. The latest install-mode evidence is now reflected in `docs/support-matrix.*` and can serve as the verification baseline for the sprint-001 scoped CR round.

## 2. Evidence

1. Clean-room report: `.tmp/project-052-sprint-001-cleanroom-report.json`
2. Local distribution report: `.tmp/project-052-sprint-001-local-distribution-report.json`
3. Refreshed truth surface: [support-matrix.md](/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md)
4. Refreshed truth surface: [support-matrix.zh-CN.md](/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md)

## 3. Acceptance Notes

1. `path` remains the default install recommendation for clean `pnpm` target repositories because the clean-room chain still passes end to end.
2. `link` remains formally supported for source-following target repositories because the same clean-room chain and remote-api smoke also passed in this window.
3. `dist-binary` remains the preferred low-intrusion rehearsal path for dirty or non-`pnpm` target repositories because the distribution pack, runtime-loader dist surface, and dist-binary remote-api smoke all passed.
4. The `doctor/verify` adapter warnings inside the dist-binary remote-api smoke remain non-blocking environment-precondition signals rather than install-mode contract failures.

## 4. Follow-On Input

1. Use this evidence set as the sprint-001 reviewer baseline for install-mode truthfulness.
2. Carry the refreshed install-mode support boundary into `sprint-002` upgrade/workspace/rollback adopter UX wording.
