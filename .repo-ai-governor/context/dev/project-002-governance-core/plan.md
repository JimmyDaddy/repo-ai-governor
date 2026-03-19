# project-002-governance-core 计划

- Status: planned
- Date: 2026-03-19
- Stage Mapping: Stage 2-3
- Phase Mapping: Phase A/B

## 1. 目标

1. 跑通流程编排与执行状态机（Sequential/Parallel/Loop/Condition）。
2. 交付 Memory/Session/Store 基线，支撑 Runtime 稳定读写。
3. 交付策略门禁与 HITL，且策略输入来自结构化规则资产。

## 2. 核心交付

1. DSL + Compiler IR v1。
2. `core-memory`、`core-session`、`memory-store-adapter`、`memory-providers/fs-csv`。
3. Change Risk Evaluator + Policy Gate Engine + Notification Dispatcher。
4. Standards 策略输入基线：`pack registry + policy rule compiler`。

## 3. 退出标准

1. 全流程可执行，跳步受限，重试/超时/取消可控。
2. 高风险路径可触发 `allow/confirm/block/escalate`。
3. 策略决策可追溯到结构化规则来源。
