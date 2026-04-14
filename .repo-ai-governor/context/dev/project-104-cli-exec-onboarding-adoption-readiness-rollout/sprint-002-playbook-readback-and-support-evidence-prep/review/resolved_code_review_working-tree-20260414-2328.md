# Code Review: project-104 final working tree recheck

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
6. `apps/cli/test/commands/connect-command.test.ts`
7. `apps/cli/test/commands/doctor-command.test.ts`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `docs/support-matrix.md`
11. `docs/support-matrix.zh-CN.md`

## 2. Findings
### 2.1 [P2] Support matrix still presents `verify --adapters` as live adapter guidance
- 位置: `docs/support-matrix.md:173`、`docs/support-matrix.md:176`、`docs/support-matrix.zh-CN.md:173`、`docs/support-matrix.zh-CN.md:176`
- 问题描述: active support-truth rows still described current adapter-readiness warn semantics through `doctor/verify` or `verify --adapters`, even though the public onboarding gate had already been cut over to `doctor --adapters`.
- 影响: adopters or maintainers could still infer that the removed public `verify --adapters` command remained part of the current supported readiness story.
- 建议: refresh those active rows to use current `doctor` / adapter-readiness diagnostics wording while preserving historical evidence artifact names.

## 3. Notes
1. fresh reviewer did not surface any additional executable-surface or test-boundary issue in the reviewed runtime, command, or test files.
2. 本轮 accepted finding 仍是 support-truth wording drift；实现代码边界没有新增 scope。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`（通过）
7. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于确认 removed public command 仍未被重新暴露）

## 复核结论（2026-04-14，fresh reviewer round 4）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Support matrix still presents verify --adapters as live adapter guidance`
   - 判定：**认可**
   - 证据：活跃 support-truth 行仍将当前 adapter-readiness warn 语义写成 `doctor/verify` 或 `verify --adapters`，与前文公开 `doctor --adapters` gate 的正式口径不一致。
   - 处理：将活跃行统一改写为 `doctor` / adapter-readiness diagnostics wording，并保留历史 evidence artifact 文件名不变。

## 修复执行记录（2026-04-14）

1. `2.1 [P2] Support matrix still presents verify --adapters as live adapter guidance`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`、`node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`、`node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`、`node ./dist/bin/repo-ai-governor.js verify --adapters --output json`
   - 说明：support-truth 活跃行现在只把 `doctor` 作为当前公开 readiness gate，并把历史 `verify` 痕迹收缩回 artifact/file-name 层面。

## 处置结果与剩余风险（2026-04-14）

1. `CR-004` 已完成 accepted finding 修复与同窗验证，可收口为 `resolved`。
2. 由于 latest fresh reviewer round 本身仍返回了 actionable finding，`project-104` 还需再开一轮 fresh `CR-005` clean recheck，确认修复后无新的阻断项，再允许 final closeout。
