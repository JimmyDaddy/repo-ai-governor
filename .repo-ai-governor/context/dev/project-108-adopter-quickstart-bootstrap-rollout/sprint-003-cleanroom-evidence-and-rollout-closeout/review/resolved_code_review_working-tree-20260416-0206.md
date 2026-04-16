# Code Review: project-108 final closeout round 3

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-003`
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
3. `apps/cli/src/commands/adopt-command.ts`
4. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`
6. `packages/shared/src/i18n/locales/en-us.ts`
7. `packages/shared/src/i18n/locales/zh-cn.ts`
8. `apps/cli/test/adopt-command.integration.test.ts`
9. `README.md`
10. `docs/local-adoption-playbook.md`
11. `docs/support-matrix.md`

## 2. Findings

### 2.1 [P1] Separate bootstrap doctor-stage diagnostics from the public doctor diagnostics channel

- 位置: `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts:483`
- 问题描述: `adopt bootstrap` 当前把 bootstrap 专属的 doctor-stage 预检产物写入 `context/diagnostics/doctor/doctor-*.json`，但公共 `doctor` surface 与 adopter-facing docs 都把该目录当作 canonical `verificationMatrix` / `next_action(s)` 读回入口。这样 bootstrap 成功后，最新的 `doctor` diagnostics 可能变成 bootstrap-local payload，而不是支持/运维流程预期读取的公共 `doctor` contract。
- 影响: operator 或后续 agent 可能读取到错误 schema 的“最新 doctor 诊断”，从而误判 public readiness verdict，破坏 `doctor` diagnostics 的 support-truth handoff。
- 建议: 将 bootstrap doctor-stage 产物迁移到 `context/diagnostics/adoption-bootstrap/` 等 bootstrap 专属目录，并同步收紧 CLI/help/docs 的 wording，使其不再把该产物误表述为公共 `doctor --fix` diagnostics。

## 3. Notes

1. fresh reviewer 未发现新的 selector defaulting、ambiguity fail-closed、rerun redirect 或 `check` broader follow-up 语义问题。
2. 当前 round 的 blocker 是 bootstrap diagnostics channel truthfulness；修复后需要补跑 `pnpm run build`、targeted integration test、clean-room helper 与 governance checks，再进入 fresh project-final recheck。

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
   - 证据：`adopt bootstrap` 当前把 bootstrap 专属 doctor-stage payload 写到 `context/diagnostics/doctor/doctor-*.json`，而 playbook/support/docs 继续把该目录说明为公共 `doctor` 诊断读回槽位。
   - 处理：将 bootstrap doctor-stage diagnostics 迁移到 `context/diagnostics/adoption-bootstrap/`，并同步更新 CLI JSON artifact 命名、help/docs wording 与 integration coverage，确保 bootstrap additive diagnostics 不再与公共 `doctor` contract 混槽。

### 验证命令

1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（待修复后复跑）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`、`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/src/commands/adopt-command.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`、`apps/cli/test/adopt-command.integration.test.ts`、`README.md`、`docs/local-adoption-playbook.md`、`docs/support-matrix.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`（通过）
   - 说明：已将 bootstrap doctor-stage diagnostics 迁移到 `context/diagnostics/adoption-bootstrap/doctor/`，公开 JSON artifact 改为 `bootstrap_doctor_diagnostics` / `bootstrap_doctor_diagnostics_path`，并把 bootstrap public wording 收紧为 bootstrap doctor preflight，避免与公共 `doctor` diagnostics contract 混槽。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已完成修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项；下一步进入 fresh project-final clean recheck，确认修复后没有新的 actionable drift。
