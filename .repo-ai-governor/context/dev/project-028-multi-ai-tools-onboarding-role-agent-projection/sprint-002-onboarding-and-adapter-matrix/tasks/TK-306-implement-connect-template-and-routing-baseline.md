# TK-306 implement connect template and routing baseline

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`
- Sprint: `sprint-002-onboarding-and-adapter-matrix`

## 1. 任务目标

实现 `connect` 模板生成与路由基线构造，使 preset、tool binding 与 routing schema 可稳定输出。

## 2. Depends On

1. `TK-304`
2. `TK-305`

## 3. 预期产物

1. `connect` onboarding 实现或设计落点
2. `governor.yaml` schema v2 的连接面约束

## 4. 实施计划

1. 固化 `single-tool-minimal`、`multi-tool-default`、`single-tool-all-roles`、`restricted-network-safe` 模板语义。
2. 支持 `--tools`、`--preset`、`--dry-run`、`--overwrite`、`--single-tool-all-roles`、`--role-binding` 等参数。
3. 保证生成结果可通过 schema 校验并可回放。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 6. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
