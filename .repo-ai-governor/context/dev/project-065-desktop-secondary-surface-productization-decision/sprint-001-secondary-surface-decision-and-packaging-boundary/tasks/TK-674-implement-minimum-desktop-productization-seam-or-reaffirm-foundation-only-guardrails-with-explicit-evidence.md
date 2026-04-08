# TK-674 implement minimum desktop productization seam or reaffirm foundation-only guardrails with explicit evidence

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-065-desktop-secondary-surface-productization-decision`
- Sprint: `sprint-001-secondary-surface-decision-and-packaging-boundary`

## 1. 任务目标

根据 `TK-673` 的决策，实现最小 desktop productization seam，或用显式 evidence 强化 foundation-only guardrails。

## 2. Depends On

1. `TK-673`
2. 当前 desktop foundation shell

## 3. 预期产物

1. minimum seam or explicit guardrails
2. evidence pack
3. support-truth input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-065-desktop-secondary-surface-productization-decision/sprint-001-secondary-surface-decision-and-packaging-boundary/tasks/TK-673-freeze-desktop-secondary-surface-productization-decision-and-packaging-boundary.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/project-054-vscode-secondary-surface-rollout-completion-audit-summary.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`

## 6. 实施计划

1. 落实 minimum seam 或 guardrail 方案。
2. 准备 public support-truth evidence。
3. 交给 `TK-675` 做最终 recommendations closeout。

## 7. Development Verification

1. desktop boundary rehearsal
2. evidence consistency review

## 8. Delivery Verification

1. desktop support-path verification
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已明确选择“不扩张 minimum desktop productization seam”，转而收口 foundation-only guardrails：README、local adoption playbook、maintainer validation playbook 与 integration docs 的中英文版本都同步写明当前没有 standalone desktop installer、published desktop bundle 或 packaged desktop product claim。
3. 2026-04-08：`scripts/release/verify-local-distribution.js` 已新增 desktop foundation truthfulness 断言与 `desktopFoundationContract` 报告字段，并通过 `pnpm run build`、`pnpm run check:desktop-entry-smoke` 与 `node ./scripts/release/verify-local-distribution.js --output .tmp/project-065-sprint-001-desktop-foundation-report.json` 验证。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/README.md`
2. `/Users/jimmydaddy/study/ai-governor/README.zh-CN.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
7. `/Users/jimmydaddy/study/ai-governor/integrations/desktop/examples/README.md`
8. `/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js`
9. `/Users/jimmydaddy/study/ai-governor/.tmp/project-065-sprint-001-desktop-foundation-report.json`
