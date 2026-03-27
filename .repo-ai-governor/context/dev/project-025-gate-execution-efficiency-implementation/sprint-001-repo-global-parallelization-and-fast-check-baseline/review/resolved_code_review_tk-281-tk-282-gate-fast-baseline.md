# Code Review: sprint-001 repo-global gate fast baseline

- Status: resolved
- Date: 2026-03-27
- Reviewer: AI-Agent
- Task: `TK-281,TK-282`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/plan.md`
  - `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/TK-281-repo-global-gate-build-dependency-decoupling-and-check-fast-baseline.md`
  - `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/TK-282-root-gate-runner-profile-split-and-observability-baseline.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/adrs/repo-global-package-heavy-gate-stratification.md`

## 1. Review Scope
1. `package.json`
2. `turbo.json`
3. `scripts/ci/run-gate-check.js`
4. `scripts/ci/gate-fast-complete.js`
5. `scripts/ci/run-repo-global-gates.js`
6. `biome.json`
7. `apps/cli/test/cli-output-contract.integration.test.ts`
8. `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/TK-281-repo-global-gate-build-dependency-decoupling-and-check-fast-baseline.md`
9. `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/TK-282-root-gate-runner-profile-split-and-observability-baseline.md`
10. `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/checklist.md`
11. `.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/tasks.csv`

## 2. Findings
### 2.1 [P1] `--output json` 不是纯 JSON 输出
- 位置: `scripts/ci/run-repo-global-gates.js:139`
- 问题描述: 脚本在解析到 `--output json` 后，仍然先通过 `console.info` 打印启动 banner，再打印 JSON summary。实际运行 `node ./scripts/ci/run-repo-global-gates.js --output json` 时，stdout 第一行是 `[repo-global-gates] Running ...`，因此下游如果直接按 JSON 解析 stdout 会立即失败。
- 影响: `TK-282` 标记为“支持 `--output json` 结构化输出”，但当前实现不能作为稳定的机器可读契约接入 CI 或其他自动化消费者，违背了 gate profile contract 对稳定机器可读输出的约束。
- 建议: 在 `json` 模式下禁止向 stdout 输出非 JSON 文本；若仍需保留启动日志，可改写到 stderr，或仅在非 JSON 模式打印 banner。

### 2.2 [P2] `affected` profile 仍未落地，TK-282 仅完成 fast/full split
- 位置: `scripts/ci/run-gate-check.js:61`
- 问题描述: `GATE_PROFILES` 目前只暴露 `full` 和 `fast`，`--profile affected` 会直接走 unknown profile 分支退出。与此同时，`TK-282` 任务目标仍写着“建立 `full / fast / affected` 的 root runner profile split”，而 `contract.governance.gate-execution-profile.v1` 也把 `affected` 列为正式 profile 集合的一部分。
- 影响: 当前 sprint 的 runner profile split 只能算部分完成；任何尝试按任务卡/contract 调用 `affected` profile 的路径都会失败，也会让 sprint 实现状态与任务台账产生预期偏差。
- 建议: 在本 sprint 内至少补一个受支持的 `affected` 入口或明确的占位实现；如果 `affected` 确认递延到 sprint-003，应同步收敛 `TK-282` 文案和执行记录，避免把未落地能力写成已交付范围。

## 3. Notes
1. `TK-281` 的 repo-global decoupling 与 `check:fast` baseline 已具备可运行证据：`check:fast`、`check:full`、`check` 都在当前工作树实跑通过。
2. `TK-282` 的 repo-global 并行 runner 已可执行，但当前更适合判定为“部分完成”：JSON 契约存在缺口，`affected` profile 尚未实现。
3. 本次 review 仅覆盖当前工作树与当前 sprint 相关变更；`project-026` 相关未跟踪草稿不在本次 CR 范围内。

## 4. Verification
1. `node ./scripts/ci/run-repo-global-gates.js --output json`（通过；但 stdout 前置 banner 使输出不满足纯 JSON 契约）
2. `pnpm run check:fast`（通过）
3. `pnpm run check:full`（通过）
4. `pnpm run check`（通过）

## 复核结论（2026-03-27）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1 [P1] --output json 不是纯 JSON 输出`
   - 判定：**认可**
   - 证据：`scripts/ci/run-repo-global-gates.js` 现按 `--output` 显式解析模式；当模式为 `json` 时，不再向 stdout 打印启动 banner 或人类可读摘要，只通过 `process.stdout.write()` 输出 JSON payload。
   - 处理：已修复，并复跑 `node ./scripts/ci/run-repo-global-gates.js --output json` 验证 stdout 可直接解析。
2. `2.2 [P2] affected profile 仍未落地，TK-282 仅完成 fast/full split`
   - 判定：**部分认可**
   - 证据：`project-025/plan.md` 与 `sprint-001/plan.md` 已明确 `affected` planner 的真实实现窗口在 `sprint-003 / TK-287`；问题在于 `TK-282` 与任务台账把当前 sprint 的交付边界写成了 `full / fast / affected`。当前 `scripts/ci/run-gate-check.js` 已为 `--profile affected` 返回显式 deferred 提示，不再把该 profile 误报为 unknown 或已支持。
   - 处理：已收敛 `TK-282`、`checklist.md` 与 `tasks.csv` 的 sprint-001 范围到 `full / fast + observability baseline`，并将 `affected` 明确保留到 `sprint-003 / TK-287`。

### 验证命令
1. `node ./scripts/ci/run-repo-global-gates.js --output json`（通过）
2. `node ./scripts/ci/run-gate-check.js --profile affected`（通过；按预期返回 deferred 提示）
3. `pnpm run test:integration -- test/gate-runner-output.integration.test.ts`（通过）
4. `pnpm run check:fast`（通过）
5. `pnpm run check:full`（通过）
6. `pnpm run check`（通过）

## 修复执行记录（2026-03-27）

1. `2.1 [P1] --output json 不是纯 JSON 输出`：已完成
   - 变更文件：`scripts/ci/run-repo-global-gates.js`、`test/gate-runner-output.integration.test.ts`
   - 验证：`node ./scripts/ci/run-repo-global-gates.js --output json`、`pnpm run test:integration -- test/gate-runner-output.integration.test.ts`（通过）
   - 说明：json 模式下 stdout 现只保留 JSON payload，机器消费者可直接解析。
2. `2.2 [P2] affected profile 仍未落地，TK-282 仅完成 fast/full split`：已完成
   - 变更文件：`scripts/ci/run-gate-check.js`、`.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/TK-282-root-gate-runner-profile-split-and-observability-baseline.md`、`.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/checklist.md`、`.repo-ai-governor/context/dev/project-025-gate-execution-efficiency-implementation/sprint-001-repo-global-parallelization-and-fast-check-baseline/tasks/tasks.csv`
   - 验证：`node ./scripts/ci/run-gate-check.js --profile affected`、`pnpm run check:full`、`pnpm run check`（通过）
   - 说明：当前 sprint 不再过度承诺 `affected` 能力，同时保留显式 deferred 边界与后续承接任务。
