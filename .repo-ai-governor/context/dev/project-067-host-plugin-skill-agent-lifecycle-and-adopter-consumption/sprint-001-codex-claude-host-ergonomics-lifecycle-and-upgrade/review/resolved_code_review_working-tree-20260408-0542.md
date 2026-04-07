# Code Review: project-067 sprint-001 host lifecycle follow-up round 2

- Status: resolved
- Date: 2026-04-08
- Reviewer: Planck delegated reviewer
- Task: `CR-002`
- Review Type: sprint boundary review
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

## 1. Review Scope

1. `scripts/release/verify-host-distribution.js`
2. `package.json`
3. `scripts/release/check-release-ready.js`
4. `scripts/release/render-release-notes.js`
5. `scripts/release/release-governance-policy.json`
6. `README.md`
7. `README.zh-CN.md`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `docs/maintainer-validation-playbook.md`
11. `docs/maintainer-validation-playbook.zh-CN.md`
12. `docs/support-matrix.md`
13. `docs/support-matrix.zh-CN.md`

## 2. Findings

### 2.1 [P1] `--working-root` cleanup is not confined to the dedicated temp subtree

- 位置: `scripts/release/verify-host-distribution.js:165`, `scripts/release/verify-host-distribution.js:410`
- 问题描述: 当前脚本接受任意 `--working-root` 输入，并在 entrypoint 中直接对解析后的绝对路径执行 `rmSync(..., { recursive: true, force: true })`。若误传 `.`、`..` 或其他越界路径，release 验证脚本就可能递归删除仓库根目录或父目录。
- 影响: 这是 release-script 边界上的破坏性删除风险，会把本应只清理 `.tmp/release-host-distribution-validation` 工作目录的脚本升级成“可删任意路径”的危险入口。
- 建议: 将 `--working-root` 限制为 `DEFAULT_WORKING_ROOT` 对应的受控 `.tmp` 子树，显式拒绝 repo root / ancestor / sibling / arbitrary absolute path，并补一条定向测试固定这一安全 contract。

## 3. Notes

1. reviewer round 2 未发现第二条 actionable finding。
2. reviewer 反馈其本轮复查中已再次观察到 `pnpm run build`、定向 host tests、`node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 为通过状态。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`parseCliOptions()` 在 `scripts/release/verify-host-distribution.js:165` 接受任意 `--working-root`，而 `main()` 在 `scripts/release/verify-host-distribution.js:410` 直接对解析后的绝对路径执行递归删除；当前缺少任何“必须位于受控 `.tmp` 子树内”的安全约束。
   - 处理：已接受，准备把 working-root 解析与清理逻辑限制到 `DEFAULT_WORKING_ROOT` 对应的 temp subtree，并增加定向测试覆盖越界路径拒绝场景。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-host-distribution.js`、`test/release-host-distribution-working-root.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：脚本现在只接受 `DEFAULT_WORKING_ROOT` 对应的受控 `.tmp/release-host-distribution-validation` 子树；repo root、父目录或任意越界路径会在递归删除前被拒绝。

## 处置结果与剩余风险（2026-04-08）

1. round 2 的 accepted finding 已修复并复验通过，`CR-002` 可收口为 `resolved`。
2. 当前 sprint 仍需继续发起下一轮 fresh reviewer；只有新 round clean，才能进入 sprint closeout。
