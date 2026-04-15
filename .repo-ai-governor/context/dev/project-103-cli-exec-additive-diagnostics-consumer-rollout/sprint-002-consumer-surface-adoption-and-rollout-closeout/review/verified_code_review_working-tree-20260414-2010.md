# Code Review: project-103 final working tree

- Status: verified
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-launch-diagnostics-projection-runtime.ts`
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
3. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
4. `apps/cli/src/commands/connect-command.ts`
5. `apps/cli/src/commands/doctor-command.ts`
6. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
7. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
8. `apps/cli/test/commands/connect-command.test.ts`
9. `apps/cli/test/commands/doctor-command.test.ts`
10. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
11. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md`
12. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/tasks/TK-876-finalize-project-103-closeout-and-delivery-evidence-handoff.md`
13. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/tasks/checklist.md`
14. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/tasks/tasks.csv`

## 2. Findings
### 2.1 [P3] Move the launch diagnostic code set out of runtime-local ownership
- 位置: `apps/cli/src/runtime/cli-launch-diagnostics-projection-runtime.ts:4`
- 问题描述: `CLI_EXEC_LAUNCH_DIAGNOSTIC_CODES` 作为 closed-set semantic surface 仍定义在 runtime 文件内，而不是 `apps/cli/src/constants`。
- 影响: 若 adapter-side code 集合演进，projector 可能静默失配，违反 `CS-009` 对 finite-set business values 的集中治理要求。
- 规范依据: `CS-009`
- 建议: 提取到 `apps/cli/src/constants` 下的专用常量模块，并让 runtime projector 从共享常量源读取。

### 2.2 [P3] Normalize TK-876 status across plan WBS and canonical closeout ledger
- 位置: `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md:42`、`.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/sprint-002-consumer-surface-adoption-and-rollout-closeout/plan.md:24`
- 问题描述: project/sprint WBS 仍显示 `TK-876` 为 `planned`，但 canonical task card 与 `tasks.csv` 已推进到 `in_progress`。
- 影响: project-final handoff 与 closeout 审计会看到互相冲突的状态面，增加收口时误判风险。
- 规范依据: 风险推断，无直接阻断性规则。
- 建议: 在 final closeout 前将 project/sprint WBS 中的 `TK-876` 状态对齐为 `in_progress`。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 3；main agent 已逐条复核并全部接受。
2. 除上述两项外，reviewer 未发现新的 runtime correctness 或 coverage blocking issue。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（已提供通过证据）
2. `pnpm run build`（已提供通过证据）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（已提供通过证据）
4. `pnpm run check`（已提供通过证据）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：该 code set 是新引入的有限闭集语义面，按 `CS-009` 应由 `src/constants` 集中持有。
   - 处理：已接受，下一步提取到 `apps/cli/src/constants` 并让 runtime projector 引用共享常量。
2. `2.2`
   - 判定：**认可**
   - 证据：当前 canonical `TK-876` 与 `tasks.csv` 均已在进行中，而 project/sprint WBS 仍停留在 `planned`。
   - 处理：已接受，下一步对齐 project/sprint WBS 状态并在同窗重跑 ledger/sync checks。

### 验证命令
1. accepted findings 修复后至少重跑：
   - `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run build`
   - `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-code-review-status-sync.js`
