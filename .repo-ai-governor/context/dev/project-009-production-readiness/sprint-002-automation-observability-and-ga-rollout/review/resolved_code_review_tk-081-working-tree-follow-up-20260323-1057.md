# Code Review: TK-081 working tree follow-up

- Status: resolved
- Date: 2026-03-23
- Reviewer: AI-Agent
- Task: `TK-081`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `package.json`
2. `scripts/release/verify-cleanroom-local-install.js`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-089-local-installation-modes-and-cleanroom-validation.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-081-release-distribution-model-and-runtime-resolvable-packaging.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/DA-093-release-distribution-model-and-runtime-resolvable-packaging.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/review/review_tk-081-release-distribution-model-and-runtime-resolvable-packaging.md`

## 2. Findings

### 2.1 [P1] clean-room 默认报告路径仍写回 sprint-001 历史产物

- 位置: `scripts/release/verify-cleanroom-local-install.js:20`
- 问题描述: `DEFAULT_REPORT_PATH` 仍硬编码到 sprint-001 的 `TK-077-cleanroom-validation-report.json`，`parseCliOptions()` 也默认沿用该路径；同时 `package.json` 的 `release:verify-cleanroom-local-install` 裸入口没有传 `--output`。这轮 working tree 已经把同一个 sprint-001 报告从 2026-03-22 的 tgz 失败证据改写成 2026-03-23 的 tgz 通过证据，而 `DA-089` 仍把该文件定义为 sprint-001 Stage 9A/9B 基线报告。
- 影响: 任何后续直接复用默认脚本的 clean-room/release 验证都会继续覆盖已关闭 sprint 的历史证据，导致审计轨迹、任务台账和发布结论随重跑漂移，破坏“历史产物可回放、可核对”的治理前提。
- 建议: 移除 sprint 级硬编码默认路径，改为强制要求显式 `--output`，或按 active sprint / release temp 目录生成新报告；同时把 `TK-077` 报告视为冻结历史证据，不再由 sprint-002 的 tgz 验证回写。

## 3. Notes

1. 用户指出的 “README.zh-CN 没有说明如何接入 Codex / Claude Code / GitHub Copilot” 已在 `docs/local-adoption-playbook.zh-CN.md` 的 `3.1 多 AI 工具接入` 补齐；当前更像 README 可发现性不足，而不是本轮变更完全遗漏该能力说明。
2. 当前 pending review 文件 `review_tk-081-release-distribution-model-and-runtime-resolvable-packaging.md` 仍写着“未发现阻断交付的剩余问题”，与本轮发现不一致，后续复核时应一并校正。

## 4. Verification

1. `git status --short`（通过）
2. `git diff -- README.zh-CN.md docs/local-adoption-playbook.zh-CN.md scripts/release/verify-cleanroom-local-install.js .repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json .repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/tasks.csv .repo-ai-governor/context/dev/project-009-production-readiness/sprint-002-automation-observability-and-ga-rollout/tasks/TK-081-release-distribution-model-and-runtime-resolvable-packaging.md`（通过）
3. `node ./dist/bin/repo-ai-governor.js run --output json --dry-run --trace`（失败：命中 `POLICY_GATE_HITL_FEEDBACK_INVALID`，本轮仅用于核对 trace/输出契约）
4. `pnpm run check`（未执行）
5. `pnpm run release:verify-cleanroom-local-install`（未执行；避免再次改写 sprint-001 报告）

## 复核结论（2026-03-23）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] clean-room 默认报告路径仍写回 sprint-001 历史产物`
   - 判定：**认可**
   - 证据：`scripts/release/verify-cleanroom-local-install.js` 中 `DEFAULT_REPORT_PATH` 已改为系统临时目录绝对路径；执行 `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1` 后日志显示报告写入 `/var/.../repo-ai-governor-cleanroom-validation-report.json`，未再回写 sprint-001。
   - 处理：完成修复，并将已被误写的 `TK-077-cleanroom-validation-report.json` 恢复为仓库基线内容。

### 验证命令

1. `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1`（通过）
2. `git diff -- .repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`（通过，无差异）

## 修复执行记录（2026-03-23）

1. `2.1 [P1] clean-room 默认报告路径仍写回 sprint-001 历史产物`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`
   - 验证：`node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1`（通过）；`git diff -- .repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`（通过）
   - 说明：默认报告写入目标改为系统临时目录，避免历史审计证据被后续运行覆盖。
