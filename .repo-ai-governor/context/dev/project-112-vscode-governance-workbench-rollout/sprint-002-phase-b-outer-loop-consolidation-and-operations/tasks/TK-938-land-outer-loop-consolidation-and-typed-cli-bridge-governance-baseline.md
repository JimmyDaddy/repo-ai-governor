# TK-938 land outer-loop consolidation and typed cli bridge governance baseline

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-002-phase-b-outer-loop-consolidation-and-operations`

## 1. 任务目标

完成 automation queue、artifact workbench、multi-workspace overview 与 typed CLI bridge governance baseline

## 2. Depends On

1. DA-934

## 3. 预期产物

1. workbench operations baseline artifact for TK-938
2. task card update for TK-938
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-111-vscode-workbench-solution-promotion-and-decomposition/sprint-001-promotion-and-rollout-handoff/tasks/DA-934-vscode-workbench-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/context/current-context.md
3. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。
4. 作为 `CS-027` 临时例外，Phase B 允许 `vscode-extension-presentation-builder` 暂时继续承载 queue/workbench/bridge shaping；在 `sprint-003 / TK-940` 中拆出 focused builders 后移除例外标记。

## 7. Development Verification

1. 2026-04-17：`pnpm run build`
2. 2026-04-17：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
3. 2026-04-17：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`
4. 2026-04-17：`pnpm run build`
5. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/tasks" --task-id TK-938
6. 2026-04-17：`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts packages/config/test/workspace-config-discovery-service.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`
7. 2026-04-17：`pnpm run build`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/tasks" --task-id TK-938
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/tasks" --task-id TK-938
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 sprint-001 在 latest fresh reviewer clean round `CR-003` 后完成 closeout，当前任务已切换为 `in_progress`，开始承接 automation queue、artifact workbench、multi-workspace overview 与 typed CLI bridge governance 的 Phase B 实施。
3. 2026-04-17：已完成 service-owned temporary bridge typed contract、queue overview projection、VS Code automation queue view、artifact workbench detail 扩展，以及 multi-workspace / parallel lane / temporary bridge overview nodes 的实现。
4. 2026-04-17：已取得同窗口 `pnpm run build` 与 5 个定向 vitest 文件 + 1 个 core orchestration shell unit test 的通过证据，当前进入 sprint-002 fresh reviewer round 前的治理台账同步窗口。
5. 2026-04-17：fresh reviewer round 4 识别出 `tool_managed` 下 temporary bridge repo-root 仍在本地猜测，以及 upgrade bridge 仍投影占位 report path；当前已把 `repositoryRoot` 升级为 runtime 显式契约、让 upgrade bridge 只投影真实 report，并再次取得同窗口定向 vitest + `pnpm run build` 通过证据，下一步进入 fresh clean recheck round 5。
6. 2026-04-17：fresh reviewer round 5 进一步识别出 temporary bridge preview command 尚未对含空格路径做 shell-safe 渲染，以及 `serviceOwnerProvider` 仍绕过 `repositoryRoot` contract；当前已补齐 shell-safe argv staging 与 provider owner context 契约，并再次取得同窗口定向 vitest + CLI runtime tests + `pnpm run build` 通过证据，下一步进入 fresh clean recheck round 6。
7. 2026-04-17：fresh reviewer round 6 识别出 VS Code extension runtime 仍把打开的 repo root 当成 sidecar workspace；当前已让 extension runtime 先解析默认 `tool_managed/repo_local` governance workspace，再把 `governanceWorkspaceRoot + repositoryRoot` 一起传给 sidecar，并补齐 tool-managed regression test，下一步进入 fresh clean recheck round 7。
8. 2026-04-17：fresh reviewer round 7 进一步识别出 custom `repoLocalRoot` 且缺少默认 shadow config 的仓库仍会让 VS Code sidecar 回退到错误 workspace；当前已在 shared config 层补齐 workspace config discovery，并新增 custom repo-local root regression test，再次取得 full vitest bundle + `pnpm run build` 通过证据，下一步进入 fresh clean recheck round 8。
9. 2026-04-17：fresh reviewer round 8 识别出 round-7 的递归 discovery 仍可能被无关 nested custom `governor.yaml` hijack；当前已把 auto-discovery 收紧为“具备 canonical workspace marker 的唯一 candidate 才能被认领，否则 fail closed”，并补齐防 hijack regression test，再次取得 full vitest bundle + `pnpm run build` 通过证据，下一步进入 fresh clean recheck round 9。
10. 2026-04-17：fresh reviewer round 9 识别出 queue-only handoff fallback、repo-opened discovery cache 与 `CS-027` exception 记录仍未闭环；当前已让 handoff command 优先消费 queue-provided targets、为 workspace context 加入 per-opened-workspace cache，并在 task ledger 中登记 `presentation-builder` 的临时分解计划，下一步进入 fresh clean recheck round 10。
11. 2026-04-17：fresh reviewer round 10 识别出 `CR-010` 初始化后未立即同步进 canonical ledgers，以及 runtime-level workspace context cache 会在同会话 config 变更后变陈旧；当前已补齐 round-10 ledger sync，并把缓存边界下沉到 shared discovery candidate path 级别，同时新增 config change 与 cached-candidate regression tests，下一步进入 fresh clean recheck round 11。
12. 2026-04-17：fresh reviewer round 11 识别出 custom repo-local temporary bridge 仍会被重写到伪造的 nested governance root，以及缺失 `repositoryRoot` 时 bridge cwd/`--repo` 仍会被本地猜测；当前已把 `workspaceRoot` 固定为 bridge governance truth、对缺失 `repositoryRoot` 的 bridge projection fail closed，并补齐 desktop `repositoryRoot` owner-context/sidecar 透传与回归测试，下一步进入 fresh clean recheck round 12。
13. 2026-04-17：fresh reviewer round 12 返回 `NO_ACTIONABLE_FINDINGS`；当前任务已在同窗口 full vitest bundle + `pnpm run build` 通过证据上完成 clean 收口，正式推进为 `completed`，并切换到 `TK-939` 承接 sprint-002 closeout。

## 10. 产出

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-002-phase-b-outer-loop-consolidation-and-operations/tasks/DA-938-phase-b-outer-loop-workbench-baseline-summary.md
2. `apps/vscode-extension/**` 的 Phase B outer-loop workbench baseline code/test 更新
3. `packages/core-orchestration-service/**` 与 `packages/orchestration-service-client/**` 的 temporary bridge governance contract/projection 更新
