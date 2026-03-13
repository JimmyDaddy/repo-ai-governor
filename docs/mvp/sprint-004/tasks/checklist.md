# Sprint 004 Checklist

- [x] **TK-207** 实现 `review` 命令（负责人：CLI｜优先级：P0｜截止：2026-04-14｜状态：done）
  - 执行记录：plan=纳入 sprint-004 Wave A，负责生成治理评审结论、发现列表和状态化 CR 文件;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`docs/cli-command-design.md` 和 `TK-202/TK-204` 依赖关系对齐
  - 执行记录：plan=实现 `review` 命令，复用 Governance Engine 生成评审结论、发现列表和状态化 CR 文件，并支持指定路径与默认 git working tree 目标发现;result=已新增 `docs/mvp/sprint-004/review-command-runtime.md`、`src/commands/review-command.js` 与对应测试，CLI 现可输出 `pass/warn/fail` 结论并生成 `review_<slug>.md`;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-207` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-207-implement-review-command.md`，并在复核中补齐 untracked file 的 git 目标发现逻辑;verify=复核确认命令实现、CLI 接线、测试覆盖和任务记录已经对齐
- [x] **TK-208** 实现 `review-verify` 命令（负责人：CLI｜优先级：P0｜截止：2026-04-15｜状态：done）
  - 执行记录：plan=纳入 sprint-004 Wave A，负责将复核结果追加回同一份 CR 文件并推进状态;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`docs/cli-command-design.md` 和 `TK-207` 依赖关系对齐
  - 执行记录：plan=实现 `review-verify` 命令，复用 `review` 目标分析逻辑重新校验 source review 文件，并将复核结论回写到同一份 CR 生命周期内容中;result=已新增 `docs/mvp/sprint-004/review-verify-command-runtime.md`、`src/commands/review-verify-command.js` 与对应测试，CLI 现可推动 `review -> verified_review -> resolved_review` 生命周期;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-208` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-208-implement-review-verify-command.md`;verify=复核确认 source review 解析、状态流转、CLI 接线、测试覆盖和任务记录已经对齐
- [x] **TK-501** 设计统一报告模型（负责人：Reporting｜优先级：P0｜截止：2026-04-16｜状态：done）
  - 执行记录：plan=纳入 sprint-004 Wave B，负责收口 summary、markdown、json 的统一报告结构;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md` 和当前 `check --write-report` 能力边界对齐
  - 执行记录：plan=实现统一报告模型，归一 `check`、`review`、`review-verify` 的输出结构，并提供 `summary/markdown/json` 三类渲染;result=已新增 `docs/mvp/sprint-004/unified-report-model.md`、`src/reporting/report-model.js` 与对应测试，`check --write-report` 已切到统一模型;verify=`/opt/homebrew/bin/npm run check` 通过
  - 执行记录：review_delta=已完成 `TK-501` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-501-design-unified-report-model.md`;verify=复核确认模型结构、`check` 集成点、测试覆盖和任务记录已经对齐
- [ ] **TK-502** 实现 `report` 命令（负责人：CLI｜优先级：P0｜截止：2026-04-17｜状态：todo）
  - 执行记录：plan=纳入 sprint-004 Wave B，负责按统一报告模型渲染已有执行结果;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`docs/cli-command-design.md` 和 `TK-501` 依赖关系对齐
