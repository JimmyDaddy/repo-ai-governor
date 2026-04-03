# DA-504 remote-api delivery verification and clean-room smoke coverage

- Date: 2026-04-03
- Owner: AI-Agent
- Task: `TK-504`
- Solution: `technical-solution.api-key-remote-adapter-invocation`

## 1. 交付结论

`api-key remote adapter invocation` 的 delivery follow-through 已完成：

1. `verify-local-distribution.js` 现已包含 dist-binary remote-api rehearsal，能够在临时 target repo 中写入 repo-local config、注入本地 stub `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`，并验证 `doctor --adapters --fix` 与 `verify --adapters` 的 transport/provider/vendor-binding 真值。
2. `verify-cleanroom-local-install.js` 现已将 remote-api rehearsal 纳入 clean-room 安装矩阵，覆盖 `path`、`link`、`tgz` 三种安装模式，并将结果写入 `remoteApiScenarios` 报告段。
3. `docs/local-adoption-playbook.md` 与 `docs/local-adoption-playbook.zh-CN.md` 已补充 remote-api rehearsal 与 `--output <path>` 回执说明，packaged distribution truthfulness 与脚本行为一致。
4. `technical-solution-delivery-registry.yaml` 已将该 solution 的 `execution_status` / `rollout_status` 收口为 `completed`，并补齐 `TK-502`、`TK-503`、`TK-504` 与本 artifact 的回链。

## 2. 实现范围

本次新增/扩展的交付面：

1. `scripts/release/remote-api-smoke-runtime.js`
2. `scripts/release/remote-api-smoke-server.entry.js`
3. `scripts/release/verify-local-distribution.js`
4. `scripts/release/verify-cleanroom-local-install.js`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`

## 3. 验证执行

执行命令：

```bash
PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" pnpm run build
PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" node ./scripts/release/verify-local-distribution.js --output /tmp/repo-ai-governor-tk504-local-distribution.json
PATH="/Users/jimmydaddy/Library/pnpm:/opt/homebrew/bin:$PATH" node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 3 --output /tmp/repo-ai-governor-tk504-cleanroom.json
```

结果摘要：

1. local distribution report: `reportType=local_distribution_verification_v2`，`distributionMode=default`，`packFile=cjhdev-repo-ai-governor-0.1.5.tgz`，`packedFileCount=1963`，dist-binary remote-api smoke 通过。
2. clean-room report: `reportType=cleanroom_local_install_verification_v2`，`status=passed`，`selectedModes=path,link,tgz`，`iterationsPerMode=3`，remote-api smoke 在 `path` / `link` / `tgz` 全部通过。
3. remote-api doctor/verify 在 fresh adopter repo 中保持 `warn` 而非 `pass` 是预期行为：warn 来自外部 adopter 环境的 baseline docs / durable-storage / optional GitHub Copilot 预检，不影响 `codex` / `claude-code` remote-api transport truth 的验证结论。

## 4. 决策记录

1. 本窗口未新增 companion release-governance change。原因是 `TK-504` 所需的 delivery proof 已可在现有 `release:verify-local` 与 `release:verify-cleanroom-local-install` 脚本内闭环，不需要再拆独立 gate profile。
2. remote-api rehearsal 使用本地 stub server，而不是依赖真实 OpenAI / Anthropic 账户，从而保证 packaged distribution / clean-room smoke 可重复且不跨越 secret mutation boundary。
