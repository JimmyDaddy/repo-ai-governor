# sprint-003-installable-bundles-and-pack-verify 计划

- Status: completed
- Date: 2026-04-06
- Project: `project-050-governance-surface-clients-host-distribution-rollout`
- Sprint Goal: 为 Codex、Claude Code 与 Copilot CLI 打通 installable bundle 与 pack/verify。

## 1. Task Package

1. `TK-580` freeze plugin bundle manifest contract and packaging matrix
2. `TK-581` implement Codex and Claude Code bundles plus Copilot CLI plugin renderer
3. `TK-582` close installable bundles MVP with pack verify smoke and install docs

## 2. Exit Criteria

1. `.codex-plugin`、`.claude-plugin` 与 Copilot CLI `plugin.json` packaging matrix 已冻结。
2. bundles 已能从 staged export 打包为 installable artifact。
3. `host pack` / verify / smoke / install docs baseline 已齐备。

## 3. Milestones

1. 2026-04-06：创建 `sprint-003-installable-bundles-and-pack-verify`，作为 bundle productization sprint。
2. 2026-04-06：已完成 Codex / Claude Code / Copilot CLI installable bundle、pack/verify smoke 与 pack receipt fail-closed closeout。
