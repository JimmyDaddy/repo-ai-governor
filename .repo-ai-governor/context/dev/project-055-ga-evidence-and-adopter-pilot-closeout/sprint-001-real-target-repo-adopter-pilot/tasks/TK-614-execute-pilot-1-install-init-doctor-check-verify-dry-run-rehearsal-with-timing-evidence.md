# TK-614 execute pilot-1 install init doctor check verify dry-run rehearsal with timing evidence

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-614`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`

## 1. 任务目标

在 `/Users/jimmydaddy/study/playground` 上执行 pilot-1 install/init/doctor/check/verify/dry-run rehearsal，并记录 timing evidence。

## 2. Depends On

1. `TK-613`
2. `DA-613`

## 3. 预期产物

1. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
2. pilot-1 rehearsal
3. timing evidence
4. adopter-path findings

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-613-freeze-adopter-pilot-repository-selection-and-acceptance-rubric.md`
4. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
5. `docs/local-adoption-playbook.md`
6. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
3. `.tmp/project-046-p1-ga-onboarding-timing.json`

## 6. 实施计划

1. 在 `TK-613` 冻结的 rubric 下使用 `/Users/jimmydaddy/study/playground` 作为唯一 pilot-1 仓库。
2. 顺序执行 `pnpm install -> init -> doctor -> check -> verify --adapters -> run --dry-run --trace`，并记录 timing evidence。
3. 汇总 adopter-path findings 与交付证据。

## 7. Development Verification

1. `cd /Users/jimmydaddy/study/playground && pnpm install`
2. `cd /Users/jimmydaddy/study/playground && pnpm exec repo-ai-governor init --output json`
3. `cd /Users/jimmydaddy/study/playground && pnpm exec repo-ai-governor doctor --output json`
4. `cd /Users/jimmydaddy/study/playground && pnpm exec repo-ai-governor check --output json`
5. `cd /Users/jimmydaddy/study/playground && pnpm exec repo-ai-governor verify --adapters --output json`
6. `cd /Users/jimmydaddy/study/playground && pnpm exec repo-ai-governor run --dry-run --trace --output json`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-613` 完成。
2. 2026-04-07：`TK-613 / DA-613` 已冻结 pilot-1 仓库与 acceptance rubric，当前任务切换为 `in_progress`。
3. 2026-04-07：已在 `/Users/jimmydaddy/study/playground` 完成 `install -> init -> doctor -> check -> verify --adapters -> run --dry-run --trace` 全链路 rehearsal，6 条命令全部成功，总耗时 `50473ms`。
4. 2026-04-07：`verify --adapters` 维持 `adapters_status=warn`，但 `required_role_failures=0`；唯一降级是 `reviewer` 从 `claude-code` 回退到 `codex`，因此仍满足 adopter acceptance rubric。
5. 2026-04-07：`run --dry-run --trace` 产出 `execution_id=cli-run-1775534994155`，`runtime_status=succeeded`，并保留 trace / replay / diagnostics 证据。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-614-pilot-1-rehearsal-timing-and-adopter-path-evidence.md`
2. `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
3. `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/diagnostics/verify/verify-1775534979004.json`
4. `/Users/jimmydaddy/.repo-ai-governor/workspaces/63cc611d2937/.repo-ai-governor/context/diagnostics/trace/cli-run-1775534994155.trace.json`
