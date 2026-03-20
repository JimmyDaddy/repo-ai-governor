# TK-029 sprint-002 slot/upgrade 输入约束清单

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Scope: `sprint-001 -> sprint-002` handoff

## 1. 目标

确保 `sprint-002-slot-security-and-upgrade-ux` 启动前具备可消费输入、可阻断门禁与可回放约束，避免 Slot 安全与升级 UX 实施阶段出现策略漂移。

## 2. 输入就绪检查

1. Standards 与投影基线
   - `DA-032` 已提供 `pack registry + rule renderer` 同源语义渲染入口。
   - `DA-033` 已提供 `agents projector + projection parity`，可稳定回链 `projection_target/projected_at/source_pack_refs`。
2. Spec Sync Guard 门禁基线
   - `DA-034` 已提供 triad + brief 同步校验脚本，并接入 `gate:docs-triad-sync`。
   - 失败输出结构为 `status/failures/changed_files/missing_sync_files`，可被 CI 机器消费。
3. Artifact 生命周期与依赖注入约束
   - `dependent_tasks` 由任务卡 `Depends On` 自动回填，不允许手工漂移。
   - 依赖注入仅消费 `active/frozen`；`deprecated/archived/retired` 默认不进入自动注入。
4. Sprint-002 任务输入映射
   - `TK-027` 必须显式消费 `DA-035` 与 `DA-036`，作为 Slot 双轨安全六项实现输入。
   - `TK-028` 必须以 `TK-027` 输出与升级冲突分级策略为基础，不得重复定义规范包边界。
   - `TK-030` 验收任务必须回链 `DA-037/DA-038` 并输出 project-003 出口审计摘要。

## 3. Stage 4 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-032/DA-033/DA-034` 任一不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - Slot 脚本安全六项（沙箱/审批/资源限制/I-O 契约/失败隔离/审计）缺失任一强约束。
   - Upgrade UX 未提供冲突分级（block/confirm/auto）与失败回滚路径。
2. 确认型（CONFIRM）
   - i18n 文案或说明文档调整但语义键与规则 ID 不变。
   - 生命周期阈值参数（`inactive_days/deprecation_days`）变更但不改变状态机语义。
3. 自动型（AUTO_APPLY）
   - 产物索引回链补齐。
   - 无语义变化的文档引用与台账字段同步修正。

## 4. Sprint-002 启动前推荐命令

1. `pnpm run typecheck`
2. `node ./scripts/governance/reconcile-artifact-dependencies.js`
3. `node ./scripts/governance/compact-artifact-registry.js --dry-run`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
