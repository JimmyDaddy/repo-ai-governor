# TK-012 Stage 2 输入就绪清单

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Scope: Stage 1 -> Stage 2 handoff

## 1. 目标

确保 Stage 2 启动前具备可执行输入、稳定门禁、可回放升级决策与可恢复回滚路径，避免 sprint 边界处上下文丢失或策略漂移。

## 2. 输入就绪检查

1. Workspace 基线
   - `WorkspaceResolver` 双模式解析契约已固定，且 CLI 运行时消费同一解析事实。
   - `WorkspaceMigrationService` 迁移步骤与回滚语义可被复用。
2. Upgrade 基线
   - `UpgradeSchemaDiffService` 可输出 `diff/suggestions/confirmationDecision`。
   - `SchemaValidator` 已支持 `1.0/1.1`，并在 `1.1` 要求 `workspace.migrationPolicy`。
3. 生命周期与上下文控制
   - Artifact Registry 依赖已清理关闭任务引用。
   - 主/归档注册表分层可持续执行，支持后续定期 compact。
4. 门禁稳定性
   - `pnpm run check` 连续通过。
   - `check-artifact-registry-lifecycle` 可阻断陈旧依赖回流。

## 3. 升级冲突分级与处置

1. 阻断型冲突（BLOCK）
   - 不支持的 schema 升级路径。
   - 生命周期非法状态或主/归档注册表状态漂移。
2. 确认型冲突（CONFIRM）
   - `schemaVersion` 变更导致校验契约切换。
   - 需要人工确认后写回的升级建议项。
3. 自动型变更（AUTO_APPLY）
   - `workspace.migrationPolicy` 等低风险补齐项。

## 4. 回滚演练基线

1. Workspace 迁移失败回滚：
   - 使用 `WorkspaceMigrationService.rollback()` 恢复 target 快照。
2. Upgrade 决策回滚：
   - 对未确认变更不落盘，保持源配置不变。
   - 对已确认但执行失败的变更，依赖配置快照恢复。
3. Artifact 生命周期回滚：
   - 通过归档注册表保留审计记录并支持回查。
   - 必要时可将误迁出的产物按审计记录恢复到主注册表。

## 5. Stage 2 启动前推荐命令

1. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `pnpm run check`
4. `pnpm run artifacts:compact -- --dry-run`
