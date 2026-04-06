# Repo AI Governor Copilot Instructions

- Host: github-copilot
- Target: github_copilot.repo_local
- Mode: project-local

- Technical Solution Promotion: Repository-local workflow for promoting a technical solution from `.repo-ai-governor/draft/**` into formal lifecycle-managed module docs in this workspace. Use when the user says "提升技术方案", "把 draft 变正式", "promote technical solution", "审核通过后转正式", "正式化技术方案", or otherwise wants to check promotion readiness, perform an approved promotion, or supersede an existing active solution.
- Workspace Code Review Workflow: Repository-local code review workflow for this workspace. Use when the user says "帮我 cr 代码", "帮我cr代码" ,"code review", "复核 code review 报告", "复核 cr 报告", "复核 code review 报告并修复", "复核 cr 报告并修复", "执行 cr 修复", or otherwise wants to review the current working tree, recheck the current sprint's pending CR report, or fix accepted findings from a verified sprint CR report. The skill always reads `.repo-ai-governor/context/current-context.md` and writes review artifacts to the resolved review target directory (`explicit path -> Worktree Review Target -> active primary stream`) instead of `docs/review`.
- Workspace Delivery Finisher: Finish the current workspace safely by running the repository delivery gate, generating a Conventional Commit message, creating a git commit, and optionally pushing to the active remote branch. Use when the user asks to "收尾", "提交并推送", "收尾并推送", "commit", or otherwise wants end-of-task delivery in this repository.
- Workspace Scoped Cr Loop: Repository-local workflow for executing a scoped task, sprint, or project with mandatory delegated code-review loops in this workspace. Use when the user asks to execute a specific task, sprint, or project and explicitly requires delegated CR loops such as “调起子 agent 做 CR，主 agent 复核并修复，再循环直到没有问题”, or otherwise wants fresh reviewer sub-agents after each review boundary until no actionable problem remains.
