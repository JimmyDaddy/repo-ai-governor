# TK-999 land packaged distribution and runtime-service execution evidence

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-004-clean-room-execution-and-packaged-evidence`

## 1. 任务目标

在 packaged distribution/runtime-service 场景补齐 ACP execution evidence

## 2. Depends On

1. TK-998

## 3. 预期产物

1. distribution evidence artifact for TK-999
2. task card update for TK-999
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

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`
2. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-999`

## 8. Delivery Verification

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --acp-execution-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-115-sprint-004-acp-cleanroom-report.json`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-999`
5. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks" --task-id TK-999`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-20：`TK-998` 完成 source-checkout clean-room slice 后，本任务切换为 `in_progress`，开始把 runtime-service / packaged-distribution 证据并入统一 ACP clean-room report 与 summary surface。
3. 2026-04-20：formal clean-room run 已刷新 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`，三种安装模式下的 `claude-code`、`codex` 与 `github-copilot` runtime-service / packaged-distribution receipts 全部回写为 `pass`。
4. 2026-04-20：execution 证据保留在 `.tmp/project-115-sprint-004-acp-cleanroom-report.json` 的 `acpExecutionScenarios`，support-facing clean-room summary 则继续作为 conservative receipt index 供 runtime readiness 消费。

## 10. 产出

1. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json` 已更新为当前 sprint-004 report provenance，并保持 `verifiedModes=["link","path","tgz"]`。
2. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**` 与 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**` 已刷新 runtime-service / packaged-distribution receipts。
