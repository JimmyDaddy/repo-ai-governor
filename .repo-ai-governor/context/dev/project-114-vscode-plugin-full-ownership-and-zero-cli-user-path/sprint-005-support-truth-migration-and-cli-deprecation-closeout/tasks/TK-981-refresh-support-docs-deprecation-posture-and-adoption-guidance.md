# TK-981 refresh support docs deprecation posture and adoption guidance

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-005-support-truth-migration-and-cli-deprecation-closeout`

## 1. 任务目标

Plan the support-doc, deprecation, and adoption-guidance refresh for the zero-CLI plugin-first path.

## 2. Depends On

1. execute plugin-first evidence and migration rehearsal bundle

## 3. 预期产物

1. support truth package artifact for TK-981
2. task card update for TK-981
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. apps/vscode-extension/README.md
2. .repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/project-113-vscode-primary-workbench-full-cutover-completion-audit-summary.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. 待执行：按任务范围补充 fast/targeted verification。
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks" --task-id TK-981

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks" --task-id TK-981
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks" --task-id TK-981
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：public support docs 已在同窗口刷新：`apps/vscode-extension/README.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md` 现统一声明 VS Code 是 built-source checkout + local VSIX 路径上的 primary human-facing workbench，而 CLI 收口为 optional automation / scriptable / session-shell surface。
3. 2026-04-18：新的 support matrix 与 maintainer playbook 证据回链已切到 `project-114` sprint-local immutable snapshot + zero-cli rehearsal summary，不再继续把 public truth 锁死在 `project-113` 的旧 evidence path。
4. 2026-04-18：当前任务切换为 `completed`。

## 10. 产出

1. `apps/vscode-extension/README.md` 与 `docs/support-matrix*.md` / `docs/local-adoption-playbook*.md` / `docs/maintainer-validation-playbook*.md` 已完成 truth sync
2. 当前任务卡已记录新的 zero-cli public wording 与 evidence-backlink posture
