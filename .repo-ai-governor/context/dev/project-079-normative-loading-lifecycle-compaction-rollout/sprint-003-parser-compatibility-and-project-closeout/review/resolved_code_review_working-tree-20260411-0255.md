# Code Review: sprint-003 parser compatibility and closeout boundary

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-normative-loading/contracts/normative-loading-lifecycle-contract.md`

## 1. Review Scope

1. `scripts/governance/normative-loading-manifest-canonical.js`
2. `test/normative-loading-manifest-lifecycle.integration.test.ts`
3. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
4. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
5. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md`
6. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/TK-755-finalize-parser-and-gate-compatibility-plus-rollback-guidance.md`
7. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/TK-756-run-governance-closeout-and-migration-evidence-refresh.md`
8. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-755-parser-and-gate-compatibility-plus-rollback-guidance-baseline.md`
9. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/DA-756-governance-closeout-and-migration-evidence-refresh-packet.md`
10. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/checklist.md`
11. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/tasks.csv`

## 2. Findings

### 2.1 [P1] `CR-001` 未同步进入 sprint ledger

- 位置: `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/tasks/CR-001.md:24`
- 问题描述: 当前已生成 `CR-001` 任务卡，但 `tasks/checklist.md` 与 `tasks/tasks.csv` 里还没有对应 `CR-001` 记录，`check-task-ledger-sync` 会直接失败为 `[primary] CR-001: missing row in tasks.csv`。
- 影响: 评审生命周期脱离 canonical `TK/CR -> sqlite -> checklist/tasks.csv` 写回链路，后续 `verified/resolved` 推进与 sprint closeout evidence 会发生漂移。
- 建议: 先把 `CR-001` 以 `review_pending` 写回 canonical ledger 与 rendered views，再继续当前 review lifecycle。

### 2.2 [P2] 绝对路径 archive compatibility 仍然依赖调用方 cwd

- 位置: `scripts/governance/normative-loading-manifest-canonical.js:318`
- 问题描述: `expectedRootManifestPathValue` 仍然来自 `process.cwd()` 相对路径，只是先做了 realpath 归一化；这修掉了 `/var` 与 `/private/var` 别名，但没有让显式 `--root-manifest/--archive-manifest` 绝对路径调用真正摆脱 cwd 依赖。
- 影响: 从外部目录调用 archive check 仍可能误报，而 `compact-normative-loading-manifest.js --apply` 也可能把一个 cwd-relative 的 `root_manifest_path` 回写进 archive manifest，和当前“absolute CLI path compatibility”叙述不一致。
- 建议: 将 canonical `root_manifest_path` 的期望值锚定到 manifest contract / bootstrap path，而不是当前 shell cwd，并补一条 external-cwd archive-check + compaction-apply 回归测试。

## 3. Notes

1. reviewer 未发现 review surface 内其他新的 actionable finding。
2. 无关脏改未纳入本轮评审范围。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
5. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（失败：`[primary] CR-001: missing row in tasks.csv`）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-04-11）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] CR-001 未同步进入 sprint ledger`
   - 判定：**认可**
   - 证据：`CR-001` 任务卡已生成但最初没有进入 `tasks/checklist.md` 与 `tasks/tasks.csv`；同步后 `check-task-ledger-sync.js` 已恢复通过。
   - 处理：已将 `CR-001` 以 `review_pending` 写回 canonical ledger，并纳入当前 closeout repair list。

2. `2.2 [P2] 绝对路径 archive compatibility 仍然依赖调用方 cwd`
   - 判定：**认可**
   - 证据：`expectedRootManifestPathValue` 原先仍取自 `process.cwd()` 相对值；现已改为优先锚定 canonical bootstrap path，并补 external-cwd archive-check / compaction-apply 回归。
   - 处理：已在同窗口修正实现与测试，纳入当前 closeout repair list。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
5. `node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-11）

1. `2.1 [P1] CR-001 未同步进入 sprint ledger`：已完成
   - 变更文件：`CR-001.md`、`tasks/checklist.md`、`tasks/tasks.csv`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`（通过）
   - 说明：已把 `CR-001` 的 `review_pending -> verified` 生命周期写回 canonical ledger 与 rendered views。

2. `2.2 [P2] 绝对路径 archive compatibility 仍然依赖调用方 cwd`：已完成
   - 变更文件：`scripts/governance/normative-loading-manifest-canonical.js`、`test/normative-loading-manifest-lifecycle.integration.test.ts`、`TK-755-finalize-parser-and-gate-compatibility-plus-rollback-guidance.md`、`DA-755-parser-and-gate-compatibility-plus-rollback-guidance-baseline.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/run-normative-loading-manifest-gate.js`、`node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（均通过）
   - 说明：`root_manifest_path` 的期望值已优先锚定 canonical bootstrap path，并补 external-cwd archive-check / compaction-apply 回归，operator 路径与 closeout 证据现已一致。
