# Sprint 002 Checklist

- [x] **TK-201** 设计流程模板模型（负责人：Workflow｜优先级：P0｜截止：2026-03-31｜状态：done）
  - 执行记录：plan=定义流程阶段模型、输入输出和门禁字段，作为 Governance Engine 的上游结构;result=已创建任务卡并纳入 sprint-002;verify=与 `docs/mvp-issue-backlog.md` 对齐
  - 执行记录：plan=新增独立 workflow template schema、标准串行模板和模板覆盖 helper，并把默认流程顺序同步到初始化模板文案;result=已新增 `docs/mvp/sprint-002/workflow-template-model.md`、`src/config/schema/workflow-template.schema.json`、`src/workflow/template-model.js` 与对应测试，标准流程现明确为 `plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync`;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-201` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-201-design-workflow-template-model.md`，结论为无阻断问题;verify=复核确认模型文档、schema、helper、测试和初始化模板文案已经对齐
- [x] **TK-203** 设计标准规范包数据模型（负责人：Standards｜优先级：P0｜截止：2026-04-01｜状态：done）
  - 执行记录：plan=定义规范实体结构、强约束/建议项区分和双视图渲染字段;result=已创建任务卡并纳入 sprint-002;verify=与 `docs/mvp-issue-backlog.md` 对齐
  - 执行记录：plan=新增独立 standards package schema、官方基础规范包骨架和 AI/Human 双视图渲染 helper;result=已新增 `docs/mvp/sprint-002/standards-package-model.md`、`src/config/schema/standards-package.schema.json`、`src/standards/package-model.js` 与对应测试，模型现明确支持五类规范、`required/recommended` 区分和双语双视图;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-203` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-203-design-standards-package-model.md`，结论为无阻断问题;verify=复核确认规范包模型文档、schema、helper 和测试已经对齐
- [ ] **TK-301** 设计声明式插槽 schema（负责人：Slots｜优先级：P0｜截止：2026-04-02｜状态：todo）
  - 执行记录：plan=定义插槽元信息、触发条件和阻断策略字段;result=已创建任务卡并纳入 sprint-002;verify=与 `docs/mvp-issue-backlog.md` 对齐
- [ ] **TK-401** 设计统一适配器接口（负责人：Adapters｜优先级：P0｜截止：2026-04-03｜状态：todo）
  - 执行记录：plan=定义适配器输入输出模型、规则注入接口与工具差异化能力声明;result=已创建任务卡并纳入 sprint-002;verify=与 `docs/mvp-issue-backlog.md` 对齐
