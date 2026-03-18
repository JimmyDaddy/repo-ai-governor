# 依赖方向自动检查（Warning）接入基线（TK-115）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-002`
- Task: `TK-115`

## 1. 目标

在 M1 阶段接入“依赖方向自动检查”并以 warning 模式运行，形成可执行的违规识别与治理闭环，为 M5 切换 blocking gate（`TK-503`）提供稳定输入。

## 2. 范围与非目标

1. 范围：
   - 固化 `check-package-dependency-boundary` 的输入输出契约与 warning 模式语义。
   - 对齐 `architecture §6` 依赖方向约束并建立违规分级口径。
   - 明确接入命令、报告落点、白名单治理与升级路径。
2. 非目标：
   - 本任务不切换为 blocking gate（由 `TK-503` 负责）。
   - 本任务不引入跨仓库远程依赖分析，仅覆盖当前 workspace 的本地依赖图。
   - 本任务不替代人工 code review，仅提供自动化告警与追踪输入。

## 3. 规则来源与事实源

1. `docs/dev/milestone-00-m0-baseline-governance/sprint-001/boundary-and-dependency-check-strategy.md`
2. `docs/repo-ai-governor-architecture-and-repo-layering.md`（`§6 模块依赖方向约束`）
3. `code_standards.md`（Monorepo Version And Dependency Boundary Baseline）

## 4. Warning Gate 契约（M1）

### 4.1 接口输入

1. 扫描范围：`apps/**`、`packages/**`。
2. 配置输入：
   - `--mode=warning`（默认）
   - `--format=summary|json`
   - `--config=<path>`（可选，默认 `scripts/governance/dependency-boundary.config.json`）
3. 规则输入：
   - 从架构约束生成 allow/deny 依赖方向矩阵。

### 4.2 输出模型

1. summary（人类可读）：
   - `status`, `violations_total`, `by_severity`, `top_paths`。
2. json（机器可读）：
   - `status`, `mode`, `violations[]`, `checked_edges`, `generated_at`。
3. violation 字段：
   - `rule_id`, `severity`, `from`, `to`, `import_path`, `suggested_fix`。

### 4.3 退出语义

1. `warning` 模式：
   - 允许进程退出码为 `0`，但必须输出完整违规清单。
2. `blocking` 模式（M5）：
   - 任一 Blocking/Major 违规触发非零退出码。

## 5. 违规分级与处置

1. `blocking`：跨层反向依赖（例如 `packages/* -> apps/cli`）。
2. `major`：核心域直接依赖具体 provider/adapter 实现。
3. `minor`：导出面或组织形态偏离约束但未形成反向耦合。

处置要求：
1. `blocking/major`：必须在 `tasks/checklist.md` 与 `tasks.csv` 登记整改任务。
2. `minor`：允许列入债务池，但需写明 owner 与清理截止时间。
3. 所有豁免必须登记 `path + reason + owner + expiry`。

## 6. 接入路径（M1 -> M5）

1. M1（本任务）：
   - 已新增并保留脚本：`scripts/governance/check-package-dependency-boundary.js`（pending integration，不接入默认 gate）。
   - 已提供默认配置：`scripts/governance/dependency-boundary.config.json`。
   - 在本地/CI 可选步骤运行 warning 报告，不阻断主流程。
2. M4：
   - 随适配器模块化收敛剩余历史反向依赖。
3. M5（`TK-503`）：
   - 切换为 blocking gate，纳入 `code_standards.md -> Verification Commands`。

## 7. 产物落点与追踪

1. 建议命令：
   - `node ./scripts/governance/check-package-dependency-boundary.js --mode=warning`
2. 报告落点：
   - `docs/dev/milestone-01-m1-core-extraction/sprint-002/code-review/`（task 级）
   - `docs/dev/**/tasks/checklist.md` 与 `tasks.csv`（执行台账）
3. 升级输入：
   - `TK-503` 使用本基线切换 blocking gate 并固化 CI 阻断语义。

## 8. 回归与验收口径

1. warning 模式运行后，能输出可定位的违规路径与建议修复动作。
2. 输出结构可被 CR 与台账直接引用（含 rule_id、path、severity）。
3. 与 `architecture §6` 约束口径一致，不产生术语漂移。

## 9. 后续任务输入映射

1. `TK-116`：作为 M1 退出回归中的依赖边界检查证据来源。
2. `TK-503`：作为切换 blocking gate 的直接输入基线。

## 10. 验收标准

1. warning gate 语义、输出契约、升级路径清晰可执行。
2. 违规分级与处置规则可直接落地到任务台账。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
