# Workspace Code Review Workflow

- Host: claude-code
- Target: claude_code.project_local
- Workflow ID: workspace-code-review-workflow
- Handoff: cli_wrapper -> repo-ai-governor workspace-code-review-workflow

Repository-local code review workflow for this workspace. Use when the user says "帮我 cr 代码", "帮我cr代码" ,"code review", "复核 code review 报告", "复核 cr 报告", "复核 code review 报告并修复", "复核 cr 报告并修复", "执行 cr 修复", or otherwise wants to review the current working tree, recheck the current sprint's pending CR report, or fix accepted findings from a verified sprint CR report. The skill always reads `.repo-ai-governor/context/current-context.md` and writes review artifacts to the resolved review target directory (`explicit path -> Worktree Review Target -> active primary stream`) instead of `docs/review`.
