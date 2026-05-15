# project-125-adopt-backfill-receipt-command-rollout 计划

- Status: active
- Date: 2026-05-15
- Stage Mapping: adoption runtime remediation
- Phase Mapping: receipt reconstruction and verify unblocking
- Upstream:
  - `apps/cli/src/commands/adopt-command.ts`
  - `apps/cli/src/runtime/adoption-pack-runtime.ts`
  - `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
  - `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
  - `packages/standards/src/built-in-adoption-pack-catalog.ts`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`

## 1. 目标

1. 为未经过 `adopt bootstrap/apply` 的手工初始化仓库补齐可追溯的 adoption install receipt。
2. 新增 `adopt backfill-receipt` 命令，基于目标仓库现状回填 receipt，而不是要求用户重装 adoption surfaces。
3. 让 `adopt verify` 能在 deepseekian 这类历史仓库上直接复用同一 receipt/runtime contract。

## 2. Sprint 细化

## 2.1 sprint-001-backfill-receipt-command-and-receipt-reconstruction

- Status: active
- Sprint Goal: 实现 `adopt backfill-receipt` 命令、receipt 重建逻辑、测试与 closeout
- Task Package: `TK-1068、TK-1069`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-1068 | sprint-001-backfill-receipt-command-and-receipt-reconstruction | implement adopt backfill-receipt command and receipt reconstruction runtime | cli/runtime | adoption install contract | in_progress |
| TK-1069 | sprint-001-backfill-receipt-command-and-receipt-reconstruction | close sprint-001 and capture backfill command validation evidence | governance/closeout | implement adopt backfill-receipt command and receipt reconstruction runtime | planned |

## 4. 依赖产物策略

1. receipt backfill 继续复用 canonical `AdoptionPackInstallReceipt` / verification summary 结构，不新增平行格式。
2. CLI/help/i18n/runtime/test 的同窗变更统一收口到 `TK-1068`，closeout 与 commit evidence 留给 `TK-1069`。
3. review lifecycle 仅在实现和验证完成后进入独立 `CR` 任务，不在当前骨架阶段预生成 review 报告。

## 5. DoD（project-125-adopt-backfill-receipt-command-rollout）

1. `adopt backfill-receipt` 能接收 `--repo`，扫描目标 `.repo-ai-governor`，生成完整 receipt 与摘要输出。
2. source catalog 分类、workspace/profile/pack 推断、真实 checksum 计算与 installation 目录写入均有自动化测试覆盖。
3. 同窗口完成 `pnpm run build` 与定向 adopt 集成测试，并把验证结果回写到 task ledger / checklist / current-context。

## 6. 里程碑记录

1. 2026-05-15：创建 project-125-adopt-backfill-receipt-command-rollout 执行流骨架并激活 sprint-001。

## 7. 里程碑记录入口

1. 待 closeout 后补齐 completion audit summary。
