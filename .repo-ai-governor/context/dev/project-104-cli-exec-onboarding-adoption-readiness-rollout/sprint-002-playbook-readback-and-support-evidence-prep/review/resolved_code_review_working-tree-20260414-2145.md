# Code Review: sprint-002 playbook readback and support evidence prep

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/cli-exec-onboarding-and-adoption-readiness-productization.md`

## 1. Review Scope
1. `docs/local-adoption-playbook.md`
2. `docs/local-adoption-playbook.zh-CN.md`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`

## 2. Findings
### 2.1 [P1] New playbook readback flow pointed users to the removed public `verify` command
- 位置: `docs/local-adoption-playbook.md:136`、`docs/local-adoption-playbook.md:145`、`docs/local-adoption-playbook.zh-CN.md:136`、`docs/local-adoption-playbook.zh-CN.md:145`
- 问题描述: sprint-002 新增的 readiness readback section 要求 operator 运行 `repo-ai-governor verify --adapters --output json`，但 CLI 入口已经在 `apps/cli/src/main.ts` 中将公开 `verify` 命令标记为 removed，并在实际重放时返回 `ENTRYPOINT_COMMAND_WRAPPER_INVALID`。
- 影响: 当前 sprint 的核心增量是 playbook readback / support-evidence guidance；如果第一步命令就不可执行，operator 无法按文档收集 `verification_status / diagnostic_summary / next_action(s)`，新的读回链路会直接失效。
- 规范依据: 无直接 rule id；该项为基于公开命令契约与 `product-requirements-brief.md` §4.2 的风险推断。
- 建议: 将新增 readback section 改为只依赖受支持的公开 `connect` / `doctor` 链路与现有 diagnostics artifacts，避免把 removed command 重新包装成 adopter path。

### 2.2 [P2] New support-refresh guardrail required evidence from the same removed command
- 位置: `docs/support-matrix.md:157`、`docs/support-matrix.zh-CN.md:157`
- 问题描述: 新增 support-truth refresh note 要求请求方同时提供最新 `connect / doctor / verify` diagnostics artifact 路径，但公开 `verify` 命令已经删除，这使得 note 形成了一个无法满足的前置条件。
- 影响: 后续 support-truth refresh 请求即使已经具备完整的 `connect` / `doctor` 证据，也会因为一个不存在的公开命令前置条件而被误判为不完整。
- 规范依据: 无直接 rule id；该项为基于公开命令契约一致性的风险推断。
- 建议: 让 guardrail 只依赖受支持的公开 `connect` / `doctor` diagnostics artifacts；若问题仅出现在执行路径，再额外要求 `run --dry-run --trace` artifact。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1；main agent 已逐条复核并全部接受。
2. 本文件只收口 `CR-001` 的 accepted findings；sprint 是否 clean 仍取决于下一轮 fresh reviewer recheck。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）
4. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于复核 removed public command finding）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/main.ts` 将公开 `verify` 命令视为 removed，直接重放 `node ./dist/bin/repo-ai-governor.js verify --adapters --output json` 会返回 `ENTRYPOINT_COMMAND_WRAPPER_INVALID`。
   - 处理：已接受，修复为 playbook readback 只消费公开 `connect` / `doctor` diagnostics artifacts，并将执行路径问题改为可选补充 `run --dry-run --trace` artifact。
2. `2.2`
   - 判定：**认可**
   - 证据：新 guardrail 把 removed public command 当成 mandatory evidence source，会导致 support-truth refresh packet 出现无效前置条件。
   - 处理：已接受，修复为 support-refresh note 只依赖 `connect` / `doctor` diagnostics artifacts，并把执行路径 evidence 改成可选 `run --dry-run --trace` artifact；同时顺手纠正 support matrix 公共命令表中的 `connect` / `doctor` 公开 onboarding surface。

### 验证命令
1. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于证明 finding）
2. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
3. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`、`node ./dist/bin/repo-ai-governor.js doctor --adapters --output json`、`pnpm run check`
   - 说明：新增 readback section 不再要求公开 `verify`；当前只依赖 `connect` / `doctor` diagnostics artifacts，并把 execution-path evidence 限定为可选 `run --dry-run --trace` artifact。
2. `2.2`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`、`node ./dist/bin/repo-ai-governor.js doctor --adapters --output json`、`pnpm run check`
   - 说明：support-refresh guardrail 已去掉 removed public `verify` 前置条件，并将 public onboarding row 修正为 `connect` / `doctor`。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 accepted findings 已全部修复，并通过同窗 command-boundary replay、`pnpm run check` 与 governance sync checks 复验。
2. 支持矩阵中的若干历史 evidence rows 仍包含旧的 `verify --adapters` 文字痕迹；本轮未重新打开历史 evidence snapshot truth，只修复了当前 sprint 新增 guidance 中的错误公开命令链路。
3. `CR-001` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
