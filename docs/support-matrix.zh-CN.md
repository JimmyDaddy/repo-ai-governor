# Repo AI Governor 正式支持矩阵

- 状态：active
- 最后更新：2026-04-04
- 适用范围：由 `project-026 / sprint-004`（`TK-301`）与 `project-044 / sprint-003`（`TK-547`）共同刷新后的正式支持声明

## 1. 安装模式

| 模式 | 支持状态 | 说明 |
|---|---|---|
| `path`（`pnpm add <repo>`） | Supported | 默认本地接入路径，适合持续迭代。 |
| `link`（`pnpm add link:<repo>`） | Supported | 适合高频源码联调。 |
| `dist` 二进制（`node dist/bin/repo-ai-governor.js`） | Supported | 适合脏工作树或非 `pnpm` 仓库的无侵入演练。 |
| `tgz`（`pnpm pack` + `pnpm add <tarball>`） | Supported（联网） | 安装阶段仍需要可访问 registry 解析运行时依赖。 |

## 2. 适配器 Surface

| 适配器 surface | 支持状态 | 说明 |
|---|---|---|
| `codex` | Fixture-backed | 当前验证快照中的主路由。 |
| `github-copilot` | Fixture-backed（条件可用） | 本次 smoke 中出现 quota 相关健康警告，运行时自动 fallback 到 `codex`。 |
| `claude-code` | Fixture-backed（条件可用） | 本次 smoke 中出现 probe 警告，运行时通过 fallback 路由保持可执行。 |

## 3. 语言治理模板

| 语言 | 支持状态 | 说明 |
|---|---|---|
| TypeScript | Built-in | 仓库基线已内置完整治理链。 |
| Python | Minimal baseline | 通过 `@repo-ai-governor/standards` 发布 `pythonMinimalGovernancePack`。 |
| Go | Minimal baseline | 通过 `@repo-ai-governor/standards` 发布 `goMinimalGovernancePack`。 |

## 4. 运行时基线

| 项目 | 要求 / 本次验证值 |
|---|---|
| Node.js | 最低 `>=18`（engine 契约）；本次快照 `v22.22.0` |
| pnpm | package manager 基线；本次快照 `10.30.3` |
| OS 面 | macOS / Linux / WSL2 |

## 5. IDE / 执行面

| Surface | 支持状态 | 说明 |
|---|---|---|
| CLI | Supported | 当前生产主入口。 |
| Desktop sidecar entry | Smoke 基线支持 | `apps/desktop` 已成为正式桌面 foundation package；`check-desktop-entry-smoke` 与 `release:verify-local` 已通过，完整 desktop 产品面仍按后续阶段演进。 |

## 6. Clean-room Smoke 快照（TK-301 + TK-547）

| 时间（UTC） | 命令 | 结果 | 证据摘要 |
|---|---|---|---|
| 2026-04-04T12:09:14Z | `pnpm run build` | Pass | `dist/apps/desktop` 与 `dist/node_modules/@repo-ai-governor/desktop` 已完成本地分发所需产物 |
| 2026-04-04T12:09:14Z | `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` | Pass | `118` 个文件与 `734` 个测试通过 |
| 2026-04-04T12:09:14Z | `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` | Pass | `19` 个文件与 `47` 个测试通过 |
| 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | Pass | CLI help smoke + desktop entry smoke + examples runtime smoke + dist-binary remote-api smoke + packaged surface truthfulness 全部通过 |
| 2026-03-27T22:38:31Z | `node ./dist/bin/repo-ai-governor.js doctor --output pretty` | Pass | `attach_mode=read_write`，`operation=env_doctor` |
| 2026-03-27T22:38:38Z | `node ./dist/bin/repo-ai-governor.js verify --output pretty --adapters` | Warn（非阻断） | `adapters_status=warn`，required role failures `0` |
| 2026-03-27T22:39:17Z | `node ./dist/bin/repo-ai-governor.js workspace --workspace-action dry-run --workspace-mode repo_local --output pretty` | Pass | workspace plan 已在活动 workspace 根生成 |
| 2026-03-27T22:39:21Z | `node ./scripts/release/verify-local-distribution.js` | Pass | 本地分发验证通过，`pack_file=cjhdev-repo-ai-governor-0.1.5.tgz` |
| 2026-03-27T22:39:31Z | `node ./scripts/examples/check-desktop-entry-smoke.js` | Pass | 默认分发模式下 desktop sidecar smoke 通过 |

## 7. 备注

1. 本快照中的 adapter warning 属于环境前置条件（`github-copilot` quota/probe）而非治理链路失败。
2. `project-044` 将 desktop smoke baseline 刷新为正式 `apps/desktop` package，但 `artifact pane` 仍在 service-owned query contract ready 前保持 gated deferred 状态。
3. 本文档定义 `TK-301` 与 desktop baseline refresh `TK-547` 的正式支持边界；GA Readiness 全量信号覆盖在 `TK-302` 继续沉淀。
