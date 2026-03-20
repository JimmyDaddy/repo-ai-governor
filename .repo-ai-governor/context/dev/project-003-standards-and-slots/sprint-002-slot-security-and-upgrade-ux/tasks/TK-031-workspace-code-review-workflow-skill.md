# TK-031 仓库本地 Code Review Workflow Skill

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-002-slot-security-and-upgrade-ux`

## 1. 任务目标

建立仓库本地 `workspace-code-review-workflow` skill：读取当前上下文，面向当前工作区变更执行 code review，并将 CR 生成、复核、修复产物统一落入当前 sprint 的 `code-review/` 目录。

## 2. Depends On

1. `TK-028`

## 3. 预期产物

1. `.codex/skills/workspace-code-review-workflow/SKILL.md`
2. `.codex/skills/workspace-code-review-workflow/agents/openai.yaml`
3. `AGENTS.md` 本地技能入口映射
4. 当前 sprint 的 `verified_review_tk-031-workspace-code-review-workflow-skill.md`

## 4. Input References

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-004`、`CS-021`）
4. `/Users/jimmydaddy/.codex/skills/.system/skill-creator/SKILL.md`
5. `/Users/jimmydaddy/.codex/skills/code-review-workflow/SKILL.md`

## 5. 实施摘要

1. 使用 `init_skill.py` 在仓库 `.codex/skills` 下初始化 `workspace-code-review-workflow` skeleton。
2. 将 skill 定制为 repo-local 工作流：始终读取 `.repo-ai-governor/context/current-context.md`，并将 `review_/verified_review_/resolved_review_` 生命周期文件写入当前 sprint `code-review/`。
3. 为四类触发语句补齐明确动作映射：生成 CR、复核 CR、复核并修复、按已复核 CR 修复。
4. 在 `AGENTS.md` 与当前 sprint 台账中登记该本地 skill，确保后续执行入口与记录路径一致。

## 6. 产出

1. `.codex/skills/workspace-code-review-workflow/SKILL.md`
2. `.codex/skills/workspace-code-review-workflow/agents/openai.yaml`
3. `AGENTS.md`
4. `.repo-ai-governor/context/dev/project-003-standards-and-slots/plan.md`
5. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/plan.md`
6. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/tasks.csv`
8. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/code-review/verified_review_tk-031-workspace-code-review-workflow-skill.md`
9. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-031-workspace-code-review-workflow-skill.md`

## 7. 验证

1. 在临时 venv 中安装 `PyYAML` 后执行 `quick_validate.py .codex/skills/workspace-code-review-workflow`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始创建 repo-local code review workflow skill 并对齐当前 sprint `code-review/` 路径。
2. 2026-03-20：完成 skill 内容定制、`AGENTS.md` 本地技能映射与 sprint 台账同步。
3. 2026-03-20：在临时 venv 中安装 `PyYAML` 后完成 skill 结构校验，并通过 task ledger / sprint status 同步检查，任务状态切换为 `completed`。
