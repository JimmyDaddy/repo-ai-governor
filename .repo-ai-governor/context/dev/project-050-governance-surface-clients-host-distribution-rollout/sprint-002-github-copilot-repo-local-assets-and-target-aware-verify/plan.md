# sprint-002-github-copilot-repo-local-assets-and-target-aware-verify 计划

- Status: completed
- Date: 2026-04-06
- Project: `project-050-governance-surface-clients-host-distribution-rollout`
- Sprint Goal: 落地 GitHub Copilot repo-local assets 与 target-aware verify。

## 1. Task Package

1. `TK-577` freeze GitHub Copilot repo-local target matrix and apply contract
2. `TK-578` implement GitHub Copilot repo-local instructions skills agents export and target-aware verify
3. `TK-579` close repo-local host assets MVP with docs sync and acceptance smoke

## 2. Exit Criteria

1. GitHub Copilot `repo_local` target matrix 已冻结。
2. `.github/copilot-instructions.md`、`.github/instructions/**`、`.github/skills/`、`.github/agents/` 与可选 `.github/mcp.json` 已纳入正式 export/verify 路径。
3. verify 能显式区分 `repo_local` 与 reserved `github_com_agent`，不再混写 target 语义。

## 3. Milestones

1. 2026-04-06：创建 `sprint-002-github-copilot-repo-local-assets-and-target-aware-verify`，作为 Copilot repo-local rollout sprint。
2. 2026-04-06：已完成 Copilot repo-local target matrix、repo-local assets export、target-aware verify 与 reserved `github_com_agent` fail-closed closeout。
