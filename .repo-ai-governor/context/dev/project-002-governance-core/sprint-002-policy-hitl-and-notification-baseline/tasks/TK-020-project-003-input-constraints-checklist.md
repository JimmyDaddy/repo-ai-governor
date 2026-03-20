# TK-020 project-003 输入约束清单

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Scope: `project-002 -> project-003` handoff

## 1. 目标

确保 `project-003-standards-and-slots` 启动前具备可执行输入、可回放策略证据与稳定门禁链路，避免 Standards/Slot 实施阶段出现策略语义漂移。

## 2. 输入就绪检查

1. 风险与策略基线
   - `DA-027` 已提供结构化风险事实输出契约（`riskLevel/riskReasons/requiredAction`）。
   - `DA-028` 已提供 `allow/confirm/block/escalate` 决策与 HITL 回灌字段（`decision/reason/constraints`）。
   - `DA-029` 已提供 HITL 通知主备与升级链路基线（`notificationChannel/notificationStatus/notifiedAtDisplay`）。
2. 执行与记忆基线
   - `DA-020`~`DA-024` 保证 Process/Runtime/Memory/Session/Store 链路可回放，供 project-003 复用执行事实。
3. 产物与台账治理
   - `task card/checklist/tasks.csv` 保持字段同步。
   - Artifact Registry 生命周期符合 `active/frozen/deprecated/archived/retired` 治理约束。
4. 规范与架构入口
   - project-003 目标与退出标准已在 `.repo-ai-governor/context/dev/project-003-standards-and-slots/plan.md` 明确。
   - 技术方案与架构文档中的 Standards/Slot 边界（`overall-technical-solution §4.2`、`architecture §4`、`§6`）可直接检索。

## 3. Stage 4 风险分级输入基线

1. 阻断型输入缺失（BLOCK）
   - `DA-027/DA-028/DA-029` 任一不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - Standards 语义资产与 `human/ai/agents` 投影无法证明同源。
   - Slot 脚本安全六项（沙箱/审批/配额/I-O 契约/隔离/审计）缺失任一强制约束。
2. 确认型输入偏差（CONFIRM）
   - i18n locale 映射或文案渲染策略调整但保持语义键不变。
   - Spec Sync Guard 输出格式调整但阻断语义不变。
3. 自动型输入补齐（AUTO_APPLY）
   - 文档路径回链、注释补齐、无语义变化的说明类更新。

## 4. 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
4. `pnpm run artifacts:compact -- --dry-run`
5. `pnpm run check`
