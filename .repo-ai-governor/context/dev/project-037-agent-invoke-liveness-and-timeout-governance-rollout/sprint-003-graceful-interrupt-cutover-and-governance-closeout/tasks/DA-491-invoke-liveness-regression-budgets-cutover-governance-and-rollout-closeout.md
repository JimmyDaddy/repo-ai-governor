# DA-491 invoke liveness regression budgets cutover governance and rollout closeout

- Date: 2026-04-03
- Owner: AI-Agent
- Task: `TK-491`
- Solution: `technical-solution.agent-invoke-liveness-and-timeout-governance`

## 1. 交付结论

`agent invoke liveness and timeout governance` 的 rollout 与 governance closeout 已完成：

1. 已冻结 route / role / surface 级 timeout budget matrix，并将 direct-answer、repository-review、remote-api、local-model 四类 baseline 明确写入 [invoke-liveness-budget-regression-and-closeout-baseline.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-003-graceful-interrupt-cutover-and-governance-closeout/invoke-liveness-budget-regression-and-closeout-baseline.md)。
2. 已将 regression matrix 明确回链到 `codex`、`claude-code`、`github-copilot`、`local-model`、orchestration、interactive shell、doctor/verify 的实际测试与 delivery evidence，不再依赖隐含口径。
3. 已收口 cutover / rollback boundary：`doctor/verify` 只承接 preflight 与 effective-budget truth，runtime stall / grace / hard-terminate 解释继续由 execution summary、event stream 与 execution details 承担。
4. `technical-solution-delivery-registry.yaml` 中 `technical-solution.agent-invoke-liveness-and-timeout-governance` 已切换为 `execution_status=completed`、`rollout_status=completed`，并将本 artifact 与 `project-037` completion audit summary 记为最终 rollout evidence。
5. `project-037` 已满足完成态前置条件：3 个 sprint 全部收口、task ledger 无未完成项、已 resolved reviews 全部闭环、并已产出项目级 completion audit summary。

## 2. 预算与回归真值

1. `cli_exec` direct-answer surfaces：
   - `codex` / `claude-code` / `github-copilot`
   - baseline timeout: `30000ms`
   - retry baseline: `2`
2. `session.main.role.reviewer` repository review：
   - `codex` / `claude-code` / `github-copilot`
   - baseline timeout: `600000ms`
   - 仍允许 `agentInvocationTimeoutMs` 覆盖
3. `remote_api` surfaces：
   - `codex` / `claude-code`
   - timeout: `remoteApi.requestTimeoutMs ?? 30000ms`
   - retry: `remoteApi.maxRetries ?? 2`
4. `local-model / ollama`：
   - timeout precedence: `localModel.requestTimeoutMs -> agentInvocationTimeoutMs -> stageTimeoutMs -> flowTimeoutMs -> 30000ms`
   - retry baseline: `localModel.maxRetries ?? 0`

## 3. 验证执行

执行命令：

```bash
/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js
/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js
/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js
/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-delivery-registry.js
PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run check
```

结果摘要：

1. `task ledger`、`sprint plan`、`code review lifecycle`、`technical-solution delivery registry` 全部通过。
2. `pnpm run check` 通过，说明 project-037 当前 closeout truth 与仓库总 gate 一致。
3. 当前 `sprint-003` 已无未解决 CR，`TK-487`、`TK-490`、`TK-491` 已全部完成。

## 4. Closeout Decision

1. `project-037-agent-invoke-liveness-and-timeout-governance-rollout` 可以切换为 `completed`。
2. `sprint-003-graceful-interrupt-cutover-and-governance-closeout` 可以切换为 `completed`。
3. `current-context` 可暂时保留 `project-037 / sprint-003` 作为 completed closeout surface，直到下一条 primary stream 被显式激活；这不影响 project/sprint/task 真值已经 completed。
