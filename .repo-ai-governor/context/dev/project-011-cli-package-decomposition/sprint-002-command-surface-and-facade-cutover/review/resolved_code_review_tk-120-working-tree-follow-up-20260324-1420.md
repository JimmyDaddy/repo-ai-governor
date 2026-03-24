# Code Review: TK-120 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-120`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
  - `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-116-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/plan.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-120-command-executor-extraction-and-entry-registry-baseline.md`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/tasks.csv`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-118-command-executor-extraction-and-entry-registry-baseline.md`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/review/resolved_code_review_tk-120-command-executor-extraction-and-entry-registry-baseline.md`
9. `apps/cli/src/cli-governance-runtime.ts`
10. `apps/cli/src/commands/cli-command-executor.interface.ts`
11. `apps/cli/src/commands/cli-command-registry.ts`
12. `apps/cli/src/commands/init-command.ts`
13. `apps/cli/src/commands/connect-command.ts`
14. `apps/cli/src/commands/doctor-command.ts`
15. `apps/cli/src/commands/check-command.ts`
16. `apps/cli/src/commands/verify-command.ts`
17. `apps/cli/src/commands/plan-command.ts`
18. `apps/cli/src/commands/upgrade-command.ts`
19. `apps/cli/src/types/index.ts`
20. `apps/cli/src/types/interfaces/index.ts`
21. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
22. `apps/cli/test/commands/cli-command-registry.test.ts`
23. `apps/cli/test/cli-governance-runtime.integration.test.ts`

## 2. Findings

### 2.1 [P2] `CliCommandRegistry` 会静默覆盖重复的 `commandName`

- 位置: `apps/cli/src/commands/cli-command-registry.ts:10`
- 问题描述: registry constructor 只是把 executor 逐个 `Map.set()` 进去，没有对重复 `commandName` 做任何保护。`TK-121` 会继续往同一个 registry 里追加高复杂度命令；一旦后续 executor 因 copy/paste 或 merge 错误复用了已有 `commandName`，旧实现会被静默遮蔽，facade 仍然成功启动，但对应 CLI 命令已经被错误路由到另一份 executor。
- 影响: command surface 的 single-dispatch contract 会在最核心的 registry 层失真，而且这种错误不会有启动期信号；只有碰到被遮蔽命令时才会暴露。
- 建议: 在 registry constructor 中检测重复 `commandName` 并直接抛错，同时补一条 duplicate-registration 单测。

### 2.2 [P2] 抽离后的命令分发覆盖面仍不足以支撑 “dispatch 已稳定” 的结论

- 位置: `apps/cli/test/commands/cli-command-registry.test.ts:5`
- 问题描述: 新增测试只校验了 `INIT` / `CHECK` 两个 happy-path lookup；当前 integration suite 虽然覆盖了 `CONNECT` / `DOCTOR` / `VERIFY`，但仓库内没有任何测试通过 `CliGovernanceRuntime.execute()` 触达抽离后的 `init/check/plan/upgrade` 全量 dispatch 路径。我复核了 `apps/cli/test` 中对 `CliCommandName.(INIT|CHECK|PLAN|UPGRADE)` 的引用，除 registry smoke test 外没有实际执行覆盖，因此 `DA-118` 和已提交 resolved review 中“facade dispatch 已完成回归验证”的表述偏乐观。
- 影响: 这轮 cutover 的关键风险不是实现能否编译，而是 registry 列表、shared context 和 facade 分发是否持续对齐；当前覆盖面不足会让 `PLAN/UPGRADE` 这类低频命令在后续 `TK-121` 扩展 registry 时出现回归却仍然保持绿灯。
- 建议: 至少补一组 table-driven 断言，验证所有 extracted commands 都已注册；再补 `runtime.execute()` 级别的 `init/check/plan/upgrade` smoke coverage，把 “registry lookup + facade dispatch + shared context” 一起锁住。

## 3. Notes

1. 我复跑的类型检查、integration/package tests 和治理门禁目前全部通过，所以这轮风险主要集中在 registry 基线的防呆约束与覆盖完整性，而不是已观测到的运行时失败。
2. working tree 中现有的 `resolved_code_review_tk-120-command-executor-extraction-and-entry-registry-baseline.md` 建议在处理上述两点后再做复核结论更新。

## 4. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/commands/cli-command-registry.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
8. `pnpm run check`（通过）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/commands/cli-command-registry.ts` 原先只做 `Map.set()`，确实会静默覆盖重复的 `commandName`。
   - 处理：已补 duplicate registration 检测，命中时直接抛出 `RuntimeError`。
2. `2.2`
   - 判定：**认可**
   - 证据：原有 `apps/cli/test/commands/cli-command-registry.test.ts` 只覆盖 `INIT/CHECK` 两个 lookup，`CliGovernanceRuntime.execute()` 对 `INIT/CHECK/PLAN/UPGRADE` 的 facade dispatch 也没有 smoke coverage。
   - 处理：已补齐 extracted commands 全量注册断言、duplicate guard 单测，以及 `runtime.execute()` 对 `init/check/plan/upgrade` 的 dispatch smoke。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
8. `pnpm run check`（通过）

## 修复执行记录（2026-03-24）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/cli-command-registry.ts`、`apps/cli/test/commands/cli-command-registry.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：registry 现在会在 constructor 阶段拒绝重复 `commandName` 注册。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/commands/cli-command-registry.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：已新增 extracted commands 全量注册断言，以及 `init/check/plan/upgrade` 的 facade dispatch smoke。
