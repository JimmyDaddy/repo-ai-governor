# Risk Facts And HITL SLA Contract

- Status: active
- Date: 2026-03-21
- Scope: policy/risk/HITL governance
- Owner: `project-008-workflow-optimization / TK-043`

## 1. Purpose

1. 统一高风险判定输入，避免策略分叉。
2. 统一 HITL 响应时限与超时行为，避免执行不确定性。

## 2. Risk Facts Schema (v1)

最小字段：

1. `risk_id`
2. `risk_category`
3. `risk_level`（`L1/L2/L3/L4`）
4. `evidence`
5. `change_scope`
6. `confidence`
7. `trigger_rule`

示例：

```json
{
  "risk_id": "risk-20260321-001",
  "risk_category": "ci-workflow-change",
  "risk_level": "L3",
  "evidence": ["changed: .github/workflows/release.yml"],
  "change_scope": "repo-wide-delivery",
  "confidence": 0.92,
  "trigger_rule": "high-risk-ci-workflow"
}
```

## 3. Risk Level -> Policy Action

1. `L1` -> `allow`
2. `L2` -> `confirm`
3. `L3` -> `escalate`
4. `L4` -> `block`

## 4. HITL SLA

1. `confirm`：4 小时内响应，超时默认 `block`。
2. `escalate`：2 小时内响应，超时默认 `block`。
3. `block`：仅人工明确解除后可继续执行。

## 5. High-Risk Baseline Categories

1. 依赖升级与锁文件大改。
2. 数据库迁移。
3. CI 工作流与发布链路修改。
4. 密钥、基础设施、生产配置改动。
5. 跨目录大规模重构与不可逆操作。

## 6. Audit Requirements

每个 HITL 事件至少记录：

1. 触发时间与触发规则。
2. 通知时间与通知渠道。
3. 人工结论与结论时间。
4. 超时与回退动作（若发生）。

## 7. Verification

1. 风险事实必须可结构化落盘并可回放。
2. 策略动作与 SLA 必须可由审计事件还原。
