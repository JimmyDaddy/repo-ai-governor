# TK-115 project-011 启动与 CLI package decomposition 依赖重排

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-001-runtime-support-extraction-foundation`

## 1. 任务目标

创建独立的 `project-011-cli-package-decomposition`，将 CLI package 重构从 `project-010` 中拆出为单独执行流，并形成可复用的 baseline artifact 与依赖契约。

## 2. Depends On

1. `TK-114`
2. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`

## 3. 预期产物

1. `DA-113` CLI package decomposition 基线与依赖契约。
2. `project-011` 的 project/sprint/task 骨架文档。
3. `resolved_code_review_tk-115-project-011-bootstrap-and-cli-package-decomposition-rebaseline.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/projects-overview.md`
3. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`

## 5. 实施计划

1. 创建 `project-011` 目录、project plan、sprint plan、task/review 骨架。
2. 产出 `DA-113`，明确 project-011 的 phase contract 和与 `project-010` 的依赖关系。
3. 将 `current-context` primary stream 切换到 project-011，并保留 `project-010` 为 active parallel stream。
4. 同步 `master plan`、`projects-overview`、`project-010` 计划与 sprint-002 输入约束。
5. 回写台账与 resolved review。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，目标是将 CLI package decomposition 独立成新的 project 主线。
2. 2026-03-24：已完成 `project-011` 骨架、`DA-113`、context/master-plan/project-010 回链与台账同步，任务收尾为 `completed`。

## 8. 产出

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-113-cli-package-decomposition-baseline-and-dependency-contract.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/review/resolved_code_review_tk-115-project-011-bootstrap-and-cli-package-decomposition-rebaseline.md`
