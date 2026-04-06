# Repo AI Governor 正式支持矩阵

- 状态：active
- 最后更新：2026-04-06
- 适用范围：由 `project-026 / sprint-004`（`TK-301`）、`project-044 / sprint-003`（`TK-547`）、`project-046 / sprint-001`（`TK-551`、`TK-552`、`TK-554`）、`project-052 / sprint-001`（`TK-589`、`TK-590`、`TK-591`）与 `project-052 / sprint-002`（`TK-592`、`TK-593`、`TK-594`）共同刷新后的正式支持声明

## 1. 安装模式

| 模式 | 支持状态 | 说明 |
|---|---|---|
| `path`（`pnpm add <repo>`） | Supported | 默认本地接入路径，适合持续迭代。 |
| `link`（`pnpm add link:<repo>`） | Supported | 仅适用于目标仓库需要跟随本地 governor 源码变化的场景。 |
| `dist-binary`（`node dist/bin/repo-ai-governor.js`） | Supported | 适合脏工作树或非 `pnpm` 仓库的无侵入演练。 |
| `tgz`（`pnpm pack` + `pnpm add <tarball>`） | Supported（联网） | 安装阶段仍需要可访问 registry 解析运行时依赖。 |

### 1.1 Adopter Acceptance Contract

1. 文档中的 `Supported` 表示：该安装模式在说明列声明的前置条件下，可以稳定复现文档约定的基线命令链。
2. `path` 是干净 `pnpm` 目标仓库的默认推荐安装路径。
3. `link` 仍然正式支持，但只适用于目标仓库明确要跟随本地 governor 源码变化的场景。
4. `dist-binary` 是脏工作树或非 `pnpm` 目标仓库的首选路径，它证明的是 CLI/runtime 行为，不等于 packaged install 行为已经成立。
5. `tgz` 只支持“可访问 registry 的 packaged-install 演练”；离线或自包含 tarball 安装仍不在支持范围内。

## 2. 适配器 Surface

| 适配器 surface | 支持状态 | 说明 |
|---|---|---|
| `codex` | Fixture-backed | 当前验证快照中的主路由。 |
| `github-copilot` | Fixture-backed | 当 quota 或 probe 前置条件失败时，仍通过 fallback / degraded 路由保持正式支持。 |
| `claude-code` | Fixture-backed | 当 credential 或 probe 前置条件失败时，仍通过 fallback / degraded 路由保持正式支持。 |
| `local-model`（`ollama`） | Fixture-backed（本地运行时受限） | 作为正式本地 fallback surface 支持；`tool_calling`、`structured_output`、`confirmation_gate` 继续保持保守/降级口径。 |

## 3. 已发布治理模板

| 模板 | 支持状态 | 说明 |
|---|---|---|
| TypeScript 仓库基线 | Built-in | 仓库基线已内置完整治理链。 |
| Workflow review | Minimal baseline | 通过 `@repo-ai-governor/standards` 发布 `workflowReviewGovernancePack`，并内置 `CR-xxx` 评审任务卡生命周期。 |
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
| Desktop sidecar entry | MVP foundation 正式支持 | `apps/desktop` 已提供正式 desktop shell package，并通过 service-owned session/execution/HITL/artifact-pane seam 暴露桌面 MVP foundation；更丰富的 desktop 面板仍按后续阶段演进。 |

## 6. 验证快照（TK-301 + TK-547 + TK-551/TK-552/TK-554 + TK-589/TK-590/TK-591 + TK-592/TK-593/TK-594）

| 时间（UTC） | 命令 | 结果 | 证据摘要 |
|---|---|---|---|
| 2026-04-06T21:29:47Z | `repo-external upgrade rehearsal (preview -> apply -> rollback)` | Pass | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` 记录了 `schema_upgrade_analyze`、`schema_upgrade_apply` 与 `schema_upgrade_rollback`；apply 与 rollback 都以 `verify_status=passed` 结束。 |
| 2026-04-06T21:29:47Z | `repo-external workspace rehearsal (dry-run -> execute -> rollback)` | Pass | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` 记录了 `workspace_migration_plan`、`workspace_migration_execute` 与 `workspace_migration_rollback`；rollback 返回 source workspace，且 `scratch_cleanup_status=removed`。 |
| 2026-04-06T12:09:11Z | `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link --iterations 1 --output .tmp/project-052-sprint-001-cleanroom-report.json` | Pass | `path` 与 `link` 各完成 1 轮 clean-room 基线链路；workspace switch rollback、read-only attach precheck、service-host memory provider 与 remote-api smoke 也全部通过。 |
| 2026-04-06T12:08:49Z | `node ./scripts/release/verify-local-distribution.js --output .tmp/project-052-sprint-001-local-distribution-report.json` | Pass | 本地分发验证通过，`pack_file=cjhdev-repo-ai-governor-0.1.5.tgz`；standards runtime-loader dist smoke 与 dist-binary remote-api smoke 均通过，adapter `doctor/verify` 继续维持非阻断 `warn`。 |
| 2026-04-04T12:09:14Z | `pnpm run build` | Pass | `dist/apps/desktop` 与 `dist/node_modules/@repo-ai-governor/desktop` 已完成本地分发所需产物 |
| 2026-04-04T12:09:14Z | `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` | Pass | `118` 个文件与 `734` 个测试通过 |
| 2026-04-04T12:09:14Z | `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` | Pass | `19` 个文件与 `47` 个测试通过 |
| 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | Pass | CLI help smoke + desktop entry smoke + examples runtime smoke + dist-binary remote-api smoke + packaged surface truthfulness 全部通过 |
| 2026-04-05T02:13:09Z | `pnpm vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | desktop artifact-pane query contract、preload bridge、shell baseline 与 smoke integration 均在 ready-state gate 下通过。 |
| 2026-04-05T02:17:45Z | `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | `github-copilot`、`claude-code`、`local-model` 以及首批 routing fallback 覆盖在一次定向验证切片中全部通过。 |
| 2026-03-27T22:38:31Z | `node ./dist/bin/repo-ai-governor.js doctor --output pretty` | Pass | `attach_mode=read_write`，`operation=env_doctor` |
| 2026-03-27T22:38:38Z | `node ./dist/bin/repo-ai-governor.js verify --output pretty --adapters` | Warn（非阻断） | `adapters_status=warn`，required role failures `0` |
| 2026-03-27T22:39:17Z | `node ./dist/bin/repo-ai-governor.js workspace --workspace-action dry-run --workspace-mode repo_local --output pretty` | Pass | workspace plan 已在活动 workspace 根生成 |
| 2026-03-27T22:39:21Z | `node ./scripts/release/verify-local-distribution.js` | Pass | 本地分发验证通过，`pack_file=cjhdev-repo-ai-governor-0.1.5.tgz` |
| 2026-03-27T22:39:31Z | `node ./scripts/examples/check-desktop-entry-smoke.js` | Pass | 默认分发模式下 desktop sidecar smoke 通过 |

## 7. Upgrade / Workspace Contract 快照（TK-592）

1. `workspace` 的正式 adopter 路径是 `dry-run -> execute -> rollback`；`rollback` 只接受保存下来的 `plan-path`，而 execute 失败时会先落一份 `context/workspace/<migration-id>.failure.json` 再决定是否重试。
2. `upgrade` 的正式 adopter 路径是 `preview -> apply -> rollback`；`apply` 只接受 preview 产出的 `report_path` 加显式 `--confirm-upgrade approve`，而 rollback 接受 apply receipt 或 rollback snapshot。
3. `docs/local-adoption-playbook*.md` 是 artifact hand-off 与 troubleshooting 的 canonical adopter 指南；`README*` 只保留最小命令入口。

## 8. Troubleshooting / Acceptance 快照（TK-594）

1. 在改变 adopter 状态前，请先保存 `plan_path`、`report_path`，以及至少一份 rollback hand-off artifact（`apply_receipt_path` 或 `rollback_snapshot_path`）；正式 closeout 路径依赖这些产物。
2. 如果 `upgrade` preview 提示 blocking confirmation items，请在 `apply` 前先停下，审阅 preview 产物并确认配置漂移原因，再重新 preview。
3. `workspace execute` 或 `workspace rollback` 之后，应重新执行 `doctor` 来确认活动 `workspaceRoot`，不要只凭目录结构变化推断成功。
4. rehearsal 或 pilot 应在目标仓库或隔离的外部临时目录中执行；若直接从 governor 源仓库发起 workspace migration，命令可能附着到外层 Git root 并产生误导性产物。
5. `.tmp/project-052-sprint-002-command-rehearsal-summary.json` 是 sprint-002 repo-external upgrade/workspace closeout 路径的正式 acceptance evidence。

## 9. 备注

1. adapter 的 degrade / warning 仍属于环境前置条件（如 `github-copilot` quota/probe、`claude-code` credential/probe、`local-model` endpoint/model capability 限制），而不是治理链路失败。
2. `project-046` 已把 desktop artifact pane 从 deferred gate 推进为 service-owned typed query contract；renderer 仍不允许直接旁路 workspace 文件系统。
3. 官方 `GitLab CI` 与 `Jenkins` 模板现已发布到 `integrations/ci/`，并复用与 GitHub Actions 相同的 install、quality-gate 与 release-governance 命令契约。
4. 本文档定义 `TK-301`、desktop baseline refresh `TK-547`、`project-046` P1 收口工作、`project-052 / sprint-001` install-mode truth refresh，以及 `project-052 / sprint-002` upgrade/workspace contract 与 acceptance closeout 的正式支持边界；GA Readiness 全量信号覆盖仍在 `TK-302` 持续沉淀。
