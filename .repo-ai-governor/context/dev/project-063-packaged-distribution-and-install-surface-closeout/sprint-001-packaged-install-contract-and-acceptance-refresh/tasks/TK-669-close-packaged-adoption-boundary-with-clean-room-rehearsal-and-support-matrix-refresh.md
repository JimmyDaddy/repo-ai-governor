# TK-669 close packaged adoption boundary with clean-room rehearsal and support-matrix refresh

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-063-packaged-distribution-and-install-surface-closeout`
- Sprint: `sprint-001-packaged-install-contract-and-acceptance-refresh`

## 1. 任务目标

通过 clean-room rehearsal、support-matrix refresh 与 adopter doc 对齐，关闭 packaged adoption boundary 的收口窗口。

## 2. Depends On

1. `TK-667`
2. `TK-668`

## 3. 预期产物

1. clean-room rehearsal evidence
2. support-matrix refresh
3. `project-067` handoff input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-667-freeze-packaged-install-support-contract-and-acceptance-matrix.md`
2. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-668-implement-packaged-installer-runtime-layout-followup-or-explicit-online-only-boundary-hardening.md`
3. `.repo-ai-governor/context/dev/project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/project-052-adopter-truthfulness-and-ga-closeout-completion-audit-summary.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`

## 6. 实施计划

1. 刷新 clean-room packaged install evidence。
2. 对齐 support matrix 与 adopter-facing docs。
3. 把 host-native lifecycle lane 的输入移交给 `project-067`。

## 7. Development Verification

1. clean-room packaged install rehearsal
2. support narrative consistency review

## 8. Delivery Verification

1. `pnpm run build`
2. clean-room evidence and docs closeout review

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已重跑 `.tmp/project-063-sprint-001-cleanroom-tgz-report.json` 与 `.tmp/project-063-sprint-001-local-distribution-report.json`，并将 support matrix / maintainer playbook 的 packaged truth refresh 到当前机器证据窗口。
3. 2026-04-08：same-window `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1 --output .tmp/project-063-sprint-001-cleanroom-tgz-report.json` 与 `node ./scripts/release/verify-local-distribution.js --output .tmp/project-063-sprint-001-local-distribution-report.json` 已通过；`project-067` 的 next-stream input 现已冻结为“在 packaged install truth lane 之上继续 host plugin/skill/agent lifecycle 与 adopter consumption”，任务切换为 `completed`。

## 10. 产出

1. `.tmp/project-063-sprint-001-cleanroom-tgz-report.json`
2. `.tmp/project-063-sprint-001-local-distribution-report.json`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`
5. `docs/maintainer-validation-playbook.md`
6. `docs/maintainer-validation-playbook.zh-CN.md`
7. same-window verification: `pnpm run build`
8. same-window verification: `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
