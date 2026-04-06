# Workspace Scoped Cr Loop

- Host: github-copilot
- Target: github_copilot.github_com_agent
- Workflow ID: workspace-scoped-cr-loop
- Handoff: cli_wrapper -> repo-ai-governor workspace-scoped-cr-loop

Repository-local workflow for executing a scoped task, sprint, or project with mandatory delegated code-review loops in this workspace. Use when the user asks to execute a specific task, sprint, or project and explicitly requires delegated CR loops such as “调起子 agent 做 CR，主 agent 复核并修复，再循环直到没有问题”, or otherwise wants fresh reviewer sub-agents after each review boundary until no actionable problem remains.
