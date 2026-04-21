# TK-998 build source-checkout acp execution clean-room slice

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-004-clean-room-execution-and-packaged-evidence`

## 1. 任务目标

在 source-checkout 条件下验证 ACP execution bridge 的真实运行证据

## 2. Depends On

1. sprint-003-permission-terminal-filesystem-bridge-hardening planned handoff

## 3. 预期产物

1. clean-room evidence artifact for TK-998
2. task card update for TK-998
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1 --acp-execution-verify --output .tmp/project-115-sprint-004-acp-cleanroom-smoke-path-report.json`
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-998`

## 8. Delivery Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
5. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-998`
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-998`
7. `node ./scripts/governance/check-task-ledger-sync.js`
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`CR-001` 确认 sprint-003 reviewer-clean 后，本任务切换为 `in_progress`，作为 sprint-004-clean-room-execution-and-packaged-evidence 的首个 active execution surface。
3. 2026-04-20：在 `scripts/release/verify-cleanroom-local-install.js` 中新增 `--acp-execution-verify` clean-room 分支，通过安装包内 `dist/**` runtime 动态导入，真实覆盖 routed `invokeStage`、`streamEvents` tool bridge replay、permission bridge 与 cancel cleanup。
4. 2026-04-20：source-checkout smoke 与 formal clean-room execution 已通过；`path/link/tgz` 三种安装模式都返回 `status=passed`，且 cancellation failure code 保持 `PROCESS_RUNTIME_CANCELLED`，terminal/create 与 `fs/read_text_file` bridge replay 顺序稳定。

## 10. 产出

1. `scripts/release/verify-cleanroom-local-install.js` 已补齐 `--acp-execution-verify`、`runAcpExecutionScenario()` 与 `verify-acp-execution.mjs` 生成逻辑。
2. `.tmp/project-115-sprint-004-acp-cleanroom-smoke-path-report.json` 与 `.tmp/project-115-sprint-004-acp-cleanroom-report.json` 已记录 source-checkout clean-room execution evidence。
