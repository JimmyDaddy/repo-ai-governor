# Code Review: project-067 sprint-001 host lifecycle follow-up round 1

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `CR-001`
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

### 2.1 [P1] Host verifier was not wired into the automated GA release path

- 位置: `package.json`, `scripts/release/check-release-ready.js`, `scripts/release/render-release-notes.js`, `scripts/release/release-governance-policy.json`
- 问题描述: 新增的 `release:verify-host-distribution` 已被 maintainer/public support narrative 提升为正式 evidence surface，但 `release:candidate`、release-ready 资产/脚本校验、release notes 验证命令以及 release audit evidence policy 仍未消费它，导致 `pnpm run release:ga-check` 仍可在未覆盖这条 host follow-up surface 的情况下通过。
- 影响: release / GA closeout 可能在没有真实 host lifecycle evidence 的情况下宣称该正式支持边界已经被自动验证。
- 建议: 将 `release:verify-host-distribution` 纳入 `release:candidate`，同时把脚本/命令写入 release-ready required assets/scripts、release notes verification commands 与 release audit evidence policy。

### 2.2 [P2] Adopter examples pointed `--apply-to-repo` at the governor repo root

- 位置: `README.md`, `README.zh-CN.md`, `docs/local-adoption-playbook.md`, `docs/local-adoption-playbook.zh-CN.md`
- 问题描述: 文档明确把这条 host-native lifecycle 路径描述为“从已构建 governor 源码仓为目标仓库生成资产”，但示例仍使用 `--apply-to-repo .`。若用户按字面执行，就会把 AGENTS/skills/agents/MCP 资产写回 governor 仓库自身，而不是目标仓库。
- 影响: adopter 可能把 host-native assets 误投影到错误仓库，且与 repo-external caution narrative 形成冲突。
- 建议: 把示例改成显式的目标仓库绝对路径，并补一句说明这些命令应从 `<governor-repo>` 运行、`--apply-to-repo` 必须指向真正的 adopter repo root。

## 3. Notes

1. 当前没有额外的非阻断 residual risk。

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
   - 证据：`package.json` 里的 `release:candidate` 原先未包含 `release:verify-host-distribution`，`scripts/release/check-release-ready.js` 未要求新脚本/命令，`scripts/release/render-release-notes.js` 也未列出该验证命令；这与 maintainer/public narrative 已提升该命令为正式 evidence surface 的事实不一致。
   - 处理：已接受，补齐 automated release path、release-ready gate 与 release-notes verification commands，并补写 release audit evidence source。

2. `2.2`
   - 判定：**认可**
   - 证据：`README*` 与 `docs/local-adoption-playbook*` 把命令描述成“从已构建 governor 源码仓为目标仓库生成资产”，但示例仍写 `--apply-to-repo .`，会把投影文件写回 governor 仓库自身。
   - 处理：已接受，改成显式 `/absolute/path/to/<target-repo>`，并补充“命令从 `<governor-repo>` 运行、`--apply-to-repo` 指向 adopter repo root”的说明。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`package.json`、`scripts/release/check-release-ready.js`、`scripts/release/render-release-notes.js`、`scripts/release/release-governance-policy.json`
   - 验证：`pnpm run build`、`node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：已把 `release:verify-host-distribution` 纳入 `release:candidate`、release-ready required assets/scripts、release notes verification commands 与 release audit evidence policy，避免 host lifecycle support-truth 在 GA 路径中失联。

2. `2.2`：已完成
   - 变更文件：`README.md`、`README.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：示例已改为显式目标仓绝对路径，并补充“命令从 `<governor-repo>` 运行、`--apply-to-repo` 必须指向 adopter repo root”的约束说明。

## 处置结果与剩余风险（2026-04-08）

1. round 1 的 2 条 accepted finding 已全部修复并复验通过，`CR-001` 可收口为 `resolved`。
2. 当前 sprint 仍需发起一轮 fresh reviewer recheck；只有新 round clean 后，才能进入 sprint closeout。
