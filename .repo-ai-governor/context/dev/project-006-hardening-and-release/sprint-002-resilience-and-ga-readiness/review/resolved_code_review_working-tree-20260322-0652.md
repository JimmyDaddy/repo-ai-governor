# Code Review: working tree resilience and GA readiness baseline

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `package.json`
2. `turbo.json`
3. `scripts/ci/run-resilience-regression.js`
4. `scripts/release/check-release-ready.js`
5. `scripts/release/check-ga-candidate-unified-gate.js`
6. `scripts/release/run-rollback-rehearsal.js`
7. `scripts/release/release-governance-policy.json`
8. `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
9. `.repo-ai-governor/context/current-context.md`
10. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
11. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
12. `.repo-ai-governor/context/dev/project-006-hardening-and-release/project-006-hardening-and-release-completion-audit-summary.md`
13. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/plan.md`
14. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
15. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-and-recovery-playbook-baseline.md`
16. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-report.json`
17. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-baseline.md`
18. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-062-ga-candidate-unified-gate-report.json`
19. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-006-exit-acceptance-and-project-007-input-constraints.md`
20. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-063-project-007-input-constraints-checklist.md`
21. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/checklist.md`
22. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/tasks.csv`

## 2. Findings

### 2.1 [P1] `test:resilience` is declared but not actually wired into `pnpm run check`

- 位置: `package.json:73-75`; `turbo.json:68-105`
- 问题描述: 当前变更新增了 `gate:test:resilience`，并在 `TK-060/TK-063` 中把 `pnpm run check` 视为 resilience baseline 的验证证据，但 `turbo.json` 里并没有对应的 `//#gate:test:resilience` root task，也没有把它加入 `//#gate:check` 的依赖链。我用 `pnpm turbo run gate:check --dry=json | rg 'gate:test:resilience|gate:test:contract|gate:test:e2e'` 复核后，输出里只有 contract/e2e，没有 resilience。
- 影响: `pnpm run check` 当前不会执行新引入的 restricted-network/offline-degrade 回归，导致 `DA-072`、`DA-075` 以及 project-006 完成态审计里关于 resilience baseline 的“已纳入统一门禁”结论并不成立。
- 建议: 在 `turbo.json` 中补齐 `//#gate:test:resilience`，并把它加入 `//#gate:check`；必要时为它声明合适的 `dependsOn` 顺序，确保 `pnpm run check` 真正覆盖该回归入口。

### 2.2 [P2] Rollback rehearsal and GA unified gate do not emit failure reports

- 位置: `scripts/release/run-rollback-rehearsal.js:107-164`; `scripts/release/check-ga-candidate-unified-gate.js:100-128`
- 问题描述: 两个脚本都只在“全部场景/步骤成功”后才调用 `writeReport(...)`。一旦中途任一命令失败，控制流直接进入 `catch` 并退出，既不会保留已完成步骤的结果，也不会落盘失败态报告。我在一个临时最小仓库中执行 `node ./scripts/release/run-rollback-rehearsal.js --output rollback-report.json`，让首个场景失败后，得到的结果是 `EXIT:1` 且 `REPORT:missing`。
- 影响: 真正发生回滚演练失败或 GA 候选联合门禁失败时，最需要审计和回放证据的场景反而没有结构化报告，`TK-061-rollback-rehearsal-report.json` / `TK-062-ga-candidate-unified-gate-report.json` 只能记录成功路径，排障和人工升级会缺失关键信息。
- 建议: 在失败路径中也写出报告文件，至少包含 `status=failed`、失败的 `scenarioId/stepId`、已完成项、错误消息和时间戳；更稳妥的做法是用 `try/finally` 或在 `catch` 中补写 partial report。

## 3. Notes

1. 我复核了你贴出来的 `vitest.integration.config.ts` 线索；当前再跑 `pnpm exec vitest list --config vitest.integration.config.ts` 时，contract/e2e 用例已不再落入 integration 列表，所以这条 finding 在本轮工作树上没有复现。
2. 本轮主要聚焦新增 resilience / rollback / unified gate 脚本与 project 完成态治理台账之间的真实性和可回放性。
3. 除上述两项外，本次检查中未发现新的高优先级阻断问题。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `pnpm turbo run gate:check --dry=json | rg 'gate:test:resilience|gate:test:contract|gate:test:e2e'`（通过，确认 `gate:test:resilience` 未进入 `gate:check` 依赖链）
4. `pnpm exec vitest list --config vitest.integration.config.ts`（通过，用户提供的 integration/contract/e2e 重叠线索在当前工作树上未复现）
5. `tmpdir=$(mktemp -d) && mkdir -p "$tmpdir/repo" && ln -s <repo>/package.json "$tmpdir/repo/package.json" && ln -s <repo>/.release-it.json "$tmpdir/repo/.release-it.json" && ln -s <repo>/scripts "$tmpdir/repo/scripts" && ln -s <repo>/.repo-ai-governor "$tmpdir/repo/.repo-ai-governor" && cd "$tmpdir/repo" && node ./scripts/release/run-rollback-rehearsal.js --output rollback-report.json; rc=$?; echo EXIT:$rc; if [ -f rollback-report.json ]; then echo REPORT:present; else echo REPORT:missing; fi`（失败，确认失败路径不会生成结构化报告）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] test:resilience 未纳入 gate:check`
   - 判定：**认可**
   - 证据：`turbo.json` 已新增 `//#gate:test:resilience`，并在 `//#gate:check.dependsOn` 中接线；`pnpm turbo run gate:check --dry=json | rg 'gate:test:resilience|gate:test:contract|gate:test:e2e'` 输出已包含 `gate:test:resilience`。
   - 处理：已修复。
2. `2.2 [P2] rollback / ga gate 失败路径不落盘报告`
   - 判定：**认可**
   - 证据：`scripts/release/run-rollback-rehearsal.js` 与 `scripts/release/check-ga-candidate-unified-gate.js` 均已在失败路径落盘 report，且包含失败步骤/场景、已执行结果、错误消息与时间戳；失败注入验证均输出 `REPORT:present`。
   - 处理：已修复。

### 验证命令
1. `pnpm turbo run gate:check --dry=json | rg 'gate:test:resilience|gate:test:contract|gate:test:e2e'`（通过）
2. `tmpdir=$(mktemp -d) ... node ./scripts/release/run-rollback-rehearsal.js --output rollback-report.json ...`（通过，失败路径 `REPORT:present`）
3. `tmpdir=$(mktemp -d) ... node ./scripts/release/check-ga-candidate-unified-gate.js --output ga-report.json ...`（通过，失败路径 `REPORT:present`）

## 修复执行记录（2026-03-22）

1. `2.1 [P1] test:resilience 未纳入 gate:check`：已完成
   - 变更文件：`turbo.json`
   - 验证：`pnpm turbo run gate:check --dry=json | rg 'gate:test:resilience|gate:test:contract|gate:test:e2e'`（通过）
   - 说明：补齐 `//#gate:test:resilience` 任务并接入 `//#gate:check` 依赖链。
2. `2.2 [P2] rollback / ga gate 失败路径不落盘报告`：已完成
   - 变更文件：`scripts/release/run-rollback-rehearsal.js`、`scripts/release/check-ga-candidate-unified-gate.js`
   - 验证：`tmpdir=$(mktemp -d) ... node ./scripts/release/run-rollback-rehearsal.js --output rollback-report.json ...`（通过）；`tmpdir=$(mktemp -d) ... node ./scripts/release/check-ga-candidate-unified-gate.js --output ga-report.json ...`（通过）
   - 说明：失败分支补齐 report 落盘，包含失败项、已执行结果与错误信息，保证审计可回放。
