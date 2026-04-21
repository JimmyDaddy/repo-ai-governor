# TK-1027 repair targeted biome format drift on existing working-tree files

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-118-working-tree-format-drift-remediation`
- Sprint: `sprint-001-targeted-biome-format-repair`

## 1. 任务目标

对 formatter 已明确指出的 dirty worktree 文件执行定向 biome format repair，不扩展到整仓其他文件。

## 2. Depends On

1. `project-117` remediation closeout

## 3. 预期产物

1. `apps/cli/src/main.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. package.json
3. apps/cli/src/main.ts
4. apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts
5. apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts
6. apps/vscode-extension/test/vscode-extension-chat-participant.test.ts

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-117-artifact-lifecycle-and-gate-contract-remediation/project-117-artifact-lifecycle-and-gate-contract-remediation-completion-audit-summary.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-118-working-tree-format-drift-remediation/plan.md

## 6. 实施计划

1. 仅对 formatter 点名的文件执行 `biome format --write`。
2. 复查 git diff，确认没有意外扩面。
3. 将结果交给验证与 review 任务继续收口。

## 7. Development Verification

1. pnpm exec biome format --write apps/cli/src/main.ts apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts
2. git diff --stat -- apps/cli/src/main.ts apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts

## 8. Delivery Verification

1. `TK-1028` 承接

## 9. 执行记录

1. 2026-04-21：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`project-118 / sprint-001` 已创建并激活；当前任务切换为 `in_progress`，用于执行定向 biome format repair。
3. 2026-04-21：已执行 `pnpm exec biome format --write apps/cli/src/main.ts apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`，4 个 formatter 点名文件已完成定向写回，且未扩大 formatter 命令的作用域。

## 10. 产出

1. `apps/cli/src/main.ts`
2. `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`
