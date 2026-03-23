# integrations/ci Baseline

- Status: active
- Date: 2026-03-19
- Scope: `project-001-foundation / TK-004`

## Purpose

提供可复用的 CI 基线模板与调用约定，确保本地门禁与 CI 门禁命令一致，避免“双标准”漂移。

## Directory Contract

1. `integrations/ci/github-actions/`: GitHub Actions 模板。
2. 模板最小集合：`quality-gate.yml`（PR/主分支质量门禁）、`release-governance.yml`（canary/rc/ga 发布治理与失败回滚信号）。
3. 后续新增 CI 平台模板时，保持同级目录命名并复用同一命令契约。

## Gate Command Contract

1. 安装依赖：`pnpm install --frozen-lockfile`
2. Stage9 handoff 显式消费：`pnpm run check:stage9-handoff`
3. 质量门禁：`pnpm run check`
4. 可选增强：`pnpm run ci:quality`

## Release Channel Contract

1. canary：`pnpm run release:check` + `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`
2. rc：`pnpm run release:candidate`
3. ga：`pnpm run release:ga-candidate-unified-gate -- --output <report>`
4. ga 失败时：`pnpm run release:rollback-rehearsal -- --output <report>`

## High-Risk Change Reminder

CI 工作流属于高风险变更类型。变更模板或接线策略时，应在任务记录中补充风险说明和回滚路径。
