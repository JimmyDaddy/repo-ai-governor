# checklist

- [x] TK-283 package-level build typecheck test pilot 与 core package cutover
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-27：状态切换为 `in_progress`，开始盘点 package-level pilot 候选、脚本下沉边界与 core package cutover 输入。
  - 2026-03-28：选择 `packages/core-memory-semantics` 作为首个 core package pilot，新增 package-level `build / typecheck / test` 入口与局部 tsconfig。
  - 2026-03-28：验证通过：`pnpm --dir packages/core-memory-semantics run typecheck`、`pnpm --dir packages/core-memory-semantics run test`、`pnpm --dir packages/core-memory-semantics run build`、`pnpm run check:fast`。
  - 2026-03-28：状态切换为 `completed`，首个 core package pilot 已完成切换。
  - 2026-03-28：完成 CR 复核中的 `2.2` 修复，`scripts/build/copy-runtime-assets.js` 改为基于 resolved package Set 差集判断未知 `--package` 目标，并随 `resolved_code_review_working-tree-20260328.md` 一并收口。
- [x] TK-284 turbo package graph 与 cache policy cutover
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始基于 `core-memory-semantics` pilot 收敛 Turbo package graph 与 cache policy cutover 方案。
  - 2026-03-28：为 `shared -> memory-store-adapter -> core-memory -> core-memory-semantics` 依赖链补齐 package-level 入口与局部 tsconfig，并在 `turbo.json` 中接入 package task graph / cache policy。
  - 2026-03-28：验证通过：两次 `pnpm run check:package-local:pilot`（第二次 `12/12 cached`）、`pnpm run check:fast`、`pnpm run check`。
  - 2026-03-28：状态切换为 `completed`，Turbo package graph 与 cache policy pilot cutover 已完成。
  - 2026-03-28：完成 CR 复核中的 `2.4` 修复，`scripts/ci/run-repo-global-gates.js` 将 JSON 模式失败 `stderr` 预览提升到 2000 字节，并通过 `test/gate-runner-output.integration.test.ts` 回归测试验证收口。
- [x] TK-285 sprint-002 出口验收与 sprint-003 输入约束
  - 2026-03-27：任务创建，状态初始化为 `planned`。
  - 2026-03-28：状态切换为 `in_progress`，开始基于 `TK-283/TK-284` 的完成态整理 sprint-002 exit criteria 与 sprint-003 follow-up 约束。
  - 2026-03-28：sprint-002 exit criteria 全部满足（4 包 pilot 完成、Turbo cache 命中验证、check 全量兼容、sprint-003 输入约束冻结），CR 已收口，状态切换为 `completed`。
