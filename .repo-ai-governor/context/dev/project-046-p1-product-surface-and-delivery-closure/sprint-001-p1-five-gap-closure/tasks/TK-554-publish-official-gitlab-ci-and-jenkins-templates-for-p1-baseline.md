# TK-554 publish official GitLab CI and Jenkins templates for P1 baseline

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P1
- Project: `project-046-p1-product-surface-and-delivery-closure`
- Sprint: `sprint-001-p1-five-gap-closure`

## 1. 任务目标

补齐 PRD 明确要求的 `GitLab CI` 与 `Jenkins` 官方模板，至少覆盖 install、quality gate、release governance 的最小基础链路，并同步正式文档说明。

## 2. Depends On

1. `.github/workflows/*.yml`
2. `scripts/ci/**`
3. `scripts/release/**`

## 3. 预期产物

1. GitLab template asset
2. Jenkins template asset
3. template usage docs

## 4. Development Verification

1. `pnpm run build`
2. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 5. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 GitLab/Jenkins 官方模板补齐。
2. 2026-04-05：完成 `integrations/ci/gitlab-ci/**`、`integrations/ci/jenkins/**` 与 `integrations/ci/README.md` 的模板目录与命令契约发布。
3. 2026-04-05：验证通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。
