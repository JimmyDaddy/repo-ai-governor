# Memory Context Assembly Contract

- Status: active
- Date: 2026-03-27
- Contract ID: `contract.memory.context-assembly.v1`
- Producer Module: `runtime.memory-semantics`

## 1. 目标

定义 recall 结果如何显式裁剪、归因并注入 execution context，使 runtime 可以消费 prompt-safe / execution-safe 的 memory slice。

## 2. Minimum Fields

1. `execution_id`
2. `query_intent`
3. `selected_records`
4. `selection_summary`
5. `output_context`
6. `source_refs`
7. `provenance_summary`
8. `truncation_reason`
9. `safety_notes`
10. `assembly_outcome`

## 3. Behavioral Constraints

1. context assembly 必须是显式步骤，不得把 recall 结果隐式拼进模型上下文。
2. 注入结果必须保留 `source_refs` 或等价 provenance tracing，避免审计不可追溯。
3. assembly 允许使用 summary/projection，但不得把 canonical source 原文伪装成 memory-owned truth。
4. 敏感内容必须遵守 `sensitivity / visibility` 约束；不允许无标签透传。当前 baseline 至少必须对“缺失 sensitivity 标签”“命中禁止 sensitivity 标签”“显式 visibility 不允许 runtime 消费”执行 redaction 或 block，而不是仅写 `safety_notes`。
5. context assembly 可以组合 working-state summary，但不得因此把 working state 自动 promote 为长期记忆。

## 4. Consumers

1. `runtime.orchestration`

## 5. Compatibility

1. `v1` 只保证 selection / assembly / provenance / safety 的 machine-readable 字段稳定。
2. `v1` 不要求固定的 prompt renderer 形态；不同 host 可以在不破坏字段语义的前提下做 presentation 差异化。
