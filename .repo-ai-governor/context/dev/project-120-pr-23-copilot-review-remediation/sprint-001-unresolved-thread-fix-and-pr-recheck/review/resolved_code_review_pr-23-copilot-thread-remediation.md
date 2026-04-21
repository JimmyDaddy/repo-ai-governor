# Code Review: project-120-pr-23-copilot-review-remediation

- Status: resolved
- Date: 2026-04-21
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/gh-pr-remediation/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
2. `apps/cli/src/runtime/cli-user-config-projection-service.ts`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
4. `apps/cli/test/connect-phase2.integration.test.ts`
5. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
7. `.repo-ai-governor/context/dev/project-120-pr-23-copilot-review-remediation/**`

## 2. Findings
1. 本轮 review 范围内未发现新的 actionable finding。

## 3. Notes
1. 本轮 remediation 严格限制在 PR #23 成立的 copilot reviewer feedback，不扩展到无关工作区改动。
2. session-main relay 修复采用了更小的仓库内一致性方案：在 event payload 缺少 surface metadata 时回退到 runtime-selected `selectedSurface/selectedBy`，而不是扩大 protocol request contract。
3. 首次 push 后出现的 GitHub `quality-gate-full` 失败来自 project-120 task-ledger terminal row 的治理占位值，而不是代码回归；该问题已在 follow-up commit 中修复，并经本地/远端 full gate 再次验证。
4. 最终 fresh PR snapshot 已确认 required checks pass=`1 / 1`、unresolved review threads=`0 / 7`。

## 4. Verification
1. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）
4. `python3 .codex/skills/gh-pr-remediation/scripts/github_pr_tool.py status`（最终结果：required pass=`1 / 1`，unresolved=`0 / 7`）

## 5. Review Decision
1. 整体结论：**认可**
2. `project-120` 范围内没有阻止 closeout 的剩余问题。
3. 允许进入 `TK-1036` final closeout。
