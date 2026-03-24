# TK-136 project-013 启动与远端 provider 收口重排

- Status: completed
- Date: 2026-03-25
- Owner: AI-Agent
- Priority: P0
- Project: `project-013-remote-provider-and-adapter-ops`
- Sprint: `sprint-001-remote-provider-real-invocation-baseline`

## 1. 任务目标

创建独立的 `project-013-remote-provider-and-adapter-ops`，将 Stage 9 剩余阻断项收敛为“远端 provider 真实调用 + adapter 运维契约”独立执行流，并把已完成的 `project-010` 从 active stream 迁入 completed history。

## 2. Depends On

1. `TK-112`
2. `project-010-local-model-and-ide-expansion-completion-audit-summary.md`
3. `project-011-cli-package-decomposition-completion-audit-summary.md`
4. `project-012-execution-context-optimization-reclosure-audit-summary.md`

## 3. 预期产物

1. `DA-136` 远端 provider 真实调用与 adapter 运维契约基线。
2. `project-013` 的 project/sprint/task 骨架文档。
3. `resolved_code_review_tk-136-project-013-bootstrap-and-remote-provider-rebaseline.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/projects-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/project-010-local-model-and-ide-expansion-completion-audit-summary.md`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/project-011-cli-package-decomposition-completion-audit-summary.md`
8. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/project-012-execution-context-optimization-reclosure-audit-summary.md`

## 5. 实施计划

1. 将 `project-010 / sprint-003` 从 `current-context.md` 默认 active surface 迁入 `completed-streams-history.md`。
2. 创建 `project-013` 目录、project plan、sprint plan、task/review 骨架。
3. 产出 `DA-136`，固定远端 provider 真实调用与 adapter 运维契约的目标边界和依赖关系。
4. 同步 `master plan`、`projects-overview`、`dev/index` 与 `current-context`。
5. 回写 artifact registry 与台账，并将下一个执行任务切到 `TK-137`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
6. `pnpm run check`

## 7. 执行记录

1. 2026-03-25：任务创建并启动，目标是将 `project-010` 从默认 active surface 归档，并建立 `project-013` 作为新的 Stage 9 主执行流。
2. 2026-03-25：已完成 `project-010` completed stream 归档、`project-013` 骨架、`DA-136`、master plan/projects overview/dev index/current-context 同步与 resolved review；当前任务状态更新为 `completed`。
3. 2026-03-25：补充对齐 `DA-136` 的 canonical dependent task 推导关系，将 `TK-140` / `TK-141` 明确声明为依赖 `DA-136` 的任务，并通过 artifact lifecycle 与 reconcile gate 完成最终核验。

## 8. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/context/dev/projects-overview.md`
5. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
6. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/plan.md`
7. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/tasks/DA-136-remote-provider-execution-and-adapter-ops-baseline-and-dependency-contract.md`
8. `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/sprint-001-remote-provider-real-invocation-baseline/review/resolved_code_review_tk-136-project-013-bootstrap-and-remote-provider-rebaseline.md`
