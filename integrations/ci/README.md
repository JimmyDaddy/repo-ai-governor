# integrations/ci Baseline

- Status: active
- Date: 2026-03-19
- Scope: `project-001-foundation / TK-004`

## Purpose

提供可复用的 CI 基线模板与调用约定，确保本地门禁与 CI 门禁命令一致，避免“双标准”漂移。

## Directory Contract

1. `integrations/ci/github-actions/`: GitHub Actions 模板。
2. 后续新增 CI 平台模板时，保持同级目录命名并复用同一命令契约。

## Gate Command Contract

1. 安装依赖：`pnpm install --frozen-lockfile`
2. 质量门禁：`pnpm run check`
3. 可选增强：`pnpm run ci:quality`

## High-Risk Change Reminder

CI 工作流属于高风险变更类型。变更模板或接线策略时，应在任务记录中补充风险说明和回滚路径。
