# TK-315 docs/help surface 收尾、project-027 出口验收与 completion audit

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

完成 adopter-facing docs/help surface 收尾，并在同一任务中形成 project-027 的最终验收与 completion audit。

## 2. Depends On

1. `TK-314`

## 3. 预期产物

1. adopter docs / help surface / playbook closeout
2. sprint / project exit acceptance
3. completion audit summary 与里程碑回链

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`
6. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/tasks/TK-314-workflow-save-compiled-ir-acceptance-and-upgrade-explicit-react-poc.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`

## 6. 实施计划

1. 收口 adopter-facing docs、help surface 与 playbook，确保默认扩面、fallback、workflow 与 `upgrade` 说明同源。
2. 汇总 M1/M2/M3 证据，执行 project-027 出口验收并形成 completion audit summary。
3. 同步项目里程碑回链、task ledger、review evidence 与 closeout truth。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-code-review-status-sync.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `pnpm run check`
4. project completion audit、里程碑回链与 closeout truth 必须同时完成。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M3 清单，改为收口 docs/help surface、exit acceptance 与 completion audit。
3. 2026-03-29：完成 adopter-facing docs/help surface 收尾，已同步 README/playbook 中的 workflow save 与 `upgrade --ui react` 说明。
4. 2026-03-29：已产出 sprint exit acceptance summary 与 project completion audit summary，并回链到 `project-027` 计划里程碑。
5. 2026-03-29：补充真实项目验收沉淀，新增 `.repo-ai-governor/draft/project-027-real-project-validation-playbook.md`，汇总实施程度判断、真实项目演练顺序与可直接复用的 bash 验收脚本模板。
6. 2026-03-29：将真实项目验收内容压缩并同步进入 `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md`，形成对外 adopter 可直接执行的 runbook。
7. 2026-03-29：把 runbook 落成仓库内可执行脚本 `scripts/acceptance/run-project-027-real-project-validation.sh`，并同步修正 playbook 中关于 isolated `HOME` 与 repo-local cutover 的执行口径。
8. 2026-03-29：在临时 git 仓库中完成 `scripts/acceptance/run-project-027-real-project-validation.sh` 最小冒烟，确认 `init -> workspace execute -> workflow create/edit -> upgrade -> rollback` 自动链路可闭环。
9. 2026-03-29：复核并收口 `project-027` 全量 CR，确认过时或非缺陷项不进入修复清单，并完成 session clear 语义、descriptor 契约、stderr 宽度、schema version 守卫等已认可问题的最小安全补丁。
10. 2026-03-29：根据真实终端验收反馈，补齐 `init --ui react` 的 live Ink 选择控件；工作区模式与默认语言步骤改为键盘选择式 `Select`，确认步骤改为 `ConfirmInput`，不再依赖 `readline` 文本输入 `1/2`。
11. 2026-03-29：根据用户反馈把 CLI 默认 UI 策略切换为“交互式 TTY + pretty 默认 React、非交互/agent 风格调用保持普通模式”，并同步更新 workflow/upgrade 默认 React 路由回归与 adopter-facing 文档。

## 10. 产出

1. 已完成：adopter docs / help surface / playbook closeout。
2. 已完成：sprint / project exit acceptance evidence。
3. 已完成：`project-027` completion audit summary 与里程碑回链。
4. 已完成：真实项目验收与实施程度检查 draft，含 `dist` rehearsal、React shell 观察步骤与 workspace/workflow/upgrade/connect 验收脚本模板。
5. 已完成：对外 adoption playbook runbook 压缩版，中英文已同步。
6. 已完成：仓库内可执行的真实项目验收脚本与对应 playbook/draft 入口同步。
7. 已完成：真实脚本最小冒烟验证证据，确认自动链路可以在临时 git 仓库中闭环。
8. 已完成：`resolved_code_review_project-027-full-implementation.md`，含复核结论、修复记录与定向验证证据。
9. 已完成：`init --ui react` 首次初始化向导的 live 选择式交互补齐，真实终端中已可通过方向键与回车完成工作区模式/默认语言选择。
10. 已完成：CLI 默认 UI 路由切换；用户在本地 TTY + `pretty` 模式下默认进入 React shell，而 CI/非交互/agent 风格调用继续保持普通输出契约。
