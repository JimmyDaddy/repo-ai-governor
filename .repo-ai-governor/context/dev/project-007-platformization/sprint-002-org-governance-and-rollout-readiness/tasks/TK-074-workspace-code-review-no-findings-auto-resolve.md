# TK-074 workspace code review 无修复项直接 resolved 规则

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P2
- Project: `project-007-platformization`
- Sprint: `sprint-002-org-governance-and-rollout-readiness`

## 1. 任务目标

为 `workspace-code-review-workflow` 增加生命周期收口规则：当 code review 未发现需要修复的点时，CR 报告直接进入 `resolved` 状态，不再停留在 pending/verified 流转中。

## 2. Depends On

1. `TK-073`

## 3. 预期产物

1. `.codex/skills/workspace-code-review-workflow/SKILL.md` 中新增“无修复项直接 resolved”规则。
2. `resolved_code_review_tk-074-workspace-code-review-no-findings-auto-resolve.md` 评审记录。

## 4. Input References

1. `AGENTS.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
5. `.codex/skills/workspace-code-review-workflow/SKILL.md`
6. `/Users/jimmydaddy/.codex/skills/.system/skill-creator/SKILL.md`

## 5. 实施计划

1. 对齐当前 skill 的 CR 生命周期描述与 guardrail。
2. 明确“无 actionable finding”时的命名与输出状态。
3. 同步 sprint 台账与 review 记录，避免执行痕迹漂移。

## 6. 规则收敛结果

1. `帮我cr代码 / code review` 触发后：
   - 有 actionable finding 时，仍输出 `code_review_<slug>.md`。
   - 无 actionable finding 时，直接输出 `resolved_code_review_<slug>.md`。
2. Workflow A 明确：
   - 报告模板保持不变。
   - 无修复项时跳过 `review_pending -> verified` 空转，直接收口到 `resolved`。
3. Guardrails 明确：
   - 仅当不存在 blocked/skipped actionable item 时才允许 `resolved`。
   - 无 actionable finding 时优先直接输出 `resolved_code_review_*.md`。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始收敛 workspace code review 无修复项时的生命周期规则。
3. 2026-03-22：完成 skill 规则更新与台账同步，状态切换为 `completed`。

## 9. 产出

1. `.codex/skills/workspace-code-review-workflow/SKILL.md`
2. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-074-workspace-code-review-no-findings-auto-resolve.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/checklist.md`
4. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/review/resolved_code_review_tk-074-workspace-code-review-no-findings-auto-resolve.md`
6. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/plan.md`
7. `.repo-ai-governor/context/dev/project-007-platformization/plan.md`
