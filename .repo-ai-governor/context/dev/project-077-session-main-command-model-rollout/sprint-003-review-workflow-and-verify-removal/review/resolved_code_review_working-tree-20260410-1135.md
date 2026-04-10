# Code Review: sprint-003-review-workflow-and-verify-removal working tree round 1

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`
5. `apps/cli/README.md`

## 2. Findings

### 2.1 [P1] Official review-verify examples fall through to `/doctor`

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:71`
- 问题描述: `REVIEW_VERIFY` intent 目前只匹配 `review verify / verify review / 复核 / cr verify` 这类窄关键词。公开文案里的官方示例，如 `Verify that the review findings are fixed.` 和 `帮我验证 review findings 是否都修好了。`，会先命中 generic `verify` 迁移逻辑并被改写到 `/doctor`，而不是留在 `/review verify`。
- 影响: public help/example prompts 与真实 routing 行为不一致，用户会被导向错误 workflow，直接破坏 `review verify` 作为 AI fixed workflow 的产品语义。
- 建议: 在 generic `verify -> doctor` 分支之前扩展 `review verify` intent 匹配，并补充对官方中英示例的回归测试。

### 2.2 [P2] CLI README 仍把顶层 `verify` 写成公开命令

- 位置: `apps/cli/README.md:12`
- 问题描述: `Public Command Surface` 仍写着“多工具接入：connect、verify”，但当前方案已经把公开 `verify` 删除，并把 readiness 公共入口收口到 `doctor`。
- 影响: README 会继续向 adopter 暴露过时接口，和当前 CLI/help/discoverability 形成文档漂移。
- 建议: 把顶层公开命令面改写为 `connect + doctor`；仅保留 namespaced `adopt verify` / `host verify` 这类子命令语义。

### 2.3 [P2] Direct-answer fallback 仍建议用户使用已删除的 `verify`

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts:496`
- 问题描述: fallback 文案仍提示用户可以请求 `connect, doctor, verify, review, or run`。这与本 sprint 的删除结论冲突，也会把用户再次引回已移除命令。
- 影响: 即便 public discoverability 已清理，answer fallback 仍会重新传播过时接口，造成 session.main 文案面残留漂移。
- 建议: 从 fallback guidance 中删除 `verify`，并补一个回归测试确保后续不会再把 removed command 写回提示词。

## 3. Notes

1. 本报告根据 fresh reviewer sub-agent 的 actionable findings 回填，作为 `CR-001` 的 canonical pending artifact。
2. 当前目录此前缺少实际 pending review 文件；本次先补齐文件面，再继续修复与复核生命周期推进。

## 4. Verification

1. `pnpm run build`（通过，review findings 产生前的同窗口基线）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，review findings 产生前的同窗口基线）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过，review findings 产生前的同窗口基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，review findings 产生前的同窗口基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，review findings 产生前的同窗口基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，review findings 产生前的同窗口基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，review findings 产生前的同窗口基线）

## 5. 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts` 已在 generic `verify` 迁移分支之前补充 review-verify intent patterns；`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts` 与 `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts` 已加入官方英文示例 `Verify that the review findings are fixed.` 和官方中文示例 `帮我验证 review findings 是否都修好了。` 的回归覆盖。
   - 处理：保留 `/review verify` 作为官方示例的首选命中路径，不再跌回 `/doctor`。
2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/README.md` 的 `Public Command Surface` 已从顶层 `connect + verify` 改写为 `connect + doctor`，与当前公开命令面一致。
   - 处理：README 顶层命令说明已收口到新的 readiness 语义。
3. `2.3`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts` 已从 fallback guidance 中删除 `verify`；`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts` 已补充回归测试。另补清理了 `apps/cli/src/runtime/session-main-supervisor-runtime.ts` 中 reviewer / role-subagent 的 `verify` 残留提示，避免下一轮 reviewer 再次命中同类漂移。
   - 处理：answer fallback 和 role advisory 文案均不再传播已删除的公开 `verify` 命令。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 6. 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
   - 说明：review-verify intent 现在优先拦住官方示例句式，generic verify migration 不会误伤这些请求。
2. `2.2`：已完成
   - 变更文件：`apps/cli/README.md`
   - 验证：人工复核 README public command surface（通过）
   - 说明：顶层公开命令面已明确为 `connect + doctor`，保留 namespaced `adopt verify` / `host verify` 不变。
3. `2.3`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
   - 说明：fallback guidance 与 role advisory 文案都已移除已删除的公开 `verify` 命令。

## 7. 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并通过同窗口 `build + packages/integration tests + governance gates` 验证。
2. 下一步需要起 fresh reviewer round，确认当前 working tree 在修复后不存在新的 actionable finding。
