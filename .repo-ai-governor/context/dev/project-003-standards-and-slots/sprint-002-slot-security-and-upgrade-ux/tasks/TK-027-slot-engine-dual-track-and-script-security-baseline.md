# TK-027 Slot Engine 双轨与脚本安全六项基线

- Status: planned
- Date: 2026-03-20
- Owner: TBD
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
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.5`、`§8`）
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4` slot 脚本安全基线）

## 5. 实施要点

1. 定义声明式 slot 元信息与冲突判定契约。
2. 受限沙箱默认执行并接入权限白名单审批。
3. 落地资源配额、I/O 契约校验、失败隔离与审计字段。

## 6. 验证

1. `pnpm run typecheck`
2. `pnpm run test -- slot-engine-security.smoke.test.ts`
3. `pnpm run check`
