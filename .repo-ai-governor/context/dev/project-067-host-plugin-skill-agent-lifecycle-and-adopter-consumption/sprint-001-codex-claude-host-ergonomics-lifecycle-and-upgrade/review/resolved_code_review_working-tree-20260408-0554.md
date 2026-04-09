# Code Review: project-067 sprint-001 host lifecycle follow-up round 3

- Status: resolved
- Date: 2026-04-08
- Reviewer: Bernoulli delegated reviewer
- Task: `CR-003`
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`

## 1. Review Scope

1. `scripts/release/verify-host-distribution.js`
2. `test/release-host-distribution-working-root.integration.test.ts`
3. `package.json`
4. `scripts/release/check-release-ready.js`
5. `scripts/release/render-release-notes.js`
6. `scripts/release/release-governance-policy.json`
7. `README.md`
8. `README.zh-CN.md`
9. `docs/local-adoption-playbook.md`
10. `docs/local-adoption-playbook.zh-CN.md`
11. `docs/maintainer-validation-playbook.md`
12. `docs/maintainer-validation-playbook.zh-CN.md`
13. `docs/support-matrix.md`
14. `docs/support-matrix.zh-CN.md`

## 2. Findings

### 2.1 [P1] `release:ga-check` does not actually enforce the GA gate

- 位置: `package.json:144`, `scripts/release/check-release-ready.js:241`, `docs/maintainer-validation-playbook.md:157`, `docs/maintainer-validation-playbook.zh-CN.md:157`, `scripts/release/release-governance-policy.json:21`
- 问题描述: 当前 `release:ga-check` 只是 `pnpm run release:candidate` 的别名，导致 policy / playbook / spec 中作为 GA entry check 的 `release:ga-check` 实际没有执行 GA-only unified gate、rollback rehearsal 与 supporting evidence path，只覆盖了 RC 级别的 candidate chain。
- 影响: maintainer 按文档执行 `release:ga-check` 时，会误以为已经完成更宽的 GA 准入判断，但实际上绕开了 `.tmp/ci/release/ga-candidate-unified-gate-report.json` 与 GA-only gate group 的真正执行路径。
- 建议: 把对外 `release:ga-check` 接到 unified GA gate，并同时保留一个不递归的 internal release entry check 供 unified gate / rollback rehearsal 复用；`release:check` 也要显式校验这层 wiring，而不是只检查脚本名存在。

### 2.2 [P2] `release:notes` verification commands drift from policy-defined release flow

- 位置: `scripts/release/render-release-notes.js:156`, `scripts/release/release-governance-policy.json:11`, `scripts/release/release-governance-policy.json:16`, `scripts/release/release-governance-policy.json:21`, `scripts/release/release-governance-policy.json:54`, `scripts/release/release-governance-policy.json:63`
- 问题描述: release notes 里的 verification command 列表仍是手写硬编码，既漏掉 canary 的 `pnpm run test:contract`、RC 的 `pnpm run release:candidate`，也没有把 GA-only 的 unified gate / rollback rehearsal entry command 从 policy config 派生出来。
- 影响: maintainer-facing artifact 会低估正式 release contract，后续再改 policy 时也容易继续出现 notes 与真实 gate 分叉。
- 建议: 从 `channels[*].requiredChecks` 与 GA gate config（`rollbackRehearsal.entryCommand`、`gaCandidateUnifiedGate.entryCommand`）统一派生 release notes 的 verification command 列表。

## 3. Notes

1. reviewer 未报告第三条 actionable finding；当前 round 的问题集中在 release contract wiring 与 derived release notes consistency。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`package.json` 当前把 `release:ga-check` 直接指向 `release:candidate`，而 `release-governance-spec` / playbook / policy 都把它当成 GA entry check；这意味着 maintainer 入口与真正的 unified gate、rollback rehearsal、supporting report path 发生漂移。
   - 处理：已接受，准备把对外 `release:ga-check` 接到 unified gate，同时拆出内部 non-recursive entry check 供 unified gate / rollback rehearsal 复用，并让 `release:check` 对这层 wiring 做显式断言。

2. `2.2`
   - 判定：**认可**
   - 证据：`render-release-notes.js` 的 verification command 列表是硬编码常量，没有从 `channels[*].requiredChecks`、`rollbackRehearsal.entryCommand`、`gaCandidateUnifiedGate.entryCommand` 派生，因此与 policy config 中的正式 release flow 已经分叉。
   - 处理：已接受，准备改成由 policy + GA gate config 统一派生 release notes command list，避免 notes 再次落后于真实 gate。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`package.json`、`scripts/release/check-ga-candidate-unified-gate.js`、`scripts/release/run-rollback-rehearsal.js`、`scripts/release/check-release-ready.js`、`test/release-governance-wiring.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:check`、`pnpm run release:ga-check`（最后一条未通过，失败原因为当前 repo 既有的 repo-wide typecheck 问题，不是本 round wiring 回归）
   - 说明：对外 `release:ga-check` 现在接入 unified gate，内部新增 `release:ga-entry-check` 供 unified gate / rollback rehearsal 复用，避免 maintainer 入口继续停留在 RC-only chain，也避免统一门禁与回滚演练递归调用。

2. `2.2`：已完成
   - 变更文件：`scripts/release/render-release-notes.js`、`test/release-governance-wiring.integration.test.ts`
   - 验证：`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:notes -- --output .tmp/project-067-release-notes.md`（通过）
   - 说明：release notes 的 verification commands 现在由 `channels[*].requiredChecks`、`rollbackRehearsal.entryCommand` 与 `gaCandidateUnifiedGate.entryCommand` 统一派生，不再维护硬编码平行清单。

## 处置结果与剩余风险（2026-04-08）

1. round 3 的 2 条 accepted finding 已完成修复，`CR-003` 可收口为 `resolved`。
2. `pnpm run release:ga-check` 已按新 wiring 进入 unified gate，但在 `release:ga-entry-check -> ci:quality -> typecheck` 段被当前 repo 既有的跨模块类型错误阻断；该失败超出本 round review surface，已作为额外验证风险如实记录，未宣称通过。
3. 当前 sprint 仍需继续发起下一轮 fresh reviewer；只有新 round clean，才能进入 sprint closeout。
