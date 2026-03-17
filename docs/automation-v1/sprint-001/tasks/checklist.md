# Automation V1 Sprint 001 Checklist

- [x] **TK-951** 设计自动化控制器模型、执行状态机与阶段路由（负责人：Architecture｜优先级：P0｜截止：2026-03-20｜状态：done）
  - 执行记录：plan=输出 automation-v1 控制模型文档并明确模式状态机阶段契约高风险门禁stage-to-surface 路由与 preflight 契约;result=已新增 automation-controller-model.md 并同步 Run Request/Execution Context 契约高风险动作目录与 GateResult 接口及路由冲突回退规则 同时更新 TK-951 任务卡与 sprint 索引引用;verify=`PATH=/opt/homebrew/bin:$PATH npm run check` 通过
  - 执行记录：review_delta=已完成 TK-951 自检复核并生成 `code-review/verified_review_tk-951-design-automation-controller-model.md`，结论为无阻断问题;verify=复核确认控制模型文档与任务台账同步一致 可直接进入 TK-952
- [x] **TK-952** 实现 `run` 命令最小编排能力与路由执行（负责人：Core Runtime｜优先级：P0｜截止：2026-03-21｜状态：done）
  - 执行记录：plan=实现 run 命令最小编排主链路，覆盖 preflight、stage->surface 路由分发、dry-run 预览和失败退出码稳定化;result=已新增 `src/commands/run-command.js` 并接入 `command-registry` 与 `cli` 分发，同时扩展 `governor.schema.json` 的 automation 路由/preflight 配置，补齐 `test/commands/run-command.test.js` 四条关键路径;verify=`PATH=/opt/homebrew/bin:$PATH node --test` 全量通过
  - 执行记录：review_delta=已完成 TK-952 自检复核并生成 `code-review/verified_review_tk-952-implement-run-command.md`，结论为无阻断问题;verify=复核确认 run 命令满足最小编排验收项，可继续进入 TK-953
  - 执行记录：review_delta=按评审意见重构 run 流程为 plan/task 对齐模型（含任务开发+代码评审循环）并将角色 AI 与 preflight 探针改为 `automation.surfaces/process/taskLoop` 配置驱动;verify=`PATH=/opt/homebrew/bin:$PATH node --test` 与 `PATH=/opt/homebrew/bin:$PATH npm run check` 通过
  - 执行记录：review_delta=按新增评审意见补齐前置循环流程：需求草案 review/复核 loop 与技术方案生成/review/复核修改 loop，并支持 `taskLoop.stageId` + `draftReviewLoop/solutionReviewLoop` 配置覆盖;verify=`PATH=/opt/homebrew/bin:$PATH node --test test/commands/run-command.test.js`、`PATH=/opt/homebrew/bin:$PATH node --test`、`PATH=/opt/homebrew/bin:$PATH npm run check` 均通过
  - 执行记录：review_delta=补充默认流程+用户自编排技术方案文档并把该方案纳入 sprint 索引，同时优化 TK-952 任务卡结果描述，明确“默认模板 + 配置编排”双轨策略;verify=文档路径与任务台账已对齐，无冲突记录
- [x] **TK-953** 实现权限分级与高风险人工确认门禁（负责人：Security｜优先级：P0｜截止：2026-03-23｜状态：done）
  - 执行记录：plan=在 run 流程中实现权限分级模型高风险识别与人工确认门禁，并补齐 required-surface 在 preflight 的 pause/block 策略;result=已在 `src/commands/run-command.js` 新增 `policy-gate` 阶段与风险规则引擎，支持 `--approve-risk` 显式确认并把策略结果写入 run 输出（`policy`/`preflight.pausing`）；同时补齐 `test/commands/run-command.test.js` 覆盖非交互阻断交互暂停确认放行与 required-surface 暂停;verify=`node --test test/commands/run-command.test.js` 与 `node --test` 均通过
  - 执行记录：review_delta=按评审意见将可复用工具函数抽离到 `src/commands/automation-shared.js` 并由 run-command 引用，同时新增 `test/commands/automation-shared.test.js` 覆盖风险标签解析、证据提取与文件读取工具;verify=`node --test test/commands/automation-shared.test.js test/commands/run-command.test.js` 与 `node --test` 均通过
  - 执行记录：review_delta=按评审意见扩展为全仓公共 utils：新增 `src/utils/common.js`，并将 commands/cli/reporting/slots/workflow/config/standards/adapters 的重复通用函数迁移为共享实现，同时新增 `test/utils/common.test.js`;verify=`npm run check` 与 `node --test` 均通过
  - 执行记录：review_delta=按评审意见补充 import 代码规范与可执行校验：更新 `code_standards.md` 新增 `CS-005`，新增 `scripts/governance/check-esm-import-specifiers.js` 并接入 `npm run check:imports`，同时在 README 中补充“如何新增代码规范”的步骤说明;verify=`npm run check:imports`、`npm run check:code-standards`、`npm run check`、`node --test` 均通过
- [ ] **TK-954** 实现自动化执行审计日志与恢复检查点（负责人：Platform｜优先级：P1｜截止：2026-03-24｜状态：todo）
- [ ] **TK-955** 构建多 AI 自动化验收脚本与 CI smoke gate（负责人：QA/Release｜优先级：P1｜截止：2026-03-25｜状态：todo）
- [ ] **TK-956** 输出编排解释结果（默认/自定义）（负责人：Core Runtime｜优先级：P1｜截止：2026-03-26｜状态：todo）
- [ ] **TK-957** 增加流程配置校验与解释命令入口（负责人：DX/Runtime｜优先级：P1｜截止：2026-03-27｜状态：todo）
