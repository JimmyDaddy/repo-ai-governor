# sprint-001-foundation-bootstrap 计划

- Status: active
- Date: 2026-03-19
- Project: `project-001-foundation`

## 1. Sprint Goal

完成 Stage 0-1 的“边界+入口+配置+基础门禁”交付闭环。

## 2. In-Scope Tasks

1. TK-003 项目细化与基线约束文档（completed）
2. TK-004 Monorepo 边界与 CI 骨架
3. TK-005 Config 包基线实现方案
4. TK-006 CLI 命令骨架 + shared i18n runtime + smoke 基线（completed）
5. TK-007 依赖边界 warning gate 基线（completed）
6. TK-008 sprint-001 出口验收基线

## 3. Exit Criteria

1. `apps/cli` 命令骨架可运行。
2. `packages/config` 基线契约明确且可被后续实现消费。
3. `packages/shared/src/i18n` 的 `i18next` runtime 基线可被 CLI 调用。
4. `integrations/ci` 与依赖边界 warning gate 打通。
