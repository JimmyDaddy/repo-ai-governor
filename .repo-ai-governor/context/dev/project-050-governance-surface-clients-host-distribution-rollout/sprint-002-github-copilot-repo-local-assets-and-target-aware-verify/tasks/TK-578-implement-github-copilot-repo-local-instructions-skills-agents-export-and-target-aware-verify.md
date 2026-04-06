# TK-578 implement GitHub Copilot repo-local instructions skills agents export and target-aware verify

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-578`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-github-copilot-repo-local-assets-and-target-aware-verify`
- Project: `project-050-governance-surface-clients-host-distribution-rollout`

## 1. 目标

实现 GitHub Copilot repo-local assets renderer，并把 target-aware verify 接到对应消费面。

## 2. Depends On

1. `TK-577`

## 3. Expected Outputs

1. `.github/copilot-instructions.md` export
2. `.github/instructions/**` / `.github/skills/` / `.github/agents/` export
3. target-aware verify baseline

## 4. Execution Notes

1. 2026-04-06：任务创建，等待 sprint-002 激活。
2. 2026-04-06：已实现 GitHub Copilot repo-local instructions / skills / agents / `.github/mcp.json` export，并把 target-aware verify 与 reserved target fail-closed 语义接入 CLI。
