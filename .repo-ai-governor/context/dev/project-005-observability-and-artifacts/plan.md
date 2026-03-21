# project-005-observability-and-artifacts 计划

- Status: active
- Date: 2026-03-21
- Stage Mapping: Stage 6
- Phase Mapping: Phase D

## 1. 目标

1. 建立审计记录、执行报告与回放解释能力。
2. 建立依赖产物运行时（Artifact Registry + Dependency Resolver）与策略化处置。
3. 建立 CLI 输出契约（`pretty/plain/json`）与非交互降级策略。
4. 建立审计隐私治理（90 天保留、脱敏、导出/删除）与 i18n 输出门禁联动。

## 2. 工作流分解（Workstreams）

1. WS-01 Audit Event Model
   - Audit Recorder 最小字段与统一事件模型。
2. WS-02 Report + Replay
   - Report Builder、Replay/Explain 与回放定位能力。
3. WS-03 Artifact Runtime
   - Artifact Registry + Dependency Resolver 注册/解析/策略处置。
4. WS-04 CLI Output Contract
   - `pretty/plain/json`、`--output/--verbosity/--no-color` 与 non-TTY 降级。
5. WS-05 i18n + Privacy Governance
   - locale key parity 与 fallback 门禁。
   - 审计保留、脱敏、按维度导出与删除。

## 3. Sprint 细化

## 3.1 sprint-001-audit-report-and-replay-baseline

- Sprint Goal: 完成 Stage 6 前半段基础能力（审计模型、报告回放、依赖产物运行时）并形成 sprint-002 输入约束。
- 任务包：`TK-046`、`TK-047`、`TK-048`、`TK-049`。
- Exit Criteria:
  1. 审计事件模型最小字段与结构化事件写入契约可验证。
  2. 报告构建与回放解释链路可消费并可回链执行上下文。
  3. 依赖产物注册与解析策略可执行并具备缺失处置语义。
  4. 形成 sprint-001 验收基线与 sprint-002 输入约束清单。

## 3.2 sprint-002-dependency-runtime-and-output-governance

- Sprint Goal: 完成 Stage 6 后半段能力（输出契约、i18n 门禁、隐私治理）并形成 project-006 输入约束。
- 任务包：`TK-050`、`TK-051`、`TK-052`、`TK-053`。
- Exit Criteria:
  1. CLI 三模式输出契约与 non-TTY 自动降级稳定。
  2. i18n parity/fallback 门禁纳入输出回放定位。
  3. 审计隐私治理可配置并支持按范围导出/删除。
  4. 形成 project-005 出口验收与 project-006 输入约束清单。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-046 | sprint-001 | Audit Recorder 事件模型与最小字段基线 | baseline/contract | DA-049,DA-050 | completed |
| TK-047 | sprint-001 | Report Builder 与 Replay/Explain 基线 | baseline/integration | TK-046 | completed |
| TK-048 | sprint-001 | Artifact Registry + Dependency Resolver 运行时基线 | baseline/runtime | TK-046 | completed |
| TK-049 | sprint-001 | sprint-001 出口验收与 sprint-002 输入约束 | acceptance baseline | TK-046,TK-047,TK-048 | completed |
| TK-050 | sprint-002 | CLI 输出契约与 non-TTY 自动降级基线 | baseline/output | TK-049 | planned |
| TK-051 | sprint-002 | i18n parity/fallback 门禁与 output_locale 回放定位基线 | baseline/governance | TK-049,TK-050 | planned |
| TK-052 | sprint-002 | 审计隐私治理（保留/脱敏/导出删除）基线 | baseline/privacy | TK-049,TK-050 | planned |
| TK-053 | sprint-002 | project-005 出口验收与 project-006 输入约束 | acceptance baseline | TK-050,TK-051,TK-052 | planned |

## 5. 依赖产物策略

1. project-005 启动入口默认消费 `DA-049`（project-004 出口验收基线）与 `DA-050`（project-005 输入约束清单）。
2. sprint-001 产物目标：`DA-057`~`DA-061`；sprint-002 产物目标：`DA-062`~`DA-066`。
3. 任务执行时统一使用 `artifact_id + artifact_path` 双键回链，并同步 `tasks.csv/checklist/dependency-artifact-registry`。

## 6. DoD（project-005）

1. 审计、报告、回放、依赖运行时形成可测试基线并保持结构化字段稳定。
2. `pretty/plain/json` 输出契约在 TTY 与 non-TTY 场景一致可验证。
3. i18n 输出门禁与隐私治理形成可审计、可回放、可策略化处置能力。
4. 项目任务台账与评审生命周期路径满足 `CS-021`，无 `task card/checklist/tasks.csv` 漂移。

## 7. 里程碑记录

1. 2026-03-21：`DA-060/DA-061` 已产出并完成 `sprint-001 -> sprint-002` 输入约束回链，`sprint-001` 状态切换为 `completed`。
2. 待补充：project-005 完成态审计摘要（项目收尾时回填）。
