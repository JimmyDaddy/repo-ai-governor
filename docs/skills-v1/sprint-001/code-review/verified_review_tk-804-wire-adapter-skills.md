# Verified Review - TK-804 Wire Adapter Skills

- Status: verified
- Date: 2026-03-16
- Task: `TK-804`

## Scope

复核 `Codex / GitHub Copilot / Claude Code` 的官方 skill 安装接线说明、补充投影边界和相关测试覆盖。

## Findings

1. 无阻断问题。

## Verification Notes

1. 已核对 3 类 adapter README 与 acceptance 文档，确认都加入了 `skills install --surface <adapter>` 的原生安装路径。
2. 已核对 `Codex`、`GitHub Copilot`、`Claude Code` 的 native skill 目录分别落到 `.codex/skills/`、`.github/skills/`、`.claude/skills/`。
3. 已核对补充投影层边界：Codex 使用 bundle，GitHub Copilot 使用 `copilot-instructions` 与 CLI prompt，Claude Code 使用 `system prompt` 与 `task prompt`，且文档明确这些都不替代官方 skills 本体。
4. 已核对 `test/adapters/adapter-skill-wiring.test.js`，确认 adapter 接线说明已有自动校验。

## Conclusion

1. `TK-804` 当前实现可接受，维持 `verified` 状态。
