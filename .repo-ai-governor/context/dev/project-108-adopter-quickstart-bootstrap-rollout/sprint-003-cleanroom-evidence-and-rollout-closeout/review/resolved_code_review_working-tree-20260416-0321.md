# Code Review: project-108 final closeout round 7

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-007`
- Review Type: project-final working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`
8. `apps/cli/src/commands/adopt-command.ts`
9. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
10. `apps/cli/src/runtime/adoption-pack-runtime.ts`
11. `packages/shared/src/i18n/locales/en-us.ts`
12. `packages/shared/src/i18n/locales/zh-cn.ts`
13. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings

### 2.1 [P1] Clean-room bootstrap proof is not isolated to the target repo

- 位置: `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts:626`
- 问题描述: 当前 bootstrap clean-room baseline 在目标 repo 不是独立 git 仓时，会把 `repo_local` workspace 解析一路上溯到当前 governor 源码仓的 `.git` 边界，导致 `init-manifest`、bootstrap-doctor diagnostics 与 bootstrap summary 落在源码仓 `.repo-ai-governor/**`，而不是目标 repo 自己的 `.repo-ai-governor/**`。
- 影响: `node ./.tmp/project-108-bootstrap-cleanroom.mjs` 之后的 `pnpm run check` 需要人工清理副产物才能继续，当前 project-final clean-room 证据链不可稳定复跑，也不满足真正 target-repo-isolated 的 closeout 要求。
- 建议: 将 bootstrap 的 `repo_local` workspace 解析强制钉到显式目标 repo，并补齐 integration test 与 clean-room helper 断言，要求 bootstrap artifacts 只能写入目标 repo 的 `.repo-ai-governor/`。

## 3. Notes

1. fresh reviewer 额外实跑了 `pnpm run build`、targeted integration、clean-room helper 与 `pnpm run check`；前三条通过，`pnpm run check` 因 clean-room 产物泄漏回源码仓而失败。
2. 除该隔离问题外，本轮未再发现新的 CLI/docs/i18n truth drift 或 task-ledger lifecycle 漂移。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（失败：clean-room bootstrap 产物写回当前源码仓 `.repo-ai-governor/**`，触发 gate:format）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：clean-room summary 中 `repoRoot` 指向 `.tmp/project-108-cleanroom-*`，但 bootstrap artifacts 仍落在当前 governor 源码仓 `.repo-ai-governor/**`；随后 `pnpm run check` 被这些生成 JSON 拦下。
   - 处理：修正 bootstrap runtime 的 `repo_local` workspace 解析，使其锚定显式目标 repo，并补上 integration test / clean-room helper 的目标 repo 隔离断言。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`、`packages/config/src/workspace-resolver.ts`、`packages/config/src/types/interfaces/workspace.interface.ts`、`apps/cli/test/adopt-command.integration.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：bootstrap clean-room 目标仓库锚定修复已覆盖 runtime/config 解析边界；本轮最后修复了 `apps/cli/src/main.ts` 的编译回归，使 repo-aware workspace override 真正进入新构建的 `dist`，随后 clean-room helper 证明源码仓 `.repo-ai-governor/**` 未再产生泄漏副产物。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项，但按照 `workspace-scoped-cr-loop` 与用户串行 closeout 契约，project-final closeout 仍需先完成 fresh `CR-008` clean recheck。
