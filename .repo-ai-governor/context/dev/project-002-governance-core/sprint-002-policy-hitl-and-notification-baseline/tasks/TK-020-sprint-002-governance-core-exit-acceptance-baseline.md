# TK-020 sprint-002 出口验收与回滚基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-002-policy-hitl-and-notification-baseline`

## 1. 任务目标

完成 project-002 统一验收并沉淀 project-003 输入约束清单。

## 2. Depends On

1. `TK-017`
2. `TK-018`
3. `TK-019`
4. `DA-027`
5. `DA-028`
6. `DA-029`

## 3. 预期产物

1. `DA-030` project-002 exit acceptance baseline 文档。
2. `DA-031` project-003 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-017-change-risk-evaluator-baseline.md` (`DA-027`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-018-policy-gate-engine-baseline.md` (`DA-028`)
3. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-019-hitl-feedback-and-notification-baseline.md` (`DA-029`)
4. `.repo-ai-governor/context/dev/project-003-standards-and-slots/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`、`§7.1`~`§7.5`、`§9.3`）
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§3`、`§4`、`§6`）
7. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4` 核心能力基线）

## 5. 实施摘要

1. 完成 sprint-002 出口验收矩阵，确认三条出口标准均具备可回链证据：
   - Risk Evaluator 能稳定输出结构化风险事实并驱动 `allow/confirm/block/escalate`。
   - Policy Gate + HITL 回灌字段（`decision/reason/constraints`）可写回审计链路。
   - Notification Dispatcher 已具备主通道重试、fallback 与升级通道兜底能力。
2. 新增 `DA-031`（project-003 输入约束清单），固化 Stage 4 启动前的输入资产、风险分级与门禁命令。
3. 同步依赖产物注册与检索入口：
   - 新增 `DA-030`、`DA-031` 到主 artifact registry。
   - 同步 `dependency-artifact-registry.md` 与 `context/dev/index.md`。
4. 执行依赖回链清理：
   - 运行 `reconcile-artifact-dependencies` 移除已关闭任务的过时 `dependent_tasks` 引用，保持链路可消费。

## 6. 产出

1. `DA-030` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-020-sprint-002-governance-core-exit-acceptance-baseline.md`
2. `DA-031` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/tasks/TK-020-project-003-input-constraints-checklist.md`
3. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
5. `.repo-ai-governor/context/dev/index.md`
6. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-002-policy-hitl-and-notification-baseline/code-review/verified_review_tk-020-sprint-002-exit-acceptance-baseline.md`

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始汇总 sprint-002 出口验收证据并生成 project-003 输入约束清单。
2. 2026-03-20：完成 `DA-031` 输入约束清单并同步 artifact registry / index 入口。
3. 2026-03-20：完成验收基线收敛，状态切换为 `completed`；验证通过 `node ./scripts/governance/reconcile-artifact-dependencies.js` 与 `pnpm run check`。
