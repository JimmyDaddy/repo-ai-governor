# TK-028 Standards 升级 UX 与版本 pin 策略基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-002-slot-security-and-upgrade-ux`

## 1. 任务目标

建立 Standards 升级 UX 闭环：冲突清单分级、自动修复建议、失败回滚与版本 pin 策略。

## 2. Depends On

1. `TK-027`
2. `DA-037`
3. `DA-035`
4. `DA-036`

## 3. 预期产物

1. `DA-038` standards upgrade ux and version pin baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-027-slot-engine-dual-track-and-script-security-baseline.md` (`DA-037`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-035`)
3. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-002-slot-upgrade-input-constraints-checklist.md` (`DA-036`)
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§8.5`）
5. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`（`§8.4`）
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-009`、`CS-013`、`CS-016`、`CS-022`）

## 5. 实施摘要

1. 在 `packages/standards` 新增 `StandardsUpgradePlanner`，输出升级冲突分级（阻断/可自动修复/建议）与 `requiredAction` 汇总。
2. 落地版本 pin 策略基线：默认 `major_locked`，并支持 minor/patch 自动升级开关。
3. 落地失败回滚语义：输出 `restore_previous_snapshot` 回滚策略与可审计 `rollbackRef`。
4. 补齐升级 UX smoke 覆盖：minor 自动升级、major 阻断与 pin 建议、source 变更 confirm、非法 semver 标准化报错。

## 6. 产出

1. `packages/standards/src/standards-upgrade-planner.ts`
2. `packages/standards/src/constants/standards.constant.ts`
3. `packages/standards/src/constants/index.ts`
4. `packages/standards/src/types/interfaces/standards.interface.ts`
5. `packages/standards/src/types/interfaces/index.ts`
6. `packages/standards/src/types/index.ts`
7. `packages/standards/src/index.ts`
8. `packages/standards/README.md`
9. `packages/shared/src/errors/error-code.constant.ts`
10. `test/standards-upgrade-ux.smoke.test.ts`
11. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/review/verified_review_tk-028-standards-upgrade-ux-and-version-pin-baseline.md`
12. `DA-038` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-028-standards-upgrade-ux-and-version-pin-baseline.md`

## 7. 验证

1. `pnpm run typecheck`（通过）
2. `pnpm run test -- standards-upgrade-ux.smoke.test.ts`（通过）
3. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始实现 standards 升级冲突分级、回滚语义与版本 pin 策略基线。
2. 2026-03-20：完成 `StandardsUpgradePlanner` 与升级 UX smoke 覆盖，补齐升级错误码、常量枚举与类型契约回链。
3. 2026-03-20：完成门禁复核，状态切换为 `completed`。
4. 2026-03-21：补齐与 `TK-029` 输入约束的显式回链，新增 `DA-035/DA-036` 到 `Depends On` 与 `Input References`，收敛任务消费链路。
