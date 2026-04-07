# Code Review: sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Project: `project-057-standards-native-review-engine-productization`
- Sprint: `sprint-003-standards-guided-reviewer-handoff-and-source-aware-closure`
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/standards-native-review-engine-and-provenance-aware-cr.md`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`

## 1. Review Scope

1. `apps/cli/src/commands/review-command.ts`
2. `apps/cli/src/commands/review-verify-command.ts`
3. `apps/cli/src/constants/cli-review.constant.ts`
4. `apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`
5. `apps/cli/src/types/interfaces/cli-review-command.interface.ts`
6. `apps/cli/src/types/interfaces/index.ts`
7. `apps/cli/test/commands/review-command.test.ts`
8. `apps/cli/test/commands/review-verify-command.test.ts`
9. `apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`
10. `.codex/skills/workspace-scoped-cr-loop/**`

## 2. Findings

### 2.1 [P1] standards-guided finding could auto-close without fresh delegated recheck
- 位置: `apps/cli/src/commands/review-verify-command.ts`
- 问题描述: `review-verify` 仅依赖本地 deterministic/risk 再生成结果就能把 `standards_guided_inference` finding 推进到 `resolved`，会把 same-round verify 与 fresh reviewer recheck 的语义边界重新混掉。
- 影响: delegated reviewer 的 finding 可能在没有 fresh reviewer 证据的情况下被错误关闭，违背 provenance-aware closure 目标。
- 依据: `adr.runtime.orchestration.standards-native-review-engine.v1 -> 2.2/4.3`
- 建议: 同轮 `review-verify` 对 `standards_guided_inference` 只允许保持 open 并保留 rationale，等待 fresh reviewer round 再做 closure。

### 2.2 [P2] structured handoff contract dropped repo-local required review inputs
- 位置: `.codex/skills/workspace-scoped-cr-loop/scripts/reviewer-prompt-utils.mjs`
- 问题描述: 新的 canonical handoff contract 只保留了治理文档，没有继续显式带上 `workspace-code-review-workflow` 与 `workspace-delivery-finisher` 两个 repo-local skill 输入。
- 影响: fresh reviewer round 可能缺少 repo-local review bar 与 closeout workflow 上下文，导致不同 round 使用不一致的 review baseline。
- 依据: `.codex/skills/workspace-scoped-cr-loop/SKILL.md -> Required Inputs`
- 建议: 把两个 repo-local skill 输入并回 canonical handoff contract 的 required inputs。

### 2.3 [P2] verification rationale copy bypassed i18n/localizeText
- 位置: `apps/cli/src/commands/review-verify-command.ts`
- 问题描述: 新增的 `verificationRationale` 文案直接写死为英文字符串，没有通过 `localizeText` 输出。
- 影响: 中文 locale 下生成的 review artifact 会出现混合语言 user-facing copy，违反 `CS-033`。
- 依据: `CS-033`
- 建议: 把新增 rationale 文案全部改为 `localizeText(english, chinese)`。

### 2.4 [P2] delegated finding normalizer accepted out-of-contract rule ids
- 位置: `.codex/skills/workspace-scoped-cr-loop/scripts/reviewer-prompt-utils.mjs`
- 问题描述: normalizer 会把 covered/unknown `ruleId` 自动降级成 `risk_inference`，而不是拒绝掉不属于 uncovered projected-rule 子集的 finding。
- 影响: delegated CR loop 会摄入超出 handoff contract 的 finding，破坏 projected rule subset 的边界真实性。
- 依据: `adr.runtime.orchestration.standards-native-review-engine.v1 -> 2.2`
- 建议: 仅接受 uncovered rule ids 对应的 standards-guided finding，以及显式标记的 risk observation；其余输入直接丢弃。

## 3. Notes

1. 本轮 reviewer 使用 fresh sub-agent 只读检查当前 sprint-003 边界。
2. 在发现上述 4 条 actionable finding 后，主 agent 已进入 fix-and-verify 路径。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`review-verify` 需要保持 same-round verify 与 fresh reviewer recheck 的边界，不能仅凭本地 deterministic/risk 重扫就关闭 delegated standards-guided finding。
   - 处理：已改为在缺少 fresh delegated recheck 证据时继续保持 standards-guided finding 为 open。
2. `2.2`
   - 判定：**认可**
   - 证据：`workspace-scoped-cr-loop` skill 把 `workspace-code-review-workflow` 与 `workspace-delivery-finisher` 视为 required inputs，但 handoff contract 没有同步携带。
   - 处理：已把两个 repo-local skill 输入补回 canonical handoff contract。
3. `2.3`
   - 判定：**认可**
   - 证据：新增 `verificationRationale` 文案直接写死为英文字符串，命中 `CS-033`。
   - 处理：已改为通过 `localizeText(english, chinese)` 输出。
4. `2.4`
   - 判定：**认可**
   - 证据：delegated finding normalizer 应只接受 uncovered rule ids 对应的 standards-guided finding 与显式 risk observation。
   - 处理：已改为丢弃 covered/unknown rule ids 对应的非 risk finding 输入。

### 验证命令
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-04-07）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/test/commands/review-verify-command.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`（通过）
   - 说明：`standards_guided_inference` 现已在缺少 fresh delegated recheck 证据时保持 open，不再被 same-round verify 自动关闭。
2. `2.2`：已完成
   - 变更文件：`.codex/skills/workspace-scoped-cr-loop/scripts/reviewer-prompt-utils.mjs`
   - 验证：`node ./.codex/skills/workspace-scoped-cr-loop/scripts/render-reviewer-subagent-prompt.mjs --help`（通过）
   - 说明：canonical handoff contract 已补回 `workspace-code-review-workflow` 与 `workspace-delivery-finisher` 两个 required inputs。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/commands/review-verify-command.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：新增 verification rationale 文案已统一改为 `localizeText(english, chinese)`。
4. `2.4`：已完成
   - 变更文件：`.codex/skills/workspace-scoped-cr-loop/scripts/reviewer-prompt-utils.mjs`、`apps/cli/src/runtime/review/cli-hybrid-review-runtime.ts`、`apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`
   - 验证：`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/runtime/cli-hybrid-review-runtime.test.ts`（通过）
   - 说明：normalizer 现仅接受 uncovered rule ids 对应的 standards-guided finding 与显式 risk observation，覆盖/未知 rule id 将被丢弃。

## 处置结果与剩余风险

1. 本轮 reviewer 提出的 4 条 actionable finding 已全部完成修复并通过同窗口验证。
2. `pnpm run check` 已在修复后重跑通过。
3. 该 round 当前无剩余 actionable finding，后续可继续推进 sprint closeout。
