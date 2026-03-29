# sprint-003-react-cli-shell-default-cutover Exit Acceptance Summary

- Status: completed
- Date: 2026-03-29
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. Scope

1. `TK-312` `workflow` 命令家族注册与 create/edit 入口流
2. `TK-313` DSL 节点/连线/条件映射与 Loop guardrail 编辑
3. `TK-314` workflow 保存、compiled IR 验收与 `upgrade` 显式 React PoC
4. `TK-315` docs/help surface 收尾、project-027 出口验收与 completion audit

## 2. Exit Criteria Check

1. `workflow create/edit/preview` 三态已齐备：
   - `workflow preview` 保持只读。
   - `workflow create/edit` 已接入 workflow editor runtime，并把当前活动定义保存到 `context/workflow/active-workflow.definition.json`。
2. `Sequential / Parallel / Loop / Condition` 映射与 guardrail 已落地：
   - editor runtime 统一输出 node/edge/condition branch 摘要。
   - Loop guardrail 通过 compiler contract 强制 `maxCycles` + `maxWallTimeSeconds`。
   - Condition 分支补充了 editor 级唯一/非空 `conditionKey` 校验。
3. 保存后的流程定义可接受：
   - successful create/edit 会同时写入 compiled IR snapshot 到 `context/compiled-ir/<execution_id>.json`。
   - invalid condition branch 语义会阻断 workflow persistence。
4. `upgrade` React shell 已可进入默认用户路径：
   - 在本地 TTY + `pretty` 模式下，`upgrade` 会默认挂上共享 React shell summary。
   - 非交互/agent 风格路径继续保持原有 stdout/stderr contract。
5. docs/help surface 已同步：
   - `README.md`
   - `README.zh-CN.md`
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
6. `init` 首次 React 向导已通过真实终端验收补齐 live 交互：
   - 工作区模式与默认语言不再依赖文本输入 `1/2`。
   - 现可使用方向键选择、回车确认，确认页支持 `Y/N` 与默认回车确认。

## 3. Verification Evidence

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workflow-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`
3. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/cli-output-presenter.unit.test.ts apps/cli/test/commands/cli-command-registry.test.ts`
4. `node ./scripts/governance/check-i18n-parity-fallback.js`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
9. `pnpm -s vitest run apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/commands/init-command.test.ts`
10. 编译后 PTY 冒烟：`node ./dist/bin/repo-ai-governor.js init --output pretty --ui react`，确认 stderr 中已显示 live `Select` 控件。

## 4. Residual Risk

1. `pnpm run check` 仍受仓库既有 artifact lifecycle backlog 阻断；当前失败集中在 `.repo-ai-governor/context/artifact-registry/artifacts.csv` rows `26-50`，该问题不由 `project-027` 引入，但会影响全仓单命令收口体验。

## 5. Conclusion

1. `sprint-003-react-cli-shell-default-cutover` exit acceptance 通过。
2. `project-027` 的 M3 目标已达到可关闭状态，允许进入 project completion audit。
