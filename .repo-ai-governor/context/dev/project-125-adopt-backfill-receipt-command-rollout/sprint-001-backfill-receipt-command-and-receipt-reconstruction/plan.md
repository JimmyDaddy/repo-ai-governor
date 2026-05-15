# sprint-001-backfill-receipt-command-and-receipt-reconstruction 计划

- Status: active
- Date: 2026-05-15
- Sprint Goal: 实现 `adopt backfill-receipt` 命令、receipt 重建逻辑、测试与 closeout
- Project: `project-125-adopt-backfill-receipt-command-rollout`
- Upstream:
  - `apps/cli/src/commands/adopt-command.ts`
  - `apps/cli/src/runtime/adoption-pack-runtime.ts`
  - `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
  - `packages/standards/src/built-in-adoption-pack-catalog.ts`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 1. Scope

1. 扩展 adopt CLI 子命令、帮助文案、i18n 和命令结果映射，公开 `backfill-receipt` 能力。
2. 在 adoption runtime 中实现 init-manifest 解析、source catalog 匹配、真实文件 checksum 采集、receipt/summary 写入与摘要输出。
3. 为手工初始化仓库补齐集成测试，并完成同窗口 build 与任务台账同步。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-1068 | implement adopt backfill-receipt command and receipt reconstruction runtime | adoption install contract | in_progress |
| TK-1069 | close sprint-001 and capture backfill command validation evidence | implement adopt backfill-receipt command and receipt reconstruction runtime | planned |

## 3. Exit Criteria

1. `repo-ai-governor adopt backfill-receipt --repo <path>` 可在无 receipt 的手工初始化仓库中生成 canonical adoption receipt。
2. source catalog 分类、workspaceMode/profile/pack 推断、真实 checksum 与输出摘要均有自动化验证证据。
3. sprint-001 的 task cards、checklist、tasks.csv 与 `current-context.md` 已同步到最新执行真值。

## 4. Sprint Notes

1. 当前任务直接命中代码实现，因此创建骨架后立即激活为 primary stream。
2. 若回填逻辑发现现有仓库缺少足够 metadata 无法推断 pack/profile，应 fail-closed 并给出显式诊断，而不是静默猜测。
