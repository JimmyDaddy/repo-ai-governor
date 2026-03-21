# TK-039 project-005 输入约束清单

- Status: active
- Date: 2026-03-21
- Owner: AI-Agent
- Scope: `project-004 -> project-005` handoff

## 1. 目标

确保 `project-005-observability-and-artifacts` 启动前具备可消费输入、可阻断门禁与可回放证据，避免审计回放、依赖产物运行时与 CLI 输出契约出现语义漂移。

## 2. 输入就绪检查

1. Stage 5 产物可消费性
   - `DA-046` 已提供首批 adapters 与统一协议执行基线。
   - `DA-047` 已提供 restricted network 模式降级语义与本地 fallback 约束。
   - `DA-048` 已提供 IDE 集成骨架与多入口命令包装契约。
   - `DA-049` 已固化 project-004 出口验收结论，可作为 Stage 6 启动基线。
2. 评审与流程治理基线
   - sprint-002 评审产物目录维持 `review/`，CR 生命周期可回链。
   - `task card/checklist/tasks.csv` 与 artifact registry 同步规则已通过治理门禁校验。
3. 生命周期与依赖治理
   - 依赖产物生命周期状态遵循 `active/frozen/deprecated/archived/retired`。
   - `dependent_tasks` 通过任务卡 `Depends On` 自动回填，关闭任务会被 reconcile 清理。
4. project-005 启动入口
   - `project-005` 计划已回填 `DA-049` 与 `DA-050` 为启动输入基线。
   - Stage 6 实施应先声明审计回放与输出契约 schema，再展开 provider 与 UI/CLI 扩展。

## 3. Stage 6 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-049/DA-050` 任一不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - CLI `pretty/plain/json` 输出契约未定义 schema 即直接开放消费。
   - 审计回放数据保留与脱敏策略未落地即开始导出/删除流程实现。
2. 确认型（CONFIRM）
   - 输出字段新增但保持既有 schema 兼容。
   - 审计事件新增类型但不改变既有回放语义与 retention 策略。
3. 自动型（AUTO_APPLY）
   - 索引补齐、文档回链和非语义台账字段同步修正。

## 4. project-005 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
