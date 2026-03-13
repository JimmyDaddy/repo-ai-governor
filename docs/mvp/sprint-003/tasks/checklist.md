# Sprint 003 Checklist

- [x] **TK-202** 实现 Governance Engine 最小执行器（负责人：Workflow｜优先级：P0｜截止：2026-04-07｜状态：done）
  - 执行记录：plan=纳入 sprint-003 Wave A，负责实现阶段状态机、阶段结果模型和失败中止逻辑;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md` 和 `docs/mvp/sprint-002/workflow-template-model.md` 对齐
  - 执行记录：plan=新增最小 Governance Engine 执行器，支持按模板顺序执行阶段、展开依赖、聚合输出，并在失败时阻断后续阶段;result=已新增 `docs/mvp/sprint-003/governance-engine-runtime.md`、`src/workflow/governance-engine.js` 与对应测试，当前执行器可基于 template 或 `workflowConfig` 运行并输出统一阶段结果模型;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-202` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-202-implement-governance-engine.md`，结论为无阻断问题;verify=复核确认执行器实现、测试、任务记录和实现摘要已经对齐
- [x] **TK-204** 编写标准规范包 v1 内容（负责人：Standards｜优先级：P0｜截止：2026-04-08｜状态：done）
  - 执行记录：plan=纳入 sprint-003 Wave A，负责补齐官方默认规范内容和中英文双视图文本;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md` 和 `docs/mvp/sprint-002/standards-package-model.md` 对齐
  - 执行记录：plan=新增 official/base 规范内容与消费者过滤 helper，覆盖代码、工程、流程、质量、协作五类规则并提供中英文双视图;result=已新增 `docs/mvp/sprint-003/standards-package-v1-content.md`、`src/standards/official-base-package.js` 与对应测试，当前 `official/base` 已可直接被 `plan/check/review` 消费;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-204` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-204-author-standards-package-v1.md`，结论为无阻断问题;verify=复核确认规范内容、消费者过滤、测试和实现摘要已经对齐
- [x] **TK-205** 实现 `plan` 命令（负责人：CLI｜优先级：P0｜截止：2026-04-10｜状态：done）
  - 执行记录：plan=纳入 sprint-003 Wave B，负责将流程模板和规范包接入方案生成与任务拆解产物写入;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`docs/cli-command-design.md` 和项目/sprint 产物规范对齐
  - 执行记录：plan=实现 `plan` 命令，复用 Governance Engine 执行 `plan -> breakdown`，并真实生成 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 与 `tasks/TK-xxx.md`;result=已新增 `docs/mvp/sprint-003/plan-command-runtime.md`、`src/commands/plan-command.js`、`src/commands/templates/plan-documents.js` 与对应测试，CLI 现支持 `plan --dry-run`、`--out` 和 JSON/Markdown 输出;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-205` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-205-implement-plan-command.md`，结论为无阻断问题;verify=复核确认命令实现、模板、测试、任务记录和实现摘要已经对齐
- [x] **TK-206** 实现 `check` 命令（负责人：CLI｜优先级：P0｜截止：2026-04-11｜状态：done）
  - 执行记录：plan=纳入 sprint-003 Wave B，负责执行最小治理检查并输出阶段汇总与失败原因;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`docs/cli-command-design.md` 和 `TK-202/TK-204` 依赖关系对齐
  - 执行记录：plan=实现 `check` 命令，复用 Governance Engine 校验 plan、breakdown 和 self-check 三段治理产物，并支持 `--stage`、`--changed-only` 与 `--write-report`;result=已新增 `docs/mvp/sprint-003/check-command-runtime.md`、`src/commands/check-command.js` 与对应测试，CLI 现可输出阶段汇总、命中规则、findings 和报告文件;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=为让 `check` 校验真实产物而不是放宽规则，已同步补齐 `plan.md` 模板中的范围/验收/验证路径章节，并把任务拆解同步规则纳入 `check` 消费面;verify=复核确认 `plan` 产物、规范内容和 `check` 规则保持一致
  - 执行记录：review_delta=已完成 `TK-206` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-206-implement-check-command.md`，结论为无阻断问题;verify=复核确认命令实现、测试、任务记录和实现摘要已经对齐
