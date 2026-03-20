# TK-027 Slot Engine 双轨与脚本安全六项基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-002-slot-security-and-upgrade-ux`

## 1. 任务目标

建立 Slot Engine 声明式主路径与脚本路径的统一治理基线，并落地脚本安全六项。

## 2. Depends On

1. `TK-029`
2. `DA-035`
3. `DA-036`

## 3. 预期产物

1. `DA-037` slot engine dual track and script security baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-035`、`DA-036`)
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§8.5`）
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4` slot 脚本安全基线）
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-009`、`CS-013`、`CS-016`、`CS-022`）

## 5. 实施摘要

1. 新增 `packages/slots` 基线模块，提供 `SlotEngine` 统一入口与常量/类型分层结构。
2. 落地双轨执行模型：
   - 声明式轨道：元信息、触发条件、适用范围、提示注入、前后置检查、冲突策略；
   - 脚本轨道：安全六项校验（沙箱、权限审批、资源配额、I/O 契约、副作用声明、失败隔离）。
3. 输出结构化执行计划与审计字段，包含 `slotScriptId/slotScriptVersion/slotScriptHash/grantedPermissions/exitCode`。
4. 新增 `slot-engine-security` smoke 覆盖双轨主路径、冲突策略和标准化错误路径。

## 6. 产出

1. `packages/slots/package.json`
2. `packages/slots/README.md`
3. `packages/slots/src/constants/slot.constant.ts`
4. `packages/slots/src/constants/index.ts`
5. `packages/slots/src/types/interfaces/slot-engine.interface.ts`
6. `packages/slots/src/types/interfaces/index.ts`
7. `packages/slots/src/types/aliases/slot-engine.type.ts`
8. `packages/slots/src/types/aliases/index.ts`
9. `packages/slots/src/types/index.ts`
10. `packages/slots/src/slot-engine.ts`
11. `packages/slots/src/index.ts`
12. `test/slot-engine-security.smoke.test.ts`
13. `packages/shared/src/errors/error-code.constant.ts`
14. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/code-review/verified_review_tk-027-slot-engine-dual-track-and-script-security-baseline.md`
15. `DA-037` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-027-slot-engine-dual-track-and-script-security-baseline.md`

## 7. 验证

1. `pnpm run typecheck`（通过）
2. `pnpm run test -- slot-engine-security.smoke.test.ts`（通过）
3. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始实现 slot engine 双轨模型与脚本安全六项基线契约。
2. 2026-03-20：完成 `packages/slots` 基线实现与 `slot-engine-security` smoke 覆盖，补齐标准化错误码并完成台账回链。
3. 2026-03-20：完成门禁复核，状态切换为 `completed`。
