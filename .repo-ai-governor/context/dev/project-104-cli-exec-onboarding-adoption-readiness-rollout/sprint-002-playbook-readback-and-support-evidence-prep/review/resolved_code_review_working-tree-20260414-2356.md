# Code Review: project-104 final working tree recheck 2

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-005`
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
### 2.1 [P2] Active remote_api row still advertises verify warn semantics
- 位置: `docs/support-matrix.md:174`、`docs/support-matrix.zh-CN.md:174`
- 问题描述: the active `remote_api` support-boundary row still described current readiness warns through `doctor / verify`, which kept the removed public `verify` command inside today's live support story.
- 影响: adopters or maintainers could still read the current support matrix as permission to use a public command that now fails.
- 建议: reword the active row to `doctor`-only readiness wording while leaving historical artifact/file names unchanged.

## 3. Notes
1. fresh reviewer did not surface any additional runtime, command, test, or playbook issue within this scope.
2. 当前 active support rows 173-176 已全部改为 `doctor`-anchored readiness wording；剩余 `verify` 主要存在于 dated historical evidence rows 或既有 artifact 文件名中。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`（通过）
7. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于确认 removed public command 仍未被重新暴露）

## 复核结论（2026-04-15，fresh reviewer round 5）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] Active remote_api row still advertises verify warn semantics`
   - 判定：**认可**
   - 证据：active `remote_api` support-boundary row 仍把当前 warn 语义写成 `doctor / verify`，与当前公开 `connect + doctor` onboarding contract 不一致。
   - 处理：将该行改写为 `doctor`-only readiness wording，并保留历史 artifact 文件名不变。

## 修复执行记录（2026-04-15）

1. `2.1 [P2] Active remote_api row still advertises verify warn semantics`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`、`node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`、`node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`、`node ./dist/bin/repo-ai-governor.js verify --adapters --output json`
   - 说明：active `remote_api` support row 现在只把 `doctor` 作为当前公开 readiness diagnostics surface，不再把 removed `verify` 命令写成 live guidance。

## 处置结果与剩余风险（2026-04-15）

1. `CR-005` 已完成 accepted finding 修复与同窗验证，可收口为 `resolved`。
2. `project-104` 仍需再开一轮 fresh `CR-006` clean recheck，确认最新 reviewer round 无新的 actionable finding 后，才能进入 final closeout。
