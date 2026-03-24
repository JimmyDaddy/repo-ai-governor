# DA-107 受控 delivery rehearsal 与 audit/replay 集成

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-107`
- Produced By: `TK-107`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

为 Stage 9 的 delivery 演练建立最小可执行基线：在不产生真实 `git commit`/PR 副作用的前提下，将受控 `commit / PR draft` rehearsal 纳入 `run` 主链、审计事实、report/replay 输出和人工接管边界。

## 2. 实现摘要

1. task-driven `run` 现在可为 delivery 类任务自动装配 `stage-delivery-rehearsal`。
2. 新增 package-local `CliDeliveryRehearsalRuntime`，负责：
   - 解析 `commit` / `pr_draft` rehearsal action
   - 继承当前 run 的 policy/HITL 结果
   - 在 `dry-run` 或非 `allow` policy 下返回无副作用 `dry_run/deferred`
   - 在 `allow` 下写入 controlled delivery rehearsal artifact
3. `CliGovernanceRuntime` 会把 delivery rehearsal 的 `artifactId=status=path` 一并回写到 audit event、execution report、replay pointer 和 CLI details/experience。
4. `CommandExperienceBuilder` 新增 `delivery_rehearsal` progress row 与 layered logs 字段，确保终端输出可直接解释当前 delivery 边界。

## 3. 受控边界

1. 当前实现只生成 rehearsal artifact，不执行真实 `git commit`、不开真实 PR。
2. `dry-run` 下不写 delivery artifact，只输出预测性状态。
3. policy 结果非 `allow` 时，delivery rehearsal 进入 `deferred`，等待 HITL 决策继续推进。
4. artifact 中明确记录 `manualHandoffRequired=true` 与下一步人工动作，避免被误判为真实交付已完成。

## 4. Audit / Replay 集成结果

1. delivery rehearsal stage output 现在显式发出 `artifactId=delivery_rehearsal`。
2. run pipeline 记录 audit event 时会回填 stage-level `artifactId`。
3. execution report 的 `replayPointers[]` 已可稳定包含：
   - `stageId=stage-delivery-rehearsal`
   - `artifactId=delivery_rehearsal`
4. 对应 rehearsal artifact 内还会写入 `auditReplay` 关联块，便于从 artifact 反向定位 execution/stage。

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/runtime/task-driven-run-runtime.test.ts apps/cli/test/runtime/command-experience-builder.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run release:ga-check`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. `node ./scripts/governance/check-worktree-review-target.js`
11. `pnpm run check`

## 6. 结论

1. `TK-107` 已达到“至少 1 条受控 delivery rehearsal 可回放、可审计、可人工接管”的 sprint-003 第一阶段验收要求。
2. 后续 `TK-108` 应以本产物为输入，重点扩展到 blackbox / CI / release / GA 指标，而不是重新定义 delivery 演练契约。
