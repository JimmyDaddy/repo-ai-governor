# TK-030 project-004 输入约束清单

- Status: active
- Date: 2026-03-21
- Owner: AI-Agent
- Scope: `project-003 -> project-004` handoff

## 1. 目标

确保 `project-004-agent-adapter-runtime` 启动前具备可消费输入、可阻断门禁与可回放证据，避免 Agent/Adapter 实施阶段出现角色契约与权限语义漂移。

## 2. 输入就绪检查

1. Stage 4 产物可消费性
   - `DA-037` 已提供 Slot 双轨与脚本安全六项基线。
   - `DA-038` 已提供 Standards 升级 UX、冲突分级、回滚语义与版本 pin 策略。
   - `DA-032` ~ `DA-036` 提供 Standards/Spec Sync/输入约束上游基线，可回链语义来源。
2. 评审与流程治理基线
   - 当前仓库 sprint 评审产物目录已统一为 `review/`，CR 生命周期保持 `review_ -> verified_review_ -> resolved_review_`。
   - `workspace-code-review-workflow` 已对齐 `current-context` 的 `review` 路径解析。
3. 生命周期与依赖治理
   - Artifact Registry 生命周期状态遵循 `active/frozen/deprecated/archived/retired`。
   - `dependent_tasks` 通过任务卡 `Depends On` 自动回填，不允许手工漂移。
4. project-004 启动入口
   - `project-004-agent-adapter-runtime/plan.md` 已提供 Stage 5 目标与退出标准。
   - 启动前应先声明 `Role Registry`、`Agent 协议` 与 `Adapter SDK` 的最小契约边界，再展开实现拆解。

## 3. Stage 5 风险分级输入基线

1. 阻断型（BLOCK）
   - 未建立统一 Agent 契约即直接接入多工具适配器。
   - 角色权限上限未定义，或高风险动作未接入策略门禁/HITL。
   - 受限网络模式未声明降级语义与本地可运行边界。
2. 确认型（CONFIRM）
   - 新增角色画像字段或 adapter 能力矩阵字段但不改变现有决策语义。
   - IDE/CLI 接口参数扩展但保持兼容默认行为。
3. 自动型（AUTO_APPLY）
   - 文档回链、索引补齐与无语义变化的台账字段同步。

## 4. project-004 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
