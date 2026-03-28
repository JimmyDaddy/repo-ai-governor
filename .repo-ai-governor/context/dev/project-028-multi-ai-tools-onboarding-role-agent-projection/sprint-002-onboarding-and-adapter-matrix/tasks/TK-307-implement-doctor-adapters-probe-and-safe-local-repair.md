# TK-307 implement doctor adapters probe and safe_local repair

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-002-onboarding-and-adapter-matrix`

## 1. 任务目标

实现 `doctor --adapters` 的探测与 `safe_local` 修复边界，输出可执行的诊断与 nextAction。

## 2. Depends On

1. `TK-306`

## 3. 预期产物

1. `doctor --adapters` 诊断输出
2. `safe_local` 修复边界说明

## 4. 实施计划

1. 探测命令可执行性、登录态、能力矩阵与受限网络降级可能性。
2. 仅自动执行 `safe_local` 修复，例如补目录、修本地权限、补模板配置。
3. 对认证、网络代理、权限上限、发布动作只输出 `nextAction`。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
