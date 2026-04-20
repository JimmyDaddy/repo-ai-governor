# TK-936 freeze vscode primary workbench baseline and service-owned task-review seams

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-001-phase-a-primary-workbench-baseline`

## 1. 任务目标

冻结 VS Code primary workbench baseline、task/review queue seam 与 service-owned projection contract

## 2. Depends On

1. DA-934

## 3. 预期产物

1. runtime contract baseline artifact for TK-936
2. task card update for TK-936
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/current-context.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-001-phase-a-primary-workbench-baseline/tasks" --task-id TK-936
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 `project-110` 完成 final closeout，当前任务已切换为 `in_progress`，开始承接 VS Code primary workbench baseline、task/review queue seam 与 service-owned projection contract 的 Phase A 实施。
3. 2026-04-17：已把 VS Code extension contract 从 companion-era freeze 扩到 Phase A primary workbench baseline；当前 surface metadata、task board/review queue/workbench overview contribution、service-owned queue overview seam 与 review-source fallback 已落到 `apps/vscode-extension/**`，且未引入任何 `.repo-ai-governor/**` 直读 shadow truth。
4. 2026-04-17：已完成 `pnpm run build` 与 4 个 VS Code extension 定向 vitest，用于验证 contract freeze、service runtime、presentation builder 与 controller/review-detail 兼容性；当前任务实现窗口已满足进入 fresh reviewer CR round 的前置条件，任务状态切换为 `completed`。
5. 2026-04-17：已修复 round-1 reviewer 提出的 capability metadata contract drift 与 review-queue fallback coverage gap；当前 frozen capability taxonomy 已对齐 formal contract，controller/provider/runtime 已补齐 review queue selection 与 review-source-only fallback 回归测试，同窗口 `pnpm run build` 与扩展后的 4 个 VS Code extension 定向 vitest 已重跑通过，当前等待 fresh reviewer clean recheck。
6. 2026-04-17：round-2 reviewer 继续发现 review-only queue item 会错误回退到最新 execution detail；当前已修复 service runtime 对显式 cleared `executionId` 的错误 fallback，并让 execution/HITL re-anchor 路径显式清空 stale `reviewSourcePath`，同时补齐 runtime 与 controller/provider 回归测试；同窗口 `pnpm run build`、4 个 VS Code extension 定向 vitest 与 review/task-ledger lifecycle gates 已重跑通过，当前等待下一轮 fresh reviewer clean recheck。

## 10. 产出

1. `apps/vscode-extension` 已新增 Phase A primary workbench baseline surface metadata，并把 task board、review queue、workbench overview 接到 shared local orchestration service 的 `execution board + queue overview + review detail` seam。
2. VS Code extension 的 contract/presenter/tests 已补齐 Phase A baseline coverage，同时保留对旧 `execution board / workspace context` presenter entrypoint 的兼容别名，便于 scoped CR loop 在不引入额外 surface drift 的前提下进入 reviewer round。
