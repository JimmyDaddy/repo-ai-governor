# Sprint 003 发布与运行时 JS 白名单边界

- Project: `ts-vitest-v1`
- Sprint: `sprint-003`
- Updated At: 2026-03-18
- Source Config: `scripts/release/runtime-js-whitelist.json`
- Audit Script: `scripts/release/check-runtime-js-whitelist.js`

## Boundary Policy

1. 发布包中的 `.js` 文件默认不允许；仅以下两类可保留：
   - `dist/**`：构建产物目录，允许随构建结果变化。
   - 非 `dist` 的显式路径白名单：必须逐文件声明 `owner` 与 `purpose`。
2. 任意新增打包 `.js` 文件，若不命中上述白名单，将在发布检查中失败。
3. 白名单项若不再出现在打包结果中，会在脚本输出中标记为 `staleAllowListEntries`，用于后续回收。

## Dist 边界

| Rule | Owner | Purpose |
| --- | --- | --- |
| `dist/**` | Core | TypeScript 构建产物与 CLI 运行时模块。 |

## Non-Dist JS 白名单

| Path | Owner | Purpose |
| --- | --- | --- |
| `bin/repo-ai-governor.js` | Core | CLI 启动入口，负责 Node 运行时引导。 |
| `scripts/examples/load-dist-module.js` | Core | 发布包示例：加载 dist 模块。 |
| `scripts/examples/render-claude-code-adapter-bundle.js` | Core | 发布包示例：渲染 Claude Code 适配器。 |
| `scripts/examples/render-codex-adapter-bundle.js` | Core | 发布包示例：渲染 Codex 适配器。 |
| `scripts/examples/render-github-copilot-adapter-bundle.js` | Core | 发布包示例：渲染 GitHub Copilot 适配器。 |
| `skills/official/governor-plan-runner/scripts/create-request-draft.js` | Release | 官方技能运行时辅助脚本。 |

## Verification

1. `node ./scripts/release/check-runtime-js-whitelist.js --format=json`
2. `npm run release:check`
