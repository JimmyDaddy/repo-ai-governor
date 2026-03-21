# Code Review: Working Tree Review 2026-03-21 08:34

- Status: resolved
- Date: 2026-03-21
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/core-role-registry/src/role-registry.ts`
2. `packages/core-role-registry/src/constants/role-registry.constant.ts`
3. `packages/config/src/schema-validator.ts`
4. `packages/config/src/types/interfaces/governor.interface.ts`
5. `packages/core-runtime/src/process-runtime-engine.ts`
6. `packages/core-runtime/src/types/interfaces/runtime-stage.interface.ts`
7. `packages/config/test/config.unit.test.ts`
8. `packages/core-role-registry/test/role-registry.unit.test.ts`
9. `packages/core-runtime/test/process-runtime-engine.integration.test.ts`
10. 相关 sprint 台账变更（用于范围与状态核对）

## 2. Findings

### 2.1 [P2] Config schema does not enforce role id/version format constraints

- 位置: `packages/config/src/schema-validator.ts:366`, `packages/config/src/schema-validator.ts:378`, `packages/core-role-registry/src/role-registry.ts:247`, `packages/core-role-registry/src/role-registry.ts:262`
- 问题描述: `SchemaValidator.validateRoles()` 对 `roleProfileId` 和 `roleProfileVersion` 只做“非空字符串”校验，没有复用 `RoleRegistry` 中已经定义好的 `ROLE_PROFILE_ID_PATTERN` / `ROLE_PROFILE_VERSION_PATTERN`。这意味着非法配置（例如不符合 kebab-case 的 id、非 semver 的 version）可以顺利通过 `ConfigLoader`/schema validation，直到后续真正构造 `RoleRegistry` 时才抛错。
- 影响: 仓库配置错误无法在加载阶段被稳定拦截，错误会被延后到 runtime/registry 初始化阶段，既削弱了 schema validation 的职责边界，也让 misconfiguration 的定位更晚、更分散。
- 建议: 在 `SchemaValidator` 中同步接入与 `RoleRegistry` 一致的 id/version 格式校验，并补一条针对非法 `roleProfileId` 与非法 `roleProfileVersion` 的 config unit test。

### 2.2 [P3] Config schema also misses lifecycle reference invariants that registry later rejects

- 位置: `packages/config/src/schema-validator.ts:429`, `packages/config/src/schema-validator.ts:460`, `packages/core-role-registry/src/role-registry.ts:321`, `packages/core-role-registry/src/role-registry.ts:349`, `packages/core-role-registry/src/role-registry.ts:406`
- 问题描述: `validateRoleLifecycle()` 只校验字段类型，不校验生命周期引用关系。例如 `aliases` 是否包含自身 id、`replacedBy` 是否指向已存在 profile，都没有在 config schema 层被拒绝；这些规则要到 `RoleRegistry.normalizeProfile()` / `validateReplacementTargets()` 才会发现。
- 影响: 同一份 `governor.yaml.roles` 会出现“schema 验证通过，但 registry 初始化失败”的分层漂移。对用户来说，配置文件已经被判定为有效，却在后续运行路径上因生命周期语义问题崩掉，排障成本更高。
- 建议: 将至少两类生命周期约束前移到 schema 层：`aliases` 不得包含自身 id，`replacedBy` 必须引用同一 roles 列表内存在的 profile；同时增加对应的 config unit tests，避免 schema 与 registry 规则继续分叉。

## 3. Notes

1. `RoleRegistry` 包本身的主路径实现与 runtime 注入路径看起来是自洽的，本轮发现主要集中在 config schema 与 registry 约束不一致。
2. 现有包测全部通过，说明默认/正常配置路径可运行；问题集中在非法配置没有被尽早拒绝。
3. 本次 review 重点审查实现代码和直接相关测试，台账文件只用于核对 active stream 与任务状态。

## 4. Verification

1. `pnpm run test -- config.unit.test.ts role-registry.unit.test.ts process-runtime-engine.integration.test.ts`（通过；Vitest 本次运行共通过 33 个 test files / 94 个 tests）
2. `git diff --stat` 与关键实现文件静态审查（已执行）

## 复核结论（2026-03-21）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Config schema does not enforce role id/version format constraints`
   - 判定：**认可**
   - 证据：`packages/config/src/schema-validator.ts:366-381` 仅执行 `expectString`；`ROLE_PROFILE_ID_PATTERN/ROLE_PROFILE_VERSION_PATTERN` 仅在 `packages/core-role-registry/src/role-registry.ts:251-267` 使用，未在 schema 层复用。
   - 处理：建议按原报告执行修复，在 schema 层前移 id/version 格式校验并补非法样例测试。

2. `2.2 [P3] Config schema also misses lifecycle reference invariants that registry later rejects`
   - 判定：**认可（附带说明）**
   - 证据：`packages/config/src/schema-validator.ts:429-438` 仅校验 `replacedBy != roleProfileId`，未校验 `lifecycle.aliases` 是否包含自身 id，也未校验 `replacedBy` 是否引用同一 roles 列表中存在的 profile；对应约束目前在 `packages/core-role-registry/src/role-registry.ts:349-369` 与 `:406-415` 才被拒绝。
   - 处理：建议在 schema 层补齐这两类引用约束，避免“schema 通过但 registry 初始化失败”的分层漂移。

### 验证命令

1. `rg -n "validateRoles|roleProfileId|roleProfileVersion|ROLE_PROFILE_ID_PATTERN|ROLE_PROFILE_VERSION_PATTERN" packages/config/src/schema-validator.ts packages/core-role-registry/src/role-registry.ts`（通过）
2. `nl -ba packages/config/src/schema-validator.ts | sed -n '330,470p'`（通过）
3. `nl -ba packages/core-role-registry/src/role-registry.ts | sed -n '230,340p'`（通过）
4. `nl -ba packages/core-role-registry/src/role-registry.ts | sed -n '340,430p'`（通过）

## 修复执行记录（2026-03-21）

1. `2.1 [P2] Config schema does not enforce role id/version format constraints`：已完成
   - 变更文件：`packages/shared/src/constants/role-profile.constant.ts`、`packages/shared/src/constants/index.ts`、`packages/shared/src/index.ts`、`packages/core-role-registry/src/constants/role-registry.constant.ts`、`packages/config/src/schema-validator.ts`、`packages/config/test/config.unit.test.ts`
   - 验证：`pnpm run test:packages -- packages/config/test/config.unit.test.ts packages/core-role-registry/test/role-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run typecheck`（通过）
   - 说明：已将 `roleProfileId`/`roleProfileVersion` 格式约束统一收敛到 `packages/shared`，并在 config schema 前移拦截非法 id/version。

2. `2.2 [P3] Config schema also misses lifecycle reference invariants that registry later rejects`：已完成
   - 变更文件：`packages/config/src/schema-validator.ts`、`packages/config/test/config.unit.test.ts`
   - 验证：`pnpm run test:packages -- packages/config/test/config.unit.test.ts packages/core-role-registry/test/role-registry.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm run typecheck`（通过）
   - 说明：已在 schema 层补齐 `aliases` 不得包含自身 id、`replacedBy` 必须引用 roles 列表内已存在 profile 的约束，并新增对应负向测试。
