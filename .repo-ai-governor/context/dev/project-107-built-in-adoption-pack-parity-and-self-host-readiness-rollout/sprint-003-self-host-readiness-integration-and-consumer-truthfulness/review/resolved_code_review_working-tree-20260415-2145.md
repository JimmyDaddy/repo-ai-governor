# Code Review: sprint-003 self-host readiness integration and consumer truthfulness delegated round 1

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint delegated working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `packages/standards/src/built-in-adoption-pack-catalog.ts`
3. `apps/cli/test/adopt-command.integration.test.ts`
4. `packages/standards/test/adoption-pack-registry.unit.test.ts`
5. `README.md`
6. `docs/local-adoption-playbook.md`
7. `docs/support-matrix.md`

## 2. Findings
### 2.1 [P1] Consumer docs overclaim an automatic execution preflight that the current runtime does not expose
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts`, `README.md`, `docs/local-adoption-playbook.md`, `docs/support-matrix.md`
- 问题描述: 当前实现把 self-host execution readiness 投影为 `adopt verify` 中的 warning/signal，但本轮变更没有新增单独的 automatic execution preflight command 或 public consumer。若文档继续把该能力描述成“automatic execution preflight 已经存在并生效”，就会高估当前 contract。
- 影响: adopter 可能误以为 unattended self-host execution 已被自动挡住，从而在真实仍依赖人工判读 signal 的窗口里错误放行。
- 建议: 把 runtime/docs wording 收敛为 `execution_preflight_signal=blocked` warning/signal，并明确要求 self-host operator 在无人值守执行前把它视作 blocker，而不是宣称已有独立 automatic preflight surface。

### 2.2 [P2] Placeholder readiness can still be bypassed by shallow edits to starter docs
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts`, `packages/standards/src/built-in-adoption-pack-catalog.ts`
- 问题描述: readiness placeholder detection 依赖 exact-content 或弱 marker 时，只要对 bootstrap stub 做很小的编辑，就可能让未真正 authored 的 self-host starter surface 看起来已经 ready。
- 影响: self-host readiness 可能在 adopter 还没真正补齐治理/产品/执行面真值前被误报为通过，削弱 readiness boundary 的可信度。
- 建议: 为 self-host starter bootstrap surface 增加显式 placeholder marker，并在 runtime detection 中补充对 placeholder-only metadata edits 的骨架归一化比对，避免删一行 marker 或只改日期/状态就绕过 warning。

## 3. Notes
1. 本轮 delegated reviewer 返回 2 个 actionable findings；主 agent 需先逐条验证并修复，再进入 fresh post-fix recheck。

## 4. Verification
1. `pnpm run build`（主 agent 已在同一 change window 通过；本轮 reviewer 未重跑）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（主 agent 已在同一 change window 通过；本轮 reviewer 未重跑）
3. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（主 agent 已在同一 change window 通过；本轮 reviewer 未重跑）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（主 agent 已在同一 change window 通过；本轮 reviewer 未重跑）
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（主 agent 已在同一 change window 通过；本轮 reviewer 未重跑）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 runtime 将 self-host execution readiness 暴露为 `adopt verify` 中的 `execution_preflight_signal=blocked` warning/signal；`README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md` 与 `packages/standards` readiness note 已同步收敛到 signal/blocker/downstream fail-closed 叙述，不再宣称存在独立 public automatic preflight surface。
   - 处理：接受并通过 runtime/docs/tests truthfulness 对齐完成修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`packages/standards/src/built-in-adoption-pack-catalog.ts` 现已为 self-host starter bootstrap docs 注入 `- Placeholder Status: replace_before_execution`；`apps/cli/src/runtime/adoption-pack-runtime.ts` 现已在 exact match 之外补充 placeholder skeleton normalization，删掉 marker 或只改状态/日期不再足以绕过 readiness warning。
   - 处理：接受并通过 bootstrap marker + runtime detection hardening 完成修复。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

### 风险与后续
1. 当前 public contract 仍只保证 `adopt verify` signal truthfulness；是否在更广 execution surface 上引入真正自动消费该 signal 的 preflight consumer，留待后续 scope 明确后再推进。

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md`、`packages/standards/src/built-in-adoption-pack-catalog.ts`、`packages/standards/test/adoption-pack-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
   - 说明：已把 contract wording 收敛为 `adopt verify` 发布 `execution_preflight_signal=blocked` warning/signal，并明确要求 self-host consumer 以 downstream fail-closed blocker 解释该 signal；不再 overclaim 独立 automatic preflight surface。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`packages/standards/src/built-in-adoption-pack-catalog.ts`、`apps/cli/test/adopt-command.integration.test.ts`、`packages/standards/test/adoption-pack-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：已把显式 placeholder marker 写入 self-host bootstrap stubs，并把 runtime detection 加强为 exact match + marker + placeholder-only metadata skeleton normalization 组合判定。

## 处置结果与剩余风险
1. round 1 的 accepted findings 已全部完成修复并复验通过。
2. 当前 sprint 仍保留 `CR-002` 作为 fresh post-fix recheck round，用于确认修复后的 working tree 没有新增 actionable findings 再进入 closeout。
