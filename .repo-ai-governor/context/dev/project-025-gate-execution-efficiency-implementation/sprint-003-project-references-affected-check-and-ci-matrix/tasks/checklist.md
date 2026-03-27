# checklist

- [x] TK-286 ts project references 与 incremental build baseline
  - 2026-03-28：任务创建，状态初始化为 `planned`。
  - 2026-03-28：sprint-003 激活，状态切换为 `in_progress`。
  - 2026-03-28：为 `shared -> memory-store-adapter -> core-memory -> core-memory-semantics` 依赖链补齐 `references`、`composite`、`incremental`、`declaration` 与 `tsBuildInfoFile`，并新增 `tsconfig.package-local-pilot.build.json`。
  - 2026-03-28：验证通过：两次 `pnpm run check:package-local:pilot:incremental`、`pnpm run check:affected -- --changed-file packages/shared/src/index.ts`、`pnpm run check:full`；状态切换为 `completed`。
- [x] TK-287 affected gate planner 与 ci matrix rollout
  - 2026-03-28：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始实现 `affected` planner、runner cutover 与 CI matrix 分层。
  - 2026-03-28：新增 `scripts/ci/run-affected-check.js`，完成 `run-gate-check.js` 的 `affected` 真执行路径、`package.json` 入口、CI matrix 分层与 integration test 更新。
  - 2026-03-28：验证通过：`pnpm exec biome check ...`、`pnpm vitest run --config vitest.integration.config.ts test/gate-runner-output.integration.test.ts`、dry-run JSON / wrapper 回归与 `pnpm run check:affected -- --changed-file packages/shared/src/index.ts`；状态切换为 `completed`。
  - 2026-03-28：完成 CR `2.2` 修复，补充 `.codex/` 与 `docs/` 的 doc-only 路由覆盖，并新增 `.codex` 文档变更回归测试；`resolved_code_review_working-tree-20260328-sprint-003.md` 已收口。
- [x] TK-288 sprint-003 出口验收与 project-025 completion closeout
  - 2026-03-28：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始执行 sprint-003 exit acceptance、project-025 completion audit 与 truth surface closeout。
  - 2026-03-28：产出 `project-025-gate-execution-efficiency-implementation-completion-audit-summary.md`，同步 project / sprint plan、delivery registry、completed history、current-context 与 master execution plan。
  - 2026-03-28：治理一致性检查与 `pnpm run check` 通过；状态切换为 `completed`。
