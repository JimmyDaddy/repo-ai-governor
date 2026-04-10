# TK-729 add per-tool transport selection flags to connect

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-002-connect-selection-ux-and-candidate-materialization`

## 1. 任务目标

为 `connect` 建立 per-tool transport selection authoring surface，使用户可显式声明每个 tool 的 transport。

## 2. Depends On

1. `TK-728`
2. `apps/cli/src/commands/connect*`

## 3. 预期产物

1. connect transport flags
2. argument parsing / validation
3. UX help text update

## 4. Required Inputs

1. `apps/cli/src/commands`
2. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `TK-726`
2. `TK-727`
3. `TK-728`

## 6. 实施计划

1. 设计 `--tool-transport <tool>=<transport>` 类 authoring surface。
2. 将 UX fail-fast 约束到 unsupported transport 组合。
3. 保持 analyze-first，不隐式 apply candidate config。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm test -- --runInBand`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm exec vitest run packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：`TK-735 / DA-735` 完成 `sprint-001` closeout 与 activation handoff 后，当前任务切换为 `in_progress`，开始梳理 `connect` authoring surface 与 candidate materialization 入口。
3. 2026-04-10：已为 `connect` 增加 repeatable `--tool-transport <tool>=<transport>` authoring surface，并补齐 CLI 入口解析、选项说明与 candidate config 集成测试。

## 10. 产出

1. `apps/cli/src/main.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/constants/cli-connect.constant.ts`
4. `apps/cli/src/constants/cli-output.constant.ts`
5. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
6. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
7. `apps/cli/src/types/index.ts`
8. `packages/shared/src/i18n/locales/en-us.ts`
9. `packages/shared/src/i18n/locales/zh-cn.ts`
10. `apps/cli/test/connect-phase2.integration.test.ts`
