# Repository Long-Term Maintenance Guide

- Status: active
- Established: 2026-03-18
- Scope: `repo-ai-governor`

## Source Hierarchy

1. Normative rules: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` (`CS-001` to `CS-027`)
2. Operational baseline: this guide (`.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`)
3. Sprint execution records: `.repo-ai-governor/docs/dev/<project>/<sprint>/`
4. Release channel governance: `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`

This guide does not duplicate rule text from `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`. It defines how to run and sustain those rules over time.

## Agent Startup Baseline

1. Read `AGENTS.md`
2. Read `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. Read this guide
4. Read `.repo-ai-governor/context/current-context.md`

## Rule Set Mapping

1. Delivery quality baseline: `CS-001` to `CS-004`
2. ESM/TS boundary baseline: `CS-005` to `CS-008`
3. Constant and type governance baseline: `CS-009` to `CS-013`
4. Monorepo naming baseline: `CS-014`
5. Triad docs synchronization baseline: `CS-015`
6. Code readability and architecture style baseline: `CS-016` to `CS-020`
7. Task and sprint ledger synchronization baseline: `CS-021`
8. Standardized error usage baseline: `CS-022`
9. Artifact registry lifecycle baseline: `CS-023`
10. Layered test topology baseline: `CS-024`
11. Normative loading manifest baseline: `CS-025`
12. Code review lifecycle status synchronization baseline: `CS-026`
13. Anti-God-object and cross-layer ownership baseline: `CS-027`

For command-level enforcement, always use `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands` as the single source of truth.

## Pending Gate Integration Memo

1. Prepared scripts:
   - `scripts/governance/check-monorepo-naming.js`
   - `scripts/governance/check-package-dependency-boundary.js`（warning 模式已接入，blocking 待切换）
   - `scripts/governance/check-normative-loading-manifest.js`（由 runner 调用，默认 blocking）
2. Planned script:
   - `scripts/governance/check-monorepo-versioning-policy.js`
   - `scripts/governance/check-god-object-boundary.js`
3. Planned wiring target: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands`.
4. Current decision: 依赖边界检查保持 warning 模式运行并持续清零；规范加载清单检查已切换默认 blocking，并通过 rollback switch 提供应急回退。其余脚本维持 implementation-ready，待专门窗口激活。

## Normative Loading Gate Rollout Policy

1. 切换到 `block` 的条件：
   - manifest gate 在 `warn` 试运行窗口连续 2 个 sprint 为 0 issue；
   - active 规范文档全部完成 manifest 登记；
   - triad 文档状态保持 `active/frozen` 且一致。
2. 默认执行入口：
   - `node ./scripts/governance/run-normative-loading-manifest-gate.js`
3. 回滚开关（应急）：
   - 配置开关：`scripts/governance/normative-loading-gate.config.json -> rollbackSwitch.enabled=true`
   - 环境开关：`NORMATIVE_LOADING_GATE_ROLLBACK=1`
4. 强制模式覆盖（排障）：
   - `NORMATIVE_LOADING_GATE_FORCE_MODE=warn` 或 `NORMATIVE_LOADING_GATE_FORCE_MODE=block`
5. 回滚结束后，必须在同一变更窗口恢复默认 `block` 并补充原因记录。

## Daily and Release Cadence

1. Development baseline:
   - `pnpm run typecheck`
   - `pnpm run test:packages -- <target>`
   - `pnpm run test:integration -- <target>`
   - `pnpm run check`（默认低噪音，适合 AI 执行与常规快速验证）
   - `pnpm run check -- --verbose`（人工排障，全量日志）
2. Release baseline:
   - `pnpm run release:check`
   - `pnpm run ci:quality`
   - `pnpm run release:ga-check`

## Whitelist Governance Policy

1. `scripts/governance/ts-only-whitelist.json`
   - Allowed only for explicit compatibility constraints with reasoned entries.
2. `scripts/governance/literal-set-whitelist.json`
   - Target baseline is empty.
3. `scripts/governance/type-governance-whitelist.json`
   - Target baseline is empty.
4. `scripts/governance/utils-reuse-whitelist.json`
   - Target baseline is empty.
   - Reuse evaluation belongs in sprint `execution_notes.md` records.
5. `scripts/governance/jsdoc-governance-whitelist.json`
   - Records legacy exported APIs pending JSDoc backfill.
   - New or modified exports should avoid new whitelist entries whenever possible.
6. `scripts/governance/oop-structure-whitelist.json`
   - Records legacy OOP-structure exceptions (for example domain-level exported functions or temporary class co-location) pending migration.
   - Prefer class/service migration and class split first; whitelist only for compatibility windows.

Any non-empty entry must include task-level traceability in `tasks/checklist.md` and `tasks/tasks.csv`.

## Documentation Sync Rules

1. 仅当变更影响工具用户可见能力时，才同步更新 `README.md` 与 `README.zh-CN.md`；门禁与维护类内部治理细节应记录在治理文档与任务台账中。
2. Sprint-level execution changes must update `plan.md`, `tasks/checklist.md`, and `tasks/tasks.csv`.
3. Closure work must include a written closure report in the sprint docs.
4. Document date metadata must use `YYYY-MM-DD`; linked core docs should refresh dates in the same change window.
5. Changes to any triad doc under `.repo-ai-governor/normative_knowledge_sources/` (`product-requirements` / `overall-technical-solution` / `architecture-and-repo-layering`) must be synchronized in the same change set; PRD changes must sync `product-requirements-brief.md`.

## Project Closure Milestone Protocol

1. 每个 `project-xxx` 在状态切换为 `completed` 前，必须产出项目级完成态审计摘要文档：
   - 推荐命名：`project-xxx-completion-audit-summary.md`
   - 推荐路径：`.repo-ai-governor/context/dev/<project-xxx>/`
2. 审计摘要至少包含：
   - 完成结论（completed / blocked）
   - 审计范围（project + sprint）
   - 任务完成统计（基于 `tasks.csv` 最新记录）
   - 关键证据路径（plan/checklist/tasks.csv/review/artifact-registry）
   - 遗留风险与后续输入建议（如有）
3. 项目 `plan.md` 必须新增或更新“里程碑记录”入口，显式回链到该审计摘要文档。
4. 若项目后续重新打开（`completed -> active`），再次收尾时必须新增一条新的里程碑记录，禁止覆盖历史审计结论。

## Monthly Audit Checklist

1. Re-run `pnpm run check -- --verbose` and `pnpm run release:ga-check`.
2. Confirm whitelist files match expected baseline (empty or explicitly justified).
3. Re-check stability/coverage baselines if test topology changed.
4. Review `execution_notes.md` for util reuse records and unresolved debt.
5. Run `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run` then `node ./scripts/governance/compact-artifact-registry.js --dry-run`, and clear stale artifact lifecycle backlog.

## Ownership

1. Core: governance scripts, standards integration, task-ledger integrity
2. QA: stability and coverage baselines
3. Release: runtime JS boundary and release candidate gates
