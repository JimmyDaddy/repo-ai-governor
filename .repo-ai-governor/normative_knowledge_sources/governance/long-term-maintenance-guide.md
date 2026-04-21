# Repository Long-Term Maintenance Guide

- Status: active
- Established: 2026-03-18
- Scope: `repo-ai-governor`

## Source Hierarchy

1. Normative rules: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` (`CS-001` to `CS-034`)
2. Operational baseline: this guide (`.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`)
3. Sprint execution records: `.repo-ai-governor/docs/dev/<project>/<sprint>/`
4. Release channel governance: `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`

This guide does not duplicate rule text from `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`. It defines how to run and sustain those rules over time.

## Agent Startup Baseline

1. Read `AGENTS.md`.
2. Read `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`.
3. Read `.repo-ai-governor/context/current-context.md`.
4. Read every manifest entry that satisfies `tier=L0` and `default_load=true`, excluding files already read in steps 2-3.
5. Only when the task matches manifest `load_trigger`, escalate to `L1/L2`; do not default-load `L1/L2/L3`.

Current default startup baseline therefore resolves to:

1. `AGENTS.md`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

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
14. Worktree review target override baseline: `CS-028`
15. Technical solution module graph governance baseline: `CS-029`
16. Technical solution lifecycle and promotion governance baseline: `CS-030`
17. Technical solution delivery handoff governance baseline: `CS-031`
18. Magic literal extraction baseline: `CS-032`
19. User-facing i18n baseline: `CS-033`
20. Completion/build evidence baseline: `CS-034`

For command-level enforcement, always use `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands` as the single source of truth.

## Pending Gate Integration Memo

1. Implemented scripts:
   - `scripts/governance/check-package-dependency-boundary.js`（warning 模式已接入，blocking 待切换）
   - `scripts/governance/check-normative-loading-manifest.js`（由 runner 调用，默认 blocking）
   - `scripts/governance/check-technical-solution-module-graph.js`（默认 blocking）
   - `scripts/governance/check-technical-solution-lifecycle-registry.js`（默认 blocking）
   - `scripts/governance/check-technical-solution-delivery-registry.js`（默认 blocking）
2. Deferred checker implementations (rule defined, script not created yet):
   - `scripts/governance/check-monorepo-naming.js`
   - `scripts/governance/check-monorepo-versioning-policy.js`
   - `scripts/governance/check-god-object-boundary.js`
3. Planned wiring target: `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands`.
4. Current decision: 依赖边界检查保持 warning 模式运行并持续清零；规范加载清单检查、技术方案模块图检查、技术方案生命周期检查与技术方案 delivery handoff 检查已切换默认 blocking。monorepo naming / versioning policy / god-object boundary 的规则面保持有效，但在对应 checker script 真正落地前，文档不得再把它们描述为 prepared / implementation-ready gate assets。

## Normative Loading Gate Rollout Policy

1. 切换到 `block` 的条件：
   - manifest gate 在 `warn` 试运行窗口连续 2 个 sprint 为 0 issue；
   - active 规范文档全部完成 manifest 登记；
   - triad 文档状态保持 `active/frozen` 且一致。
2. 默认执行入口：
   - `node ./scripts/governance/run-normative-loading-manifest-gate.js`
   - `node ./scripts/governance/check-normative-loading-manifest-archive.js`
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

## Worktree Review Target Override Protocol

1. `Worktree Review Target` 是可选单值 override，默认不存在；只有“当前 worktree 的待收口 CR 仍归属于某个已 `completed` 的 stream”时才登记。
2. 任务台账、plan、checklist、tasks.csv 仍跟随 active stream；只有默认 CR 输出路径会优先解析到 `Worktree Review Target`。
3. 默认路由顺序固定为：用户显式指定的 report 路径 -> `Worktree Review Target` -> active primary stream `review/`。
4. 登记 override 时，必须同时记录 `Project`、`Sprint`、`Review records`、`Stream State=completed`、`Reason`、`Clear when`。
5. 一个 worktree 同一时刻最多只能保留一个 `Worktree Review Target`；其余 completed stream 若仍需 CR，必须显式指定 report 路径，或在前一个 target 收口后再切换。
6. 当目标 `review/` 目录下已不存在 `code_review_*` / `verified_code_review_*` 生命周期文件时，必须自动清除 `Worktree Review Target`；阻塞性 gate 应视残留 override 为失败。

## Completion Claim And Review Closure Build Protocol

1. 当同一变更窗口修改了 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下的可执行代码或 typed surface 时，任何最终对外结论写出“完成 / 全绿 / completed / resolved”都必须附带一次同窗口真实执行的 `pnpm run build` 结果。
2. targeted tests、局部 smoke、单项 gate 只能补强证据，不能替代 build evidence。
3. CR lifecycle 从 `verified -> resolved` 的修复闭环，只要涉及上述代码范围，也必须把 `pnpm run build` 记入验证命令后才能宣称 `resolved`。
4. docs-only、ledger-only 或纯规范文本变更可不跑 build，但 closeout 必须明确写明“未修改可执行代码，因此 build not required”。

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
   - 若 closeout 窗口包含代码变更，至少一条同窗口真实 `pnpm run build` 验证证据
3. 项目 `plan.md` 必须新增或更新“里程碑记录”入口，显式回链到该审计摘要文档。
4. 若项目后续重新打开（`completed -> active`），再次收尾时必须新增一条新的里程碑记录，禁止覆盖历史审计结论。

## Monthly Audit Checklist

1. Re-run `pnpm run check -- --verbose` and `pnpm run release:ga-check`.
2. Confirm whitelist files match expected baseline (empty or explicitly justified).
3. Re-check stability/coverage baselines if test topology changed.
4. Review `execution_notes.md` for util reuse records and unresolved debt.
5. Run `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run` then `node ./scripts/governance/compact-artifact-registry.js --dry-run`, and clear stale artifact lifecycle backlog.
6. Run `node ./scripts/governance/check-normative-loading-manifest-archive.js` then `node ./scripts/governance/compact-normative-loading-manifest.js --dry-run`, and clear overdue normative-loading deprecated backlog before it leaks into root manifest long-term.

## Ownership

1. Core: governance scripts, standards integration, task-ledger integrity
2. QA: stability and coverage baselines
3. Release: runtime JS boundary and release candidate gates
