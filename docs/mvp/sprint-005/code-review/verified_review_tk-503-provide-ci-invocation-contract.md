# Review TK-503 Provide CI Invocation Contract

- Status: verified
- Date: 2026-03-14
- File lifecycle:
  - Pending verify: `review_tk-503-provide-ci-invocation-contract.md`
  - Verified: `verified_review_tk-503-provide-ci-invocation-contract.md`
  - Resolved: `resolved_review_tk-503-provide-ci-invocation-contract.md`

## Scope

复核 `TK-503` 的 CI 调用约定交付，包括非交互脚本、退出码语义、`review/review-verify` 的 strict 行为，以及相关测试覆盖。

## Review Findings

1. 暂无阻断问题。

## Verify Append Log

1. 已核对 `src/cli/command-registry.js`，确认 `review` 与 `review-verify` 已支持 `--strict`。
2. 已核对 `src/commands/review-command.js` 与 `src/commands/review-verify-command.js`，确认 warning 在 strict 模式下会返回非零退出码。
3. 已核对 `scripts/ci/` 下四个脚本，确认当前 CI 调用入口可直接复用 CLI。
4. 已核对 `test/ci/ci-scripts.test.js` 与命令级 strict 测试，确认脚本与退出码语义都已覆盖。
5. 已执行 `/opt/homebrew/bin/npm run test`，确认当前仓库 68 个测试全部通过。

## Resolution Log

1. 无需追加修复。
