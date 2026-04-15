# Code Review: project-104 final working tree

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-003`
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
### 2.1 [P2] Support matrix still points adopters to `verify --adapters`
- 位置: `docs/support-matrix.md:29`、`docs/support-matrix.zh-CN.md:29`
- 问题描述: adapter surface notes still described `verify --adapters` as the public adapter-readiness surface even though the current public onboarding gate is `doctor --adapters`.
- 影响: adopter-facing support truth would send users to a removed public command and make readiness evidence readback inconsistent with the current command contract.
- 建议: update both language variants so the adapter rows point to `doctor --adapters` as the public readiness surface.

### 2.2 [P2] Playbook still sends users to stale `context/diagnostics/verify/`
- 位置: `docs/local-adoption-playbook.md:185`、`docs/local-adoption-playbook.zh-CN.md:185`
- 问题描述: the first-loop troubleshooting section still pointed operators at `context/diagnostics/verify/` even though the current onboarding artifacts are emitted under `context/diagnostics/connect/` and `context/diagnostics/doctor/`.
- 影响: first-run troubleshooting and evidence hand-off would direct users to a directory that the current public onboarding surface no longer populates.
- 建议: replace the stale diagnostics path with `context/diagnostics/doctor/` in both language variants.

## 3. Notes
1. fresh reviewer did not surface an actionable code-path bug in the reviewed runtime, command, or test files beyond these docs-contract drifts.
2. 本轮 accepted finding 仅涉及 adopter-facing docs contract；实现代码边界没有新增 scope。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`（通过）
7. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于确认 removed public command 仍未被重新暴露）

## 复核结论（2026-04-14，fresh reviewer round 3）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Support matrix still points adopters to verify --adapters`
   - 判定：**认可**
   - 证据：`docs/support-matrix*.md` adapter surface rows 仍写着 `verify --adapters`，而同文档的 public command surface 已把 `doctor --adapters` 定义为公开 readiness gate。
   - 处理：同步修正文档中英文 adapter rows，统一指向 `doctor --adapters`。
2. `2.2 [P2] Playbook still sends users to stale context/diagnostics/verify/`
   - 判定：**认可**
   - 证据：`docs/local-adoption-playbook*.md` 首轮排障路径仍指向 `context/diagnostics/verify/`，但当前 onboarding/public diagnostics path 已是 `connect` 和 `doctor`。
   - 处理：同步将中英文 playbook 的旧路径替换为 `context/diagnostics/doctor/`。

## 修复执行记录（2026-04-14）

1. `2.1 [P2] Support matrix still points adopters to verify --adapters`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`
   - 说明：adapter surface notes 已统一改为公开 `doctor --adapters` readiness gate，不再将 support truth 导向 removed public `verify` command。
2. `2.2 [P2] Playbook still sends users to stale context/diagnostics/verify/`：已完成
   - 变更文件：`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`、`node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`、`node ./dist/bin/repo-ai-governor.js verify --adapters --output json`
   - 说明：first-loop troubleshooting 现在只指向当前公开 onboarding surface 会真实产出的 diagnostics 目录。

## 处置结果与剩余风险（2026-04-14）

1. `CR-003` 已完成 accepted findings 修复与同窗验证，可收口为 `resolved`。
2. 由于 latest fresh reviewer round 本身返回了 actionable finding，`project-104` 仍需再开一轮 fresh `CR-004` clean recheck，确认修复后无新的阻断项，再允许 final closeout。
