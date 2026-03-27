# TK-302 GA Readiness §10.2 全量量化证据沉淀

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-004-ga-evidence-and-support-matrix`

## 1. 任务目标

逐条对照 PRD §10.2 的 11 项 GA Readiness 量化信号，为每项沉淀可追溯的证据链，形成 GA 证据文档。

## 2. Depends On

1. `TK-300`（sprint-003 出口验收已通过）
2. `TK-301`（支持矩阵已发布，为 #10 提供直接证据）

## 3. 预期产物

1. `docs/ga-readiness-evidence.md` — GA Readiness §10.2 全量量化证据文档（英文）
2. `docs/ga-readiness-evidence.zh-CN.md` — GA Readiness §10.2 全量量化证据文档（中文）

## 4. §10.2 逐条证据采集计划

| # | 要求 | 证据来源 | 采集方式 |
|---|------|---------|---------|
| #1 | ≥2 个试点仓库完成接入，≤15 min | project-020 双仓库 adopter pilot 记录 | 引用 project-020 sprint-004 验收产物 |
| #2 | clean-room 两种安装模式各连续 3 次通过 | `scripts/release/verify-local-distribution.js` | 执行脚本并记录 3 次通过记录 |
| #3 | 黑盒路径矩阵 100% 通过 | `test/e2e/` E2E 测试 | 执行 `pnpm run test:e2e` 并截取结果 |
| #4 | ≥1 条无人值守链路连续 3 次 rehearsal 通过 | delivery-rehearsal-runtime 执行 | 执行 rehearsal 脚本并记录 3 次 |
| #5 | 试点期失败事件全部结构化归因 | 审计事件 JSON 日志 | 引用 audit recorder 结构化输出样本 |
| #6 | workspace 切换 clean-room 路径通过 | workspace 集成测试 | 执行 workspace 相关测试并记录 |
| #7 | ≥1 组外部消费契约黑盒矩阵通过 | `test/public-package-exports.integration.test.ts` + contract 测试 | 执行并截取结果 |
| #8 | ≥1 主 1 备 HITL 通知渠道 rehearsal 通过 | sprint-001 TK-292 rehearsal 证据 | 引用 `hitl-notification-rehearsal-evidence.md` |
| #9 | ≥1 条受控 delivery rehearsal 通过 | delivery-rehearsal-runtime 记录 | 引用或执行 rehearsal |
| #10 | 已声明最小支持矩阵 + clean-room smoke 记录 | TK-301 产物 | 引用 `docs/support-matrix.md` |
| #11 | 运营指标快照 | 测试覆盖率、构建时间、gate 通过率 | 执行 `pnpm run test:coverage` + `pnpm run check` 并记录指标 |

## 5. 证据文档结构

```markdown
# GA Readiness Evidence (PRD §10.2)

## Summary
- Total signals: 11
- Pass: X / 11
- Conditional pass: Y / 11
- Evidence date: YYYY-MM-DD

## Signal #1: Pilot Repository Onboarding
[evidence]

## Signal #2: Clean-room Installation
[evidence]

... (逐条)
```

## 6. 输入约束（来自 TK-300）

1. 不得绕过 `StandardsPackRegistry` 另起平行 contract。
2. 术语与 playbook 口径必须沿用 sprint-003 定型的 pretty output 语义。
3. 保持关键集成测试绿灯。

## 7. 验证命令

1. `pnpm run typecheck`
2. `pnpm run test:coverage`
3. `pnpm run check`
4. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
