# TK-733 remove public `/verify` command and capability surface

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-003-review-workflow-and-verify-removal`

## 1. 任务目标

删除 public `/verify` 的 CLI、session-shell、catalog、README/help 暴露面，但保留底层 readiness checks 作为 `connect` follow-up、`doctor` mode 与 internal preflight gate。

## 2. Depends On

1. `TK-732`
2. `apps/cli/src/commands/verify-command.ts`
3. `apps/cli/src/main.ts`

## 3. 预期产物

1. removed public verify entrypoint
2. migrated internal verification usage
3. docs/help/readme cleanup

## 4. Required Inputs

1. `apps/cli/src/constants/cli-command.constant.ts`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/README.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `TK-732`

## 6. 实施计划

1. 移除 `CliCommandName.VERIFY` 的 public registration、session-shell discoverability 与 help appendix exposure。
2. 保留 adapter verification runtime 与 durable-storage diagnostics seam，但改为由 `connect` / `doctor` / internal gate 消费。
3. 更新 README、integration wording 与 public docs，使 `/verify` deletion 与替代入口清晰可见。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm vitest apps/cli/test/commands/doctor-command.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts --run`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：将 public `VERIFY` capability 从 governed catalog、session-shell discoverability、CLI help/skeleton surface 与 README 暴露面移除。
3. 2026-04-10：保留 hidden `verify` CLI shim，仅输出结构化 migration error，引导用户改用 `doctor` 或 `connect`，同时避免旧入口继续出现在 public help surface。
4. 2026-04-10：修复 commander hidden command 注册方式与 public command-name typing seam，确保删除 `/verify` 后 build、package tests、integration tests 仍保持通过。

## 10. 产出

1. 已完成：removed public verify entrypoint
2. 已完成：docs/help/readme cleanup
