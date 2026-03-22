# Code Review: project-009 production-readiness working tree

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/index.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/index.md`
3. `.repo-ai-governor/context/dev/projects-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/**`

## 2. Findings
### 2.1 [P1] Stage 9 command收敛范围漏掉了 `doctor`
- 位置: `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md:149-165`
- 问题描述: Stage 1 已把 `doctor` 定义为正式 CLI 入口，当前 CLI 常量与 README 也仍然把它作为基线命令对外暴露；但新增的 Stage 9 只要求去 skeleton 化 `init/check/run/review/review-verify/plan/upgrade`，`TK-075` 也沿用了同一集合，而 `TK-077` 的 clean-room 验证只跑 `--help -> init/check/run`。这样会让“投产就绪/本地调试能力已收敛”在台账上看似完成，但一个已公开的诊断命令仍可能保持 skeleton，且不会被 clean-room/release smoke 覆盖到。
- 影响: 外部仓库用户按 README 或安装排障路径执行 `doctor` 时，仍可能只得到占位输出；这会直接削弱 Stage 9 想解决的本地采用、诊断和 GA 可用性信号。
- 建议: 把 `doctor` 补进 Stage 9、`project-009` WS-01、`TK-075` 和 `TK-077` 的命令收敛/clean-room 验证范围，并让 release smoke 一并覆盖。

### 2.2 [P2] `TK-075` 只引用了 `DA-086` 编号，没有回链到实际产物路径
- 位置: `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md:14-28`
- 问题描述: `TK-075` 的 `Depends On` 已声明消费 `DA-086`，但 `Input References` 只列了 project plan 和规范文档，没有把 `DA-086` 的实际承载文件 `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md` 加进来。仓库自己的消费规则要求 `Depends On` 与 `Input References` 优先引用 `DA-*`，而 `project-009` 计划也要求使用 `artifact_id + artifact_path` 双键回链；当前写法只保留了 artifact id，丢了 path 这一半。
- 影响: 后续执行 `TK-075` 的人需要自己再去反查 `DA-086` 的落点，容易遗漏 Stage 8 验收里已经沉淀的 rollout 约束，削弱跨项目交接的可追溯性。
- 建议: 在 `TK-075` 的 `Input References` 中显式加入 `DA-086` 的产物路径，并在 sprint-001 `Entry Criteria` 一并回链，保证新主执行流可以直接落到同一事实源。

## 3. Notes
1. `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-docs-triad-sync` 和 `run-normative-loading-manifest-gate` 均通过；这次问题主要是执行拆解和产物消费链路的遗漏，不是台账格式错误。
2. `doctor` 漏项的证据来自当前仓库既有 CLI 基线：`apps/cli/src/constants/cli-command.constant.ts` 仍公开 `doctor`，`apps/cli/README.md` 也仍把它作为对外命令。

## 4. Verification
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Stage 9 command收敛范围漏掉了 doctor`
   - 判定：**认可**
   - 证据：`apps/cli/src/constants/cli-command.constant.ts` 与 `apps/cli/README.md` 仍将 `doctor` 作为基线公开命令；`repo-ai-governor-master-execution-plan.md` 的 Stage 9、`project-009/plan.md` WS-01、`TK-075/TK-077` 文本范围确实未覆盖 `doctor`。
   - 处理：将 `doctor` 纳入 Stage 9、WS-01、TK-075 与 TK-077 的命令收敛及 clean-room 验证范围。
2. `2.2 [P2] TK-075 只引用 DA-086 编号，没有回链路径`
   - 判定：**认可**
   - 证据：`TK-075` 的 `Depends On` 存在 `DA-086`，但 `Input References` 未包含对应产物路径；`sprint-001/plan.md` Entry Criteria 同样只有 `DA-086` 编号，没有 `artifact_path`。
   - 处理：补齐 `DA-086` 对应产物路径到 `TK-075` 与 sprint-001 Entry Criteria，满足 `artifact_id + artifact_path` 双键回链。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（待修复后执行）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（待修复后执行）

## 修复执行记录（2026-03-22）

1. `2.1 [P1] Stage 9 command收敛范围漏掉了 doctor`：已完成
   - 变更文件：`.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`、`.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`、`.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`、`.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-local-installation-modes-and-cleanroom-validation.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`（通过），`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
   - 说明：`doctor` 已被纳入 Stage 9、WS-01、TK-075 命令收敛范围与 TK-077 clean-room 验证链路。
2. `2.2 [P2] TK-075 只引用 DA-086 编号，没有回链路径`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`、`.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`
   - 验证：`node ./scripts/governance/check-docs-triad-sync.js`（通过），`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
   - 说明：已补齐 `DA-086` 的 `artifact_path` 回链，确保 sprint 入口与任务执行入口可直接定位依赖产物。
