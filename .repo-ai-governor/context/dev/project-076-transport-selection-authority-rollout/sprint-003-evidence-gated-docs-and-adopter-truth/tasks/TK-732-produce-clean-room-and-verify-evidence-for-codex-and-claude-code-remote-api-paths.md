# TK-732 produce clean-room and verify evidence for codex and claude-code remote_api paths

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-003-evidence-gated-docs-and-adopter-truth`

## 1. 任务目标

产出能够证明 `codex` / `claude-code` `remote_api` 路径独立 probe / invoke 且保持 fail-closed truth 的 evidence artifact。

## 2. Depends On

1. `TK-731`
2. `docs/support-matrix.md`
3. `docs/local-adoption-playbook.md`

## 3. 预期产物

1. clean-room verification report
2. verify evidence artifact
3. release-style evidence summary (`DA-732`)

## 4. Required Inputs

1. `docs/support-matrix.md`
2. `docs/local-adoption-playbook.md`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `TK-727`
3. `TK-731`

## 6. 实施计划

1. 设计 clean-room / verify 场景，验证 explicit `remote_api` 不会被静默改写。
2. 产出可回放 evidence artifact。
3. 形成 docs wording uplift 的 gate verdict。

## 7. Development Verification

1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts --reporter=json --outputFile .tmp/project-076-sprint-003-remote-api-vitest.json --maxWorkers=1 --maxConcurrency=1`
2. `node ./scripts/release/verify-local-distribution.js --output .tmp/project-076-sprint-003-local-distribution-report.json`
3. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --output .tmp/project-076-sprint-003-cleanroom-report.json`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-10：`TK-736 / DA-736` 完成 sprint-002 closeout 后，当前任务切换为 `in_progress`，开始设计 clean-room / verify evidence 场景与产物落盘路径。
3. 2026-04-10：已完成 targeted adapter vitest（`65/65`）、default distribution remote_api smoke 与 clean-room `path/link/tgz` remote_api rehearsal，并产出 `DA-732` 汇总证据；evidence gate 判定为 `passed`，同时确认显式 `remote_api` 失败保持 fail-closed，不会静默复用同 surface `cli_exec` 真值。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth/tasks/DA-732-remote-api-clean-room-and-verify-evidence-summary.md`
2. `.tmp/project-076-sprint-003-remote-api-vitest.json`
3. `.tmp/project-076-sprint-003-local-distribution-report.json`
4. `.tmp/project-076-sprint-003-cleanroom-report.json`
