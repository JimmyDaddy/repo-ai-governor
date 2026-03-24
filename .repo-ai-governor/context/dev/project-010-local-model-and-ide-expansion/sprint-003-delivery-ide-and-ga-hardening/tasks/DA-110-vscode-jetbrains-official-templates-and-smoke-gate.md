# DA-110 VS Code/JetBrains 官方模板与 smoke 门禁

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-110`
- Produced By: `TK-110`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

为 VS Code 与 JetBrains 提供可直接复用的官方模板，并通过统一 IDE smoke gate 与 integration test 证明模板、wrapper contract 和 CLI 最小链路保持一致。

## 2. 关键实现

1. 官方模板已落地到 `integrations/ide/examples/`：
   - `vscode-task.sample.json`
   - `vscode-launch.sample.json`
   - `jetbrains-run-configuration.sample.xml`
   - `README.md`
2. VS Code 模板覆盖 `init / doctor / check` 三个 task，以及一个 `check` debug launch 配置。
3. JetBrains 模板提供 shell run configuration 样例，并显式注入与 VS Code 相同的 `REPO_AI_GOVERNOR_*` 基线环境变量。
4. 官方模板统一采用：
   - `node ./dist/bin/repo-ai-governor.js`
   - `--output json`
   - `--locale en-US`
   - `REPO_AI_GOVERNOR_ENTRY_SURFACE=<surface>`
   - `REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID=stage5-entry-baseline`
   - `REPO_AI_GOVERNOR_STANDARDS_SOURCES=<default ordered sources>`
5. 新增 `scripts/examples/check-ide-entry-smoke.js` 与 `pnpm run check:ide-entry-smoke`：
   - 校验模板文件存在与结构不漂移
   - 校验 env key、surface 与命令序列对齐 `command-wrapper.contract.json`
   - 在临时 `repo_local` 仓库中执行 `init -> doctor -> check`
6. 将 `gate:ide-entry-smoke` 接入 `package.json` 与 `turbo.json`，使其进入 `pnpm run check`。
7. 新增 [ide-entry-smoke.integration.test.ts](/Users/jimmydaddy/study/ai-governor/test/ide-entry-smoke.integration.test.ts)，在 integration 层直接消费官方模板并通过 `runCli()` 验证最小链路。
8. `package.json -> files` 与 `scripts/release/verify-local-distribution.js` 已同步纳入 `integrations/ide` 交付面，确保官方模板能随本地分发一起发布。

## 3. 关键产物

1. `DA-110` 本文档
2. `resolved_code_review_tk-110-vscode-jetbrains-official-templates-and-smoke-gate.md`
3. `integrations/ide/examples/vscode-task.sample.json`
4. `integrations/ide/examples/vscode-launch.sample.json`
5. `integrations/ide/examples/jetbrains-run-configuration.sample.xml`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/examples/check-ide-entry-smoke.js`
3. `pnpm run test:integration -- test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run release:verify-local`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. `pnpm run check`

## 5. 结论

1. `TK-110` 已为 VS Code 与 JetBrains 提供可复用的官方模板，并将其纳入统一 smoke gate。
2. `TK-111` 可直接沿用这套 `template + gate + package distribution` 基线扩展 Cursor / Claude Code，而无需重新发明模板验证框架。
