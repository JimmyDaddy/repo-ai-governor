# Multi-AI Automation Smoke Guide

- Date: 2026-03-17
- Project: `automation-v1`
- Sprint: `sprint-001`

## Goal

提供可复现的多入口自动化 smoke gate，验证 `codex / claude-code / github-copilot` 三入口与 `multi-ai-dev-review` 分工路由。

## Scripts

1. 全量场景（推荐）
   - `bash scripts/acceptance/run-automation-v1-smoke.sh`
2. 单入口场景
   - `bash scripts/acceptance/run-automation-codex-smoke.sh`
   - `bash scripts/acceptance/run-automation-claude-code-smoke.sh`
   - `bash scripts/acceptance/run-automation-github-copilot-smoke.sh`
3. CI gate
   - `bash scripts/ci/run-automation-smoke.sh`

## What Is Verified

1. 三入口单独接管时，`run` 的所有 routeKey 都落到指定 surface。
2. `multi-ai-dev-review` 下的分工路由正确：
   - `requirements-draft/task-implementation` -> `codex`
   - `draft-review/technical-solution-review` -> `claude-code`
   - `task-code-review` -> `github-copilot`
3. 输出包含执行编号与阶段路由记录，可用于审计和回放。

## Human Checkpoints

1. `policy.decision=pause_for_approval` 时需要人工确认（例如命中 `dangerous_command`）。
2. 非交互模式命中高风险标签时会阻断，不会继续派发。
3. `required-surface` 不可用时会在 preflight 报错或暂停，需人工处理入口可用性。

## CI Workflow

1. Workflow: `.github/workflows/automation-smoke.yml`
2. Trigger: `push(main)`、`pull_request`、`workflow_dispatch`
3. Gate command: `bash scripts/ci/run-automation-smoke.sh`

## Local Tips

1. 指定输出为 JSON：`REPO_AI_GOVERNOR_AUTOMATION_SMOKE_FORMAT=json`
2. 仅跑单入口：`REPO_AI_GOVERNOR_AUTOMATION_SMOKE_ENTRY=codex|claude-code|github-copilot`
3. 复用固定工作目录：`REPO_AI_GOVERNOR_AUTOMATION_SMOKE_WORKSPACE=/path/to/workspace`
