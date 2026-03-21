# TK-032 Role Registry 与 Role Profile 生命周期基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

建立 Role Registry 基线并定义 `role_profile` 生命周期字段与约束。

## 2. Depends On

1. `DA-039`
2. `DA-040`

## 3. 预期产物

1. `DA-041` role registry and role profile lifecycle baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-003-exit-acceptance-and-project-004-input-constraints.md` (`DA-039`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-004-input-constraints-checklist.md` (`DA-040`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`§4.6` Stage 5）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2`）
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-009`、`CS-016`、`CS-019`、`CS-021`）

## 5. 实施计划

1. 定义默认角色与用户自定义角色的统一注册契约。
2. 补齐 `role_profile_id/version/status/aliases/replaced_by` 生命周期字段与校验规则。
3. 输出最小审计字段，确保角色决策可回链到配置版本。
4. 对接配置层与运行时消费路径，避免 adapter 侧分叉定义角色语义。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
