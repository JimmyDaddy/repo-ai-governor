# TK-299 upgrade/workspace lifecycle adopter UX 打磨

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-003-p1-productization-closure-extended`

## 1. 任务目标

在既有 `upgrade` / `workspace` CLI 基线之上，继续补强 adopter-facing 的可读性、回滚指引与 troubleshooting 口径。

## 2. Depends On

1. `TK-297`
2. `apps/cli/src/commands/upgrade-command.ts`
3. `apps/cli/src/commands/workspace-command.ts`
4. `docs/local-adoption-playbook.md`

## 3. 预期产物

1. 更可读的 upgrade/workspace pretty output 体验
2. adopter-facing 操作文档与 troubleshooting 补充
3. 对应定向测试

## 4. 实施计划

1. 盘点 pretty output 中仍偏工程化的 check/detail 文本。
2. 补强 upgrade/workspace 关键检查项的人类可读描述。
3. 在 adoption 文档中补齐 artifact/rollback/failure summary 解释。
4. 通过 presenter / output-contract 定向验证锁定体验。

## 5. 验证命令

1. `pnpm vitest run --config vitest.integration.config.ts apps/cli/test/cli-output-presenter.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始补强 `upgrade/workspace` attention checks 的 pretty output 可读性，并回灌 adopter-facing 文档。
3. 2026-03-28：已完成 presenter 可读性补强、adoption playbook / README troubleshooting 更新，以及定向测试、类型检查与构建验证。
4. 2026-03-28：基于 `resolved_code_review_tk-293-300-productization-closeout-working-tree.md` 完成 CR 收口修复，补齐带空格 workspace 路径的 JSON detail 解析、已发布文档入口回灌与真实 success path pretty 可见性覆盖，并复跑定向测试、类型检查与治理同步校验。
5. 2026-03-28：已处理后续 diff comments，将新增 check id/detail key 收敛到 `apps/cli/src/constants/cli-command-result-check.constant.ts`，把 presenter 的 check label/detail 分发改为 enum + switch，并为新增 pretty labels/detail 文案接入 i18n runtime 与 translation-key coverage。
