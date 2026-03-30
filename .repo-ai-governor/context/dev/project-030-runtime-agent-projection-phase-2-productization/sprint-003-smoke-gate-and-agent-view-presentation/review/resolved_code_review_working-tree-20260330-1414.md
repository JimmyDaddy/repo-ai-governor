# Code Review: working tree 2026-03-30 14:14

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 1. Review Scope
1. `apps/cli/src/commands/connect-command.ts`
2. `apps/cli/src/runtime/connect-workflow-runtime.ts`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/presentation/agent-projection-presenter.ts`
5. `apps/cli/src/cli-output-presenter.ts`
6. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
7. `apps/cli/test/connect-phase2.integration.test.ts`
8. `apps/cli/test/runtime/agent-projection-presenter.test.ts`
9. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
10. `packages/core-agent-projection/src/agent-projection-service.ts`
11. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 2. Findings
### 2.1 [P1] `connect diff/apply` trusts stale diagnostics fingerprints after the candidate file changes
- 位置: `apps/cli/src/runtime/connect-workflow-runtime.ts:171`, `apps/cli/src/runtime/connect-workflow-runtime.ts:185`, `apps/cli/src/runtime/connect-workflow-runtime.ts:206`, `apps/cli/src/commands/connect-command.ts:532`, `apps/cli/src/commands/connect-command.ts:605`
- 问题描述: `resolveCandidateReference()` 重新读取并校验了当前的 candidate YAML，但随后仍直接复用旧 diagnostics JSON 里的 `candidateConfigHash / applyReady / applyBlockers / riskNotes`。`connect diff` 的 `candidate_apply_ready` 检查和 `connect apply` 的阻断逻辑都继续基于这份旧快照，而不是当前 candidate 文件内容。这样一来，只要用户在 generate 之后审阅或手工调整了 candidate 文件，命令就可能一边应用新的 YAML，一边继续展示旧 hash 和旧 apply-ready 结论。
- 影响: reviewable write-back 的核心安全语义被破坏。修正后的 candidate 可能被误拦截；反过来，带新风险的 candidate 也可能在旧 diagnostics 仍为 `applyReady=true` 时被写回 `governor.yaml`，并生成错误 receipt/hash 给后续自动化消费。
- 建议: 在解析 candidate 引用后，基于当前 candidate YAML 重新计算 `candidateConfigHash` 和 apply readiness，或者在 hash 与 diagnostics fingerprint 不一致时显式拒绝继续 diff/apply，要求先重新生成/刷新 candidate artifacts。

### 2.2 [P2] destructive write-back branches are almost completely untested
- 位置: `apps/cli/test/connect-phase2.integration.test.ts:142`
- 问题描述: 新增测试只覆盖了 `connect generate -> diff -> apply` 的 happy path。对于这次变更里真正决定写回安全性的分支，没有对应覆盖：显式 candidate path 与 `--latest` 的二选一约束、source fingerprint drift 阻断、apply blocker 阻断、`--force` 绕过、以及 `--no-rollback` receipt/artifact 语义。当前测试即使全绿，也无法证明这些新分支不会把错误配置写进活跃 `governor.yaml`。
- 影响: 一旦上述安全分支回归，CI 仍可能保持绿色，而真实用户路径却在 diff/apply 上出现误放行、误阻断或 rollback 产物缺失。
- 建议: 至少补 4 组集成覆盖：drift 时 `apply` 默认阻断、`--force` 放行、`--no-rollback` 不产出 snapshot 且 receipt 正确、以及手工编辑 candidate 后的 mismatch/blocker 行为。

## 3. Notes
1. 我额外跑了新增的 connect/presenter 相关 package tests，happy path 与 presenter surface 当前是通过的，但这些测试还不足以覆盖上述安全分支。
2. triad / registry / sprint ledger 相关变更本轮只做了 spot-check，没有发现比上述两项更高优先级的阻塞点。

## 4. Verification
1. `pnpm run test:packages -- apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/agent-projection-presenter.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-30）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`resolveCandidateReference()` 原先确实在重新读取 candidate YAML 后，继续复用 diagnostics JSON 中的 `candidateConfigHash / applyReady / applyBlockers / riskNotes`，导致手工编辑 candidate 后 `connect diff/apply` 仍可能沿用旧快照语义。
   - 处理：已改为基于当前 candidate YAML 重新计算 candidate hash 与 apply readiness，并把 `candidate_fingerprint_current` / `diagnostics_candidate_config_hash` 暴露到 diff/apply payload，避免 stale diagnostics 继续驱动写回判断。
2. `2.2`
   - 判定：**认可**
   - 证据：原测试只有 `generate -> diff -> apply` happy path，确实没有覆盖 default block / force / no-rollback / hand-edited candidate 等 destructive write-back 安全分支。
   - 处理：已补 CLI integration 覆盖，新增 explicit path + `--latest` 冲突、source fingerprint drift 默认阻断、`--force` + `--no-rollback`、以及手工编辑 candidate 后 diff/apply 重新计算 blocker 的回归保护。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/runtime/agent-projection-presenter.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check:project-030-adopter-smoke`（通过）

## 修复执行记录（2026-03-30）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/connect-workflow-runtime.ts`、`apps/cli/src/commands/connect-command.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：candidate 引用现在会基于当前 YAML 重新计算 hash / apply blockers / risk notes，并把 diagnostics fingerprint 是否过期作为显式检查项回传。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/connect-phase2.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/runtime/agent-projection-presenter.test.ts apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`（通过）
   - 说明：补齐 destructive write-back 关键分支，包括默认阻断、`--force` 绕过、`--no-rollback` 语义、手工编辑 candidate 后的 fresh blocker 计算，以及 explicit candidate path / `--latest` 约束。
