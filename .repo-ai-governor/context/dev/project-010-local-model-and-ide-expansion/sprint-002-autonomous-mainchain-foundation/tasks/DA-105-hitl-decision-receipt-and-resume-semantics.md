# DA-105 HITL 决策回执与恢复执行语义

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-105`
- Produced By: `TK-101`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

固化 `project-010 / sprint-002` 中 `confirm/escalate -> decision receipt -> resume/terminate/degrade` 的最小可执行闭环，使 CLI `run` 在命中 HITL 时能够统一生成通知 artifact、决策回执、审计事件与恢复语义，并把人工结论重新回灌到自动主链。

## 2. 已收口的实现面

1. HITL preview 与 resolution 已收敛到 package-local runtime
   - `apps/cli/src/runtime/hitl-runtime.ts` 负责对 `confirm/escalate` 结果做 preview、notification dispatch、decision receipt 落盘与审计记录，避免 HITL 逻辑继续扩张到 facade 层。
   - preview 会在 runtime 执行前产出 `effectivePolicyOutcome`，供 inline review guard 和后续 stage dispatch 直接消费。
2. CLI 真实入口已支持 decision receipt 参数
   - `apps/cli/src/main.ts` 已补齐 `--hitl-decision / --hitl-decision-reason / --hitl-resume-action / --hitl-decided-by / --hitl-constraints` 的声明、argv 解析与输入校验。
   - `apps/cli/test/cli-output-contract.integration.test.ts` 已验证 CLI 用户可以从真实 argv 路径触发 approve/resume 闭环。
3. 主通知路径已具备可验证接线
   - 当前最小通知 provider 通过 artifact webhook 形式写入 `context/hitl/notifications/*.json`，形成可复跑、可审计、可回放的 primary notification path。
   - decision receipt 会落到 `context/hitl/decisions/*.json`，并附带 `decision / reason / constraints / resumeAction / decidedBy / finalPolicyOutcome`。
4. `approve -> resume` 语义已真实恢复自动主链
   - 当调用方提供 `taskId + hitlDecision=approve` 时，preview 结果会前移影响 inline review guard，`stage-task-review / stage-task-review-verify` 会真正恢复执行，而不是只在最终结果上翻转 policy outcome。
5. `reject -> terminate` 语义已形成终止闭环
   - `reject` 默认映射为 `resumeAction=terminate` 与 `finalPolicyOutcome=block`。
   - runtime 会生成 decision receipt，但不会再推进 inline review 子链；CLI 会以 policy-gate failure 终止执行并保留 receipt / audit facts。
6. `revise -> degrade` 语义已形成受控降级闭环
   - `revise` 默认映射为 `resumeAction=degrade` 与 `finalPolicyOutcome=escalate`。
   - runtime 会保留 decision receipt，并继续将执行保持在 HITL follow-up 状态，而不是伪装为已成功无人值守完成。
7. dry-run 语义已覆盖 HITL 路径
   - high-risk `run --dry-run` 现在只返回预测性 notification diagnostics，不再真实 dispatch notification、写 decision receipt 或落地后续副作用。

## 3. 一致性结论

1. `TK-101` 已将 HITL 从“策略命中后的外部概念”收敛为 runtime 内可审计的通知与决策回灌链路。
2. `approve/resume`、`reject/terminate`、`revise/degrade` 三类语义现在都具备明确的最终 policy outcome、decision receipt 和 CLI/runtime 可验证行为。
3. dry-run、task-driven review chain 与 HITL 决策现在共享同一条 side-effect gate 逻辑，不再出现“演练路径写真实通知”或“批准后仍无法恢复子链”的漂移。
4. 当前最小实现已经满足 `TK-102` 汇总 sprint-002 出口验收所需的 primary path / degrade path 输入证据。

## 4. 关键验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/runtime/task-driven-run-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:packages -- @repo-ai-governor/cli @repo-ai-governor/notification-dispatcher --maxWorkers=1 --maxConcurrency=1`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
9. `pnpm run check`

## 5. 最终结论

1. 当前状态：`accepted`
2. 结论：`TK-101` 已完成 HITL 决策回执与恢复执行语义基线，`DA-105` 现作为 `TK-102` 的正式输入证据。
