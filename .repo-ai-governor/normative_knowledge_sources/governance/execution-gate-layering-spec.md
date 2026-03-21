# Execution Gate Layering Spec

- Status: active
- Date: 2026-03-21
- Scope: workflow execution governance
- Owner: `project-008-workflow-optimization / TK-040`

## 1. Purpose

1. 将开发快反馈与交付完整验证分层，减少等待时间并维持质量下限。
2. 明确 `Fast Gate` 与 `Release Gate` 的触发边界，避免误用。

## 2. Gate Definitions

### 2.1 Fast Gate

适用场景：

1. 日常开发自检。
2. 任务进行中的阶段性提交前检查。

命令基线：

```bash
pnpm run typecheck
pnpm run check
pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1
```

失败策略：

1. 任一命令失败即阻断当前任务推进，不得切换 `completed`。

### 2.2 Release Gate

适用场景：

1. 合并前。
2. 发布前。
3. 高风险变更（依赖升级、DB 迁移、CI/发布脚本、密钥/基础设施、大重构）。

命令基线：

1. 以 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md -> Verification Commands` 为唯一事实来源。

失败策略：

1. 任一命令失败即阻断交付。
2. 高风险变更若涉及 HITL，需在通过门禁后追加人工审批结论。

## 3. Trigger Matrix

| 场景 | Fast Gate | Release Gate |
|---|---|---|
| 任务开发中（本地） | 必须 | 可选 |
| 任务状态切换为 completed | 建议已通过 | 必须通过治理核验脚本 |
| 合并到主干 | 可选 | 必须 |
| 发布候选构建 | 可选 | 必须 |
| 高风险变更 | 可选 | 必须 + HITL |

## 4. Misuse Guardrails

1. Fast Gate 仅用于快反馈，不得替代 Release Gate。
2. 任何 `completed` 记录都必须有可回放验证证据。
3. 对门禁分层的变更必须在台账中记录回滚策略。

## 5. Rollback

1. 若发现分层导致质量漏检，立即临时切回“全链路 Release Gate”。
2. 回滚后 1 个工作日内补充根因与修复计划。
