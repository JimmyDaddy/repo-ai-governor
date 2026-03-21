# TK-032 Role Registry 与 Role Profile 生命周期基线

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
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

## 5. 实施摘要

1. 新增 `packages/core-role-registry` 基线包，落地：
   - `RoleRegistry`（默认角色 + 自定义角色注册、生命周期校验、别名与替代解析）。
   - 默认角色画像（Planner/Architect/Coder/Tester/Reviewer/Verifier）与审计回链记录。
2. 在 `packages/config` 中新增 `roles` 配置契约和 schema 校验：
   - 增加 `roleProfileId/version/status/roleSource/lifecycle` 字段约束；
   - 校验 `roleProfileId` 唯一性与生命周期字段合法性。
3. 在 `packages/core-runtime` 中新增可选 `roleRegistry` 运行时消费路径：
   - stage 执行前按 `roleProfileId` 解析角色；
   - stage context 注入 `routeKey/roleProfileId/roleProfileVersion/roleSource` 元数据。
4. 同步 `tsconfig` 与 `vitest` 内部 alias，补齐新包的测试与构建解析路径。

## 6. 产出

1. `packages/core-role-registry/package.json`
2. `packages/core-role-registry/README.md`
3. `packages/core-role-registry/src/constants/role-registry.constant.ts`
4. `packages/core-role-registry/src/constants/index.ts`
5. `packages/core-role-registry/src/types/interfaces/role-registry.interface.ts`
6. `packages/core-role-registry/src/types/interfaces/index.ts`
7. `packages/core-role-registry/src/types/aliases/role-registry.type.ts`
8. `packages/core-role-registry/src/types/aliases/index.ts`
9. `packages/core-role-registry/src/types/index.ts`
10. `packages/core-role-registry/src/role-registry.ts`
11. `packages/core-role-registry/src/index.ts`
12. `packages/core-role-registry/test/role-registry.unit.test.ts`
13. `packages/shared/src/constants/role-profile.constant.ts`
14. `packages/shared/src/constants/index.ts`
15. `packages/shared/src/index.ts`
16. `packages/shared/src/errors/error-code.constant.ts`
17. `packages/config/src/types/interfaces/governor.interface.ts`
18. `packages/config/src/types/interfaces/index.ts`
19. `packages/config/src/index.ts`
20. `packages/config/src/schema-validator.ts`
21. `packages/config/test/config.unit.test.ts`
22. `packages/core-runtime/src/types/interfaces/runtime-control.interface.ts`
23. `packages/core-runtime/src/types/interfaces/runtime-stage.interface.ts`
24. `packages/core-runtime/src/process-runtime-engine.ts`
25. `packages/core-runtime/package.json`
26. `packages/core-runtime/test/process-runtime-engine.integration.test.ts`
27. `tsconfig.json`
28. `vitest.internal-alias.ts`
29. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-032-role-registry-and-role-profile-lifecycle-baseline.md`
30. `DA-041` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md`

## 7. 验证

1. `pnpm run typecheck`（通过）
2. `pnpm run test:packages -- packages/config/test/config.unit.test.ts packages/core-role-registry/test/role-registry.unit.test.ts packages/core-runtime/test/process-runtime-engine.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始落地 `core-role-registry` 包、配置层 `roles` 契约与运行时角色消费基线。
3. 2026-03-21：完成 Role Registry 基线、config roles 校验、runtime 角色消费接线与包测覆盖，状态切换为 `completed`。
