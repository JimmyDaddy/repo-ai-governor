# checklist

- [x] TK-298 Python/Go 最小治理模板实装
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始在 `packages/standards` 内补齐 Python / Go 最小治理模板与对应验证。
  - 2026-03-28：已完成 `pythonMinimalGovernancePack` / `goMinimalGovernancePack`、对应渲染投影测试与 `packages/standards/README.md` 使用说明，并通过定向测试、类型检查与构建验证。
- [x] TK-299 upgrade/workspace lifecycle adopter UX 打磨
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始补强 `upgrade/workspace` pretty output 的 adopter-facing 可读性，并回灌 playbook / README troubleshooting。
  - 2026-03-28：已完成 presenter 可读性补强、adoption 文档回灌与定向测试、类型检查、构建验证。
  - 2026-03-28：已基于 `resolved_code_review_tk-293-300-productization-closeout-working-tree.md` 完成 CR 认可项修复收口，补齐 workspace 路径 JSON detail 解析、已发布文档入口与真实 success path pretty 覆盖，并复跑定向测试、类型检查与治理同步校验。
  - 2026-03-28：已处理后续 diff comments，抽离 `CliCommandResultCheckId` 与 workspace detail enum，presenter 改为 switch 分发并接入新增文案的 i18n runtime 翻译入口，同时补齐 translation-key coverage 验证。
- [x] TK-300 sprint-003 出口验收与 sprint-004 输入约束
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始汇总 `TK-298` 与 `TK-299` 证据并冻结 `sprint-004` 输入约束。
  - 2026-03-28：已完成 sprint-003 出口验收，确认模板与 UX 两项 exit criteria 全部达成，并冻结 `sprint-004` 继续沉淀 GA 证据所需输入约束。
