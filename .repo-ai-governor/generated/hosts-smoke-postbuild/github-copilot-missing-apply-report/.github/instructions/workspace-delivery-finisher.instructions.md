# Workspace Delivery Finisher

- Host: github-copilot
- Target: github_copilot.repo_local
- Workflow ID: workspace-delivery-finisher
- Handoff: cli_wrapper -> repo-ai-governor workspace-delivery-finisher

Finish the current workspace safely by running the repository delivery gate, generating a Conventional Commit message, creating a git commit, and optionally pushing to the active remote branch. Use when the user asks to "收尾", "提交并推送", "收尾并推送", "commit", or otherwise wants end-of-task delivery in this repository.
