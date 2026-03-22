# Example: HITL Escalation Flow

## 输入

1. 已有可复现的高风险变更上下文（例如依赖升级、发布脚本变更、工作流变更）。
2. 需要验证策略动作中的 `confirm` / `escalate` 语义路径。
3. 允许生成 trace 诊断以便复盘人工闸口路径。

## 命令

```bash
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

## 预期输出

1. `run` 输出中可观察策略判定结果及风险依据。
2. 在高风险路径下，策略结果应进入 `confirm` 或 `escalate` 语义，而非静默放行。
3. `review` / `review-verify` 形成可追踪的人机协同审计链路。

## 排障

1. 若未触发 `confirm/escalate`，检查输入变更是否满足高风险判定条件。
2. 若策略依据不完整，优先查看 trace 产物中的 `policyDecision` 和 `riskReasons` 字段。
3. 若 review 链路中断，先确认 request 目录是否存在并且文件状态可被 verify 消费。

## 可执行资产

1. 机器可执行场景：`examples/hitl-escalation-flow/scenario.json`
2. 固定输入约束：`examples/hitl-escalation-flow/fixtures/input.md`
3. 运行基线断言：`examples/hitl-escalation-flow/expected/runtime-baseline.json`
