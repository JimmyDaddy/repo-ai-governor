# Sprint 006 Checklist

- [x] **TK-107** 外置 `AGENTS.md` 当前上下文文件（负责人：CLI｜优先级：P0｜截止：2026-04-22｜状态：done）
  - 执行记录：plan=把 AGENTS 当前上下文从入口文件内联内容改为独立依赖文件，并同步 schema、init、doctor、当前仓库入口和 sprint 文档;result=已新增 `.repo-ai-governor/context/current-context.md`，并让 `init` 生成 context file、`doctor` 校验 context file、schema 支持 `agentEntry.contextFile`;verify=`npm run check`
  - 执行记录：review_delta=已完成 `TK-107` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-107-externalize-agent-current-context.md`;verify=复核确认运行时、模板、schema、测试、当前仓库 `AGENTS.md` 与 sprint 文档已经对齐
- [ ] **TK-302** 实现插槽加载与冲突处理（负责人：Workflow｜优先级：P0｜截止：2026-04-23｜状态：todo）
  - 执行记录：plan=纳入 sprint-006 Wave A，负责把已启用插槽从静态资产推进到运行时输入，补齐发现机制、优先级决策和冲突报错;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-301`、`TK-103` 和 `TK-402/TK-403/TK-404` 依赖关系对齐
- [ ] **TK-402** 完成 Codex / Codex CLI 接入样例（负责人：Adapters｜优先级：P0｜截止：2026-04-24｜状态：todo）
  - 执行记录：plan=纳入 sprint-006 Wave B，负责提供 Codex / Codex CLI 的规则注入模板、说明和验收样例;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-401`、`TK-204` 和 `TK-302` 的目标顺序对齐
- [ ] **TK-403** 完成 GitHub Copilot / GitHub Copilot CLI 接入样例（负责人：Adapters｜优先级：P0｜截止：2026-04-25｜状态：todo）
  - 执行记录：plan=纳入 sprint-006 Wave B，负责提供 GitHub Copilot / GitHub Copilot CLI 的注入方案、说明和验收样例;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-401`、`TK-204` 和 `TK-302` 的目标顺序对齐
- [ ] **TK-404** 完成 Claude Code 接入样例（负责人：Adapters｜优先级：P0｜截止：2026-04-26｜状态：todo）
  - 执行记录：plan=纳入 sprint-006 Wave B，负责提供 Claude Code 的规则注入方案、说明和验收样例;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-401`、`TK-204` 和 `TK-302` 的目标顺序对齐
