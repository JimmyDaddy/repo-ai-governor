# Verified Review - TK-902 Fix Init Onboarding From npx

- Status: verified
- Date: 2026-03-16
- Task: `TK-902`

## Scope

复核 `init` 在空目录 + npx 场景下的可用性修复，重点检查依赖落盘、目录可读性、skills 自动安装与回归风险。

## Findings

1. 无阻断问题。

## Verification Notes

1. 已核对 [init-command.js](../../../../src/commands/init-command.js)，确认新增 npx 场景依赖自安装逻辑与官方 skills 自动安装流程。
2. 已核对 [command-registry.js](../../../../src/cli/command-registry.js)，确认 `init` 暴露 `--self-install`、`--skip-self-install`、`--skip-skill-install` 选项。
3. 已核对 [init-documents.js](../../../../src/commands/templates/init-documents.js)，确认 `.repo-ai-governor` 关键目录模板文件已提供中英文内容。
4. 已执行 `PATH=/opt/homebrew/bin:$PATH node --test test/commands/init-command.test.js`，结果通过。
5. 已执行 `PATH=/opt/homebrew/bin:$PATH npm run check`，结果通过（113/113）。
6. 已执行 `npm_command=exec node ./bin/repo-ai-governor.js init --cwd <tmp> --project demo --sprint sprint-001 --format json`，输出包含 `dependencyBootstrap` 与 `skillBootstrap`，并验证 `.codex/skills/` 与 `package.json` 已落盘。

## Conclusion

1. `TK-902` 修复可接受，维持 `verified` 状态。
