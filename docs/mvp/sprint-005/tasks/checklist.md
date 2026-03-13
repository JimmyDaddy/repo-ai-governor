# Sprint 005 Checklist

- [x] **TK-303** 提供示例插槽包（负责人：Workflow｜优先级：P0｜截止：2026-04-18｜状态：done）
  - 执行记录：plan=纳入 sprint-005 Wave A，负责补齐安全审查插槽与文档产出插槽两个官方示例，为后续样例流程与验收仓库提供可复用输入;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-301` 和 `TK-505` 依赖关系对齐
  - 执行记录：plan=实现官方示例插槽包，提供安全审查与文档产出两类 YAML 示例，并补齐 README 与 schema 校验测试;result=已新增 `examples/slot-packages/official/`、`docs/mvp/sprint-005/example-slot-package.md` 与 `test/slots/example-slot-package.test.js`;verify=`/opt/homebrew/bin/npm run test` 通过
  - 执行记录：review_delta=已完成 `TK-303` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-303-provide-example-slot-package.md`;verify=复核确认示例插槽 YAML、接入说明、能力边界和测试覆盖已经对齐
- [x] **TK-503** 提供 CI 调用命令与退出码约定（负责人：CLI｜优先级：P0｜截止：2026-04-19｜状态：done）
  - 执行记录：plan=纳入 sprint-005 Wave A，负责收口非交互式运行参数、退出码语义与 CI 调用姿势，为模板和验收仓库提供统一入口;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-206`、`TK-501` 和 `TK-504/TK-505` 依赖关系对齐
  - 执行记录：plan=实现 CI 调用约定，补齐退出码文档、脚本入口，并让 `review/review-verify` 在 strict 模式下可把 warning 视为失败;result=已新增 `docs/mvp/sprint-005/ci-invocation-contract.md`、`scripts/ci/`、命令级 `--strict` 支持和对应测试;verify=`/opt/homebrew/bin/npm run test` 通过
  - 执行记录：review_delta=已完成 `TK-503` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-503-provide-ci-invocation-contract.md`;verify=复核确认 CI 脚本、退出码语义、命令接线和测试覆盖已经对齐
- [x] **TK-504** 提供示例 CI 模板（负责人：DevEx｜优先级：P0｜截止：2026-04-20｜状态：done）
  - 执行记录：plan=纳入 sprint-005 Wave B，负责基于 `TK-503` 的 CI 约定提供至少一个主流 CI 模板与接入说明;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-503` 依赖关系对齐
  - 执行记录：plan=实现主流 CI 模板，优先提供 GitHub Actions 样例，并复用 `scripts/ci/` 形成最小门禁链路;result=已新增 `examples/ci/github-actions-governance.yml` 与 `docs/mvp/sprint-005/github-actions-template.md`;verify=`/opt/homebrew/bin/npm run test` 通过
  - 执行记录：review_delta=已完成 `TK-504` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-504-provide-example-ci-template.md`;verify=复核确认模板步骤、环境变量约定和脚本引用关系已经对齐
- [x] **TK-505** 准备 MVP 验收仓库与验收脚本（负责人：QA｜优先级：P0｜截止：2026-04-22｜状态：done）
  - 执行记录：plan=纳入 sprint-005 Wave B，负责准备 MVP 验收仓库、验收脚本和记录模板，串起 init/plan/check/review/report 的验收路径;result=已创建任务卡并排入当前 sprint;verify=与 `docs/mvp-issue-backlog.md`、`TK-104`、`TK-205`、`TK-206`、`TK-303`、`TK-503` 依赖关系对齐
  - 执行记录：plan=实现 MVP 验收资产，提供需求输入、验收记录模板、端到端验收脚本，并把它纳入自动化测试;result=已新增 `examples/mvp-acceptance/`、`scripts/acceptance/run-mvp-acceptance.sh`、`docs/mvp/sprint-005/mvp-acceptance-kit.md` 与 `test/acceptance/mvp-acceptance-kit.test.js`;verify=`/opt/homebrew/bin/npm run test` 通过
  - 执行记录：review_delta=已完成 `TK-505` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-505-prepare-mvp-acceptance-kit.md`;verify=复核确认验收脚本、样例输入、记录模板和端到端测试已经对齐
