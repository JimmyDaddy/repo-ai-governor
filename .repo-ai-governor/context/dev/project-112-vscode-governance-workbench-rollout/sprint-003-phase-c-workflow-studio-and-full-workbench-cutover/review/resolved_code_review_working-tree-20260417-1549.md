# Code Review: project-112 final round 3

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: project final review
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks/`
4. `.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/review/`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
6. `apps/vscode-extension/README.md`
7. `apps/vscode-extension/package.json`

## 2. Findings

### 2.1 [P2] README still advertises the old companion MVP surface

- 位置: `apps/vscode-extension/README.md:9`, `apps/vscode-extension/README.md:15`, `apps/vscode-extension/README.md:55`, `apps/vscode-extension/README.md:94`
- 问题描述: `README.md` 仍把 VS Code surface 描述为 “editor companion MVP”、仅有早期四视图，并把 queue overview / automation / broader workbench surface 继续写成 desktop-only or later follow-up，即使当前 manifest 与 Phase B/C rollout 已经贡献 `reviewQueue`、`automationQueue`、`workbenchOverview` 与 `workflowStudio`。
- 影响: project-final closeout packet 会把 adopter-facing README truth 固定在过时的 surface baseline 上，导致 workbench contract、package manifest 与 public surface 文档发生漂移。
- 规范依据:
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md` Documentation Sync Rules `1`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/vscode-primary-full-governance-workbench.md` `§4`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md` Required Constraints `2` / `6`
- 建议: 将 `README.md` 更新到当前 Phase C baseline，明确 queue/workbench/workflow-studio 已进入 VS Code surface，但继续保留 `workbench_baseline_in_progress` 与 `foundation_only_secondary_surface` 的 public-support freeze，不提前写成 fully supported。

## 3. Notes

1. 除 README public-surface truth 漂移外，本轮未再发现阻止 `project-112` 进入 final closeout 的其他 actionable finding。

## 4. Verification

1. `pnpm run build`（baseline，已通过）
2. `pnpm run check`（baseline，已通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-112-vscode-governance-workbench-rollout/sprint-003-phase-c-workflow-studio-and-full-workbench-cutover/tasks --task-id TK-941`（baseline，已通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（baseline，已通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（baseline，已通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（baseline，已通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（baseline，已通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（baseline，已通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] README still advertises the old companion MVP surface`
   - 判定：**认可**
   - 证据：`apps/vscode-extension/package.json` 已贡献 `reviewQueue`、`automationQueue`、`workbenchOverview` 与 `workflowStudio`，而旧版 `README.md` 仍只描述 companion-era 四视图和 desktop-only queue/workbench 叙述。
   - 处理：接受该 finding，将 README 更新到当前 Phase C baseline surface，同时继续保留 `workbench_baseline_in_progress` 与 `foundation_only_secondary_surface` 的 public-support freeze。

### 验证命令
1. `pnpm run check`（修复后通过）
2. `pnpm run build`（同一 project-final change window baseline 已通过；本次修复仅更新 `apps/vscode-extension/README.md`，未修改 executable 或 typed surface，因此无需额外重跑）

## 修复执行记录（2026-04-17）

1. `2.1 [P2] README still advertises the old companion MVP surface`：已完成
   - 变更文件：`apps/vscode-extension/README.md`
   - 验证：`pnpm run check`（通过）；`pnpm run build`（沿用同一 project-final change window baseline，通过）
   - 说明：README 现在对齐了 review queue、automation queue、workbench overview 与 workflow studio 的当前 VS Code baseline，同时明确 public support 仍停留在 `workbench_baseline_in_progress`，不会提前宣称 fully supported。

## 处置结果与剩余风险

1. 已接受 finding 全部完成处理，`apps/vscode-extension/README.md` 现在与当前 manifest、surface contract 和 Phase C rollout baseline 对齐。
2. 当前 review scope 内未发现剩余阻止 `project-112` 进入 final closeout 的 actionable finding。
