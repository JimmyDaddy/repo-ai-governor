# TK-016 sprint-002 输入约束清单

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Scope: sprint-001 -> sprint-002 handoff

## 1. 目标

确保 sprint-002 启动前具备可执行输入、可校验风险事实、稳定门禁链路与可回放审计入口，避免策略实现阶段出现上下文漂移。

## 2. 输入就绪检查

1. Process 与 Runtime 基线
   - `DA-020` 编译产物契约已稳定，IR 快照可作为 runtime 执行输入。
   - `DA-021` 控制流节点与中断语义可直接作为策略引擎的执行事实来源。
2. Memory 与 Session 基线
   - `DA-022` 统一 memory/session/store 抽象可读写并可回放。
   - `DA-023` 与 `DA-024` 已覆盖 `sqlite-fs` 与 CLI provider 组装路径，支持后续策略链路复用。
3. 任务台账与产物生命周期
   - 任务卡、`checklist.md`、`tasks.csv` 保持字段同步。
   - Artifact Registry 生命周期状态满足 `active/frozen/deprecated/archived/retired` 约束。
4. 门禁稳定性
   - `pnpm run check` 可持续通过。
   - `check-task-ledger-sync` 与 `check-artifact-registry-lifecycle` 无阻断项。

## 3. sprint-002 风险分级输入基线

1. 阻断型输入缺失（BLOCK）
   - `DA-025/DA-026` 不可检索，或路径与 registry 登记不一致。
   - Runtime 中断语义与审计字段缺失导致策略链路无法复盘。
2. 确认型输入偏差（CONFIRM）
   - risk 规则键或策略映射键命名调整但保持语义兼容。
   - 通知渠道默认策略调整但未触发行为语义变化。
3. 自动型输入补齐（AUTO_APPLY）
   - 低风险文案、本地化键补齐与无语义变化的说明类文档更新。

## 4. 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
4. `pnpm run artifacts:compact -- --dry-run`
5. `pnpm run check`
