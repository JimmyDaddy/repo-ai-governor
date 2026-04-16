# Code Review: project-108 final closeout round 4

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: project-final working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/`
3. `README.md`
4. `README.zh-CN.md`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`
7. `docs/support-matrix.md`
8. `docs/support-matrix.zh-CN.md`
9. `apps/cli/src/commands/adopt-command.ts`
10. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
11. `apps/cli/src/runtime/adoption-pack-runtime.ts`
12. `packages/shared/src/i18n/locales/en-us.ts`
13. `packages/shared/src/i18n/locales/zh-cn.ts`
14. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings

### 2.1 [P2] Chinese adopter docs still describe the old default installer path

- 位置: `README.zh-CN.md:21`
- 问题描述: 英文 quickstart 已将 `adopt bootstrap` 固化为默认 adopter 安装路径，并同步声明 bootstrap doctor preflight、selector fail-closed、rerun redirect 与 `check` broader follow-up；但中文 README / playbook / support matrix 仍把 `adopt apply` 当作默认入口，导致中英文 support truth 漂移。
- 影响: 中文 adopter 可能直接跳过 bootstrap preflight/check quickstart，沿着旧 installer story 进入过时路径，违反 user-visible docs sync 基线。
- 建议: 同步 `README.zh-CN.md`、`docs/local-adoption-playbook.zh-CN.md` 与 `docs/support-matrix.zh-CN.md` 到当前 bootstrap contract，并保留 `adopt apply` 作为 bootstrap 之下的显式 lifecycle/follow-up surface。

## 3. Notes

1. fresh reviewer 未发现新的 code/runtime/actionable drift；当前仅剩 locale-specific adopter docs truthfulness 问题。
2. 修复后需要做一次 docs-closeout 复验，并继续进入 fresh project-final round 5 clean recheck。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：英文 README / playbook / support matrix 已把 `adopt bootstrap` 固化为默认 quickstart，并明确保留 `check` 为显式 broader governance follow-up；中文文档对应段落仍把 `adopt apply` 写成默认安装路径，形成公开 support truth 漂移。
   - 处理：同步 `README.zh-CN.md`、`docs/local-adoption-playbook.zh-CN.md` 与 `docs/support-matrix.zh-CN.md` 到当前 bootstrap contract，保留 `adopt apply` 作为显式 lower-level install surface，而不是默认 installer story。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（待推进 verified 后复跑）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待推进 verified 后复跑）
3. `node ./scripts/governance/check-code-review-status-sync.js`（待推进 verified 后复跑）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`README.zh-CN.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`（通过）
   - 说明：已把中文 README / adoption playbook / support matrix 同步到 `adopt bootstrap` quickstart contract，明确 omitted selector 默认到官方 built-in pack、`check` 是显式 broader governance follow-up，并保留 `adopt apply` 作为 lower-level install surface 而不是默认 installer story。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已完成修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项；下一步进入 fresh project-final clean recheck，确认中文 docs truth sync 后没有新的 actionable drift。
