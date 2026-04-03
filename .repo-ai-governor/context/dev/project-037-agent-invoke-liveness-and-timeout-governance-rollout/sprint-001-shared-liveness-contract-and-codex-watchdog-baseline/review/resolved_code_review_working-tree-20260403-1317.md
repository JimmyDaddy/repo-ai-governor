# Code Review: working tree 2026-04-03 13:17

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/plan.md`
3. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-502-integrate-remote-api-streaming-liveness-and-execution-diagnostics-projection.md`
4. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-503-extend-remote-api-onboarding-verification-and-credential-boundary-surfaces.md`
5. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/TK-504-add-remote-api-delivery-verification-and-clean-room-smoke-coverage.md`
6. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/tasks.csv`
8. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
9. `apps/cli/src/commands/connect-command.ts`
10. `apps/cli/src/commands/doctor-command.ts`
11. `apps/cli/src/commands/verify-command.ts`
12. `apps/cli/src/runtime/adapter-verification-runtime.ts`
13. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
14. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
15. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
16. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
17. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
18. `docs/local-adoption-playbook.md`
19. `docs/local-adoption-playbook.zh-CN.md`
20. `packages/adapter-sdk/src/layered-health-check-runtime.ts`
21. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
22. `packages/adapters/claude-code/src/claude-code-provider-local-config-runtime.ts`
23. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
24. `packages/adapters/codex/src/codex-agent-adapter.ts`
25. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
26. `packages/config/src/schema-validator.ts`
27. `packages/config/test/config.unit.test.ts`
28. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
29. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
30. `packages/core-orchestration-service/src/types/index.ts`
31. `packages/core-orchestration-service/src/types/interfaces/index.ts`
32. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`
33. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
34. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
35. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
36. `packages/orchestration-service-client/src/index.ts`
37. `packages/orchestration-service-client/src/types/index.ts`
38. `packages/orchestration-service-client/src/types/interfaces/index.ts`
39. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
40. `packages/shared/src/constants/adapter-runtime.constant.ts`
41. `packages/shared/src/i18n/locales/en-us.ts`
42. `packages/shared/src/i18n/locales/zh-cn.ts`
43. `packages/shared/src/types/interfaces/adapter-runtime-config.interface.ts`
44. `scripts/release/verify-cleanroom-local-install.js`
45. `scripts/release/verify-local-distribution.js`
46. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-001-shared-liveness-contract-and-codex-watchdog-baseline/review/resolved_code_review_working-tree-20260403-1121.md`
47. `.repo-ai-governor/context/dev/project-037-agent-invoke-liveness-and-timeout-governance-rollout/sprint-002-cross-adapter-liveness-rollout-and-diagnostics/tasks/DA-504-remote-api-delivery-verification-and-clean-room-smoke-coverage.md`
48. `scripts/release/remote-api-smoke-runtime.js`
49. `scripts/release/remote-api-smoke-server.entry.js`

## 2. Findings
### 2.1 [P2] Claude provider-local discovery misses repo-root settings when the command is launched from a subdirectory
- 位置: `apps/cli/src/runtime/adapter-routing-runtime.ts:356`, `packages/adapters/claude-code/src/claude-code-agent-adapter.ts:239`, `packages/adapters/claude-code/src/claude-code-provider-local-config-runtime.ts:58`
- 问题描述: `TK-503` 把 `allowProviderLocalConfig` 正式接入了 Claude Code probe，但 CLI 在构造 `ClaudeCodeAgentAdapter` 时没有把工作区根目录或已解析的仓库根目录传进去，adapter 会退回到 `process.cwd()`。随后 provider-local discovery 只读取 `<currentWorkingDirectory>/.claude/settings.json` 和 `<currentWorkingDirectory>/.claude/settings.local.json`。这意味着用户如果在 monorepo 子目录或仓库子路径里执行 `connect/doctor/verify`，即使 repo 根目录已经有 `.claude/settings.local.json`，probe 也会完全错过这份设置。
- 影响: 这是一个真实行为回归，而不是单纯的文档问题。开启 `allowProviderLocalConfig` 后，从子目录运行 CLI 会把本来可用的 provider-local credential/endpoint 误判成缺失，产出 `credential_missing:claude-code:provider-local` 或回退到 vendor default endpoint，直接破坏 `TK-503` 承诺的 read-only discovery 基线，并让 onboarding/verification 给出错误 next action。
- 建议: 要么在 `CliAdapterRoutingRuntime` 构造 Codex/Claude adapters 时显式传入 repo/workspace root，要么让 `ClaudeCodeProviderLocalConfigRuntime` 按仓库边界向上查找 `.claude/settings*.json`，而不是只看原始 `process.cwd()`。同时补一个从仓库子目录启动 CLI 的回归测试，覆盖 repo-root `.claude/settings.local.json` 被正确发现的路径。

## 3. Notes
1. 上一轮关于 `latestTextPreview` 被 `completed` 覆盖的问题已经修掉，Codex/Claude completed smoke case 也补了回归断言。
2. 本轮没有再发现第二个同等级的功能性问题；但 `TK-503` / `TK-504` 的行为面较广，release smoke 本身我只做了静态审查，没有在这次 CR 里整套重跑。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）
5. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）

## 复核结论（2026-04-03）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`ClaudeCodeProviderLocalConfigRuntime` 之前只读取 `HOME` 和原始 `currentWorkingDirectory` 下的 `.claude/settings*.json`。当 CLI 从仓库子目录启动时，repo-root `.claude/settings.local.json` 不会进入 merge 链，问题描述成立。
   - 处理：已改为在检测到仓库边界后，从边界目录到当前目录按层级合并 `.claude/settings.json` 与 `.claude/settings.local.json`，并补了“从子目录启动仍能发现 repo-root provider-local settings”的回归测试。

### 验证命令
1. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）
2. `PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）

## 修复执行记录（2026-04-03）

1. `2.1`：已完成
   - 变更文件：`packages/adapters/claude-code/src/claude-code-provider-local-config-runtime.ts`、`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 验证：`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）；`PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" /Users/jimmydaddy/Library/pnpm/pnpm run build`（通过）
   - 说明：provider-local 发现现在会在仓库边界内向上扫描 `.claude/settings*.json`，从子目录启动时也能保留 repo-root settings truth，同时不会跨越到仓库外的父目录。
