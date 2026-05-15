# Code Review: sprint-002 ownership and generated-artifact policy

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: working tree review
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

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings
### 2.1 [P2] self-host gitignore recommendation copy bypassed the CLI i18n baseline
- 位置: `apps/cli/src/runtime/adoption-pack-runtime.ts:973`
- 问题描述: `writeSelfHostGitignoreRecommendation()` 直接把英文说明写入 recommendation artifact，没有通过 `localizeText(...)` 或 keyed i18n 路径输出用户可见文案。
- 影响: sprint-002 刚新增的 adopter-facing recommendation artifact 会在中文 locale 下继续暴露单语英文文案，违反 `CS-033` 的 apps/packages user-facing text baseline。
- 建议: 将 recommendation file header/description 收敛到 `this.localizeText(...)`，确保该 artifact 跟随 CLI locale 输出双语桥接文案。

### 2.2 [P3] regression test introduced a native `Error` throw in `test/**`
- 位置: `apps/cli/test/adopt-command.integration.test.ts:1644`
- 问题描述: 新增 edited self-host regression test 在 `diffExitCode !== 0` 分支里使用 `throw new Error(...)`，违反 `CS-022` 对 `apps/**`、`packages/**`、`bin/**`、`test/**` 禁止直接使用原生 `Error` 的规则。
- 影响: 尽管只在测试路径触发，但会让 sprint-002 的验证面本身与仓库统一错误模型约束不一致，也给后续测试示例留下错误用法。
- 建议: 改成 assertion-first 的失败表达，例如先断言 exit code，再在非零分支用 `expect(...)` 输出 stderr 并提前 return。

## 3. Notes
1. 本轮 fresh reviewer 返回 2 个 actionable findings，主 agent 逐条复核后均予以接受并在同一 change window 修复。
2. 本轮修复仅收敛 sprint-002 新增的 adopter-facing recommendation 与 regression test 合规性，不提前改动 sprint-003 的 activation/readiness owner split。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-05-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`writeSelfHostGitignoreRecommendation()` 直接拼接英文 header/description，确实属于 self-host adopter 可见输出，命中 `CS-033`。
   - 处理：已接受并修复，将 recommendation file 的说明文案改为 `this.localizeText(english, chinese)` 输出。

2. `2.2`
   - 判定：**认可**
   - 证据：新增 regression test 在 `test/**` 中直接 `throw new Error(...)`，命中 `CS-022` 禁止项。
   - 处理：已接受并修复，改为 `expect(diffExitCode).toBe(0)` 的 assertion-first 写法，并在失败分支断言 stderr 后提前 return。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-05-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：将 self-host gitignore recommendation 的标题与说明文案接入本地化桥接，避免中文 locale 下继续输出单语英文。

2. `2.2`：已完成
   - 变更文件：`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`（通过）
   - 说明：去除测试中的原生 `Error` 用法，改为 assertion 驱动的失败表达，同时保留 stderr 诊断信息。
