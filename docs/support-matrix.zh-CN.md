# Repo AI Governor 正式支持矩阵

- 状态：active
- 最后更新：2026-04-07
- 适用范围：由 `project-026 / sprint-004`（`TK-301`）、`project-044 / sprint-003`（`TK-547`）、`project-046 / sprint-001`（`TK-551`、`TK-552`、`TK-554`）、`project-052 / sprint-001`（`TK-589`、`TK-590`、`TK-591`）、`project-052 / sprint-002`（`TK-592`、`TK-593`、`TK-594`）、`project-052 / sprint-003`（`TK-595`、`TK-596`）、`project-053 / sprint-001`（`TK-598`、`TK-599`、`TK-600`）、`project-053 / sprint-002`（`TK-601`、`TK-602`、`TK-603`）、`project-053 / sprint-003`（`TK-604`、`TK-605`、`TK-606`）与 `project-054 / sprint-001`（`TK-607`、`TK-608`、`TK-609`）共同刷新后的正式支持声明

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
| `codex` | Real-path available（environment-gated） | `cli_exec` 现已成为基线 `prepare -> execute -> report` dry-run 的已验证真实 transport；当本地 Codex CLI 可用时，`verify --adapters` 会把 `planner` / `architect` / `coder` / `reviewer` / `verifier` 的 primary route 如实投影为 `codex + cli_exec`。 |
| `github-copilot` | Real-path available（environment-gated） | 被选中时默认真实 transport 为 `cli_exec`，`verify --adapters` 现在会把 `github-copilot` 的 tester route 如实投影为 `transport=cli_exec`；本地 probe 会优先检查 `copilot` CLI，再按需回退到 `gh copilot -- --version`，而 quota/auth/probe 失败仍只表现为降级或 reroute，而不是治理链路失效。 |
| `claude-code` | Real-path available（environment-gated） | 被选中时默认真实 transport 为 `cli_exec`，`remote_api` 仍是可选路径；`verify --adapters` 现在会在未显式声明 `transport` 时投影 effective default transport truth，但当前 workspace 若本地 Claude health-check 失败仍会如实给出 warning。 |
| `local-model`（`ollama`） | Fallback-only real-path（本地运行时受限） | 当 endpoint/model 配置齐全时，`ollama` 已具备 endpoint-backed 的 probe/invoke 真值，可用于 restricted-network 或显式本地 fallback；但 `tool_calling`、`structured_output`、`confirmation_gate` 仍保持保守或不支持口径，不能把它包装成主远端 adapter 的等价替代。 |

### 2.1 Adapter Truth Labels

1. `Real-path available` 表示该 adapter 在被选中时已经可以暴露非 fixture 的真实执行真值（`cli_exec` 或可选 `remote_api`），即使当前 workspace 仍可能因为环境前置条件出现 warning。
2. `Fallback-only real-path` 表示该 adapter 已具备真实 probe/invoke 真值，但正式支持边界仍限制在 fallback、restricted-network 或 capability-constrained 流程，不是 promoted primary lane。
3. `Fixture-backed` 表示产品 surface 已正式支持，但公开证据仍以 routing/fixture truth 为主，尚未提升为正式真实调用路径。

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

| Surface | 打包/运行路径 | 支持状态 | 说明 |
|---|---|---|---|
| CLI | 已发布包 / `dist-binary` | Supported | 当前生产主入口。 |
| VS Code extension（`apps/vscode-extension`） | 已构建源码仓 checkout + extension-development host | editor-native companion MVP 正式支持 | 先构建 governor 源仓，再从 `apps/vscode-extension` 启动扩展开发宿主；所有 trust-sensitive action 仍受 `Workspace Trust` 保护，并继续通过 service-owned query/command seam 消费真值，禁止在 extension 侧制造 execution shadow state；当前 MVP 仍是 companion surface，不替代 CLI bootstrap 或 session shell 的主入口职责。 |
| VS Code 打包分发（`npm` tarball / VSIX / Marketplace） | 打包安装面 | Not supported | 已发布 governor tarball 不包含 `apps/vscode-extension` workspace 或可安装的扩展 bundle；它仍可能携带内部 `dist/apps/vscode-extension/**` 构建产物，但这些只属于内部 runtime payload，不构成正式支持的 npm/VSIX/Marketplace 分发。 |
| Desktop sidecar entry | 已构建源码仓 / 本地分发演练 | 仅 MVP foundation 正式支持 | `apps/desktop` 继续作为 foundation surface，提供 service-owned session/execution/HITL/artifact-pane seam；`project-054` 不把它提升为首选 secondary surface，也不把它升级成 packaged desktop product claim，更丰富的 desktop 面板仍按后续阶段演进。 |

## 6. 验证快照（TK-301 + TK-547 + TK-551/TK-552/TK-554 + TK-589/TK-590/TK-591 + TK-592/TK-593/TK-594 + TK-598/TK-599/TK-600 + TK-601/TK-602/TK-603 + TK-604/TK-605/TK-606 + TK-607/TK-608/TK-609 + TK-610）

| 时间（UTC） | 命令 | 结果 | 证据摘要 |
|---|---|---|---|
| 2026-04-07T03:30:14Z | `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | VS Code extension 的 service-runtime degrade-path guard、contract、controller/provider 流程、presentation mapping、selection-store 生命周期与 packaging-boundary guard 在修复 reviewer finding 后的同一轮定向验证切片中全部通过（`6` 个文件 / `12` 个测试）。 |
| 2026-04-07T02:19:06Z | `pnpm run build` | Pass | `dist/apps/vscode-extension` 已刷新，且 `apps/vscode-extension/package.json` 依赖的 extension host entrypoint 继续可用。 |
| 2026-04-07T02:19:31Z | `pnpm pack --json --dry-run` | Pass | dry-run package manifest 已确认：发布 tarball 不包含 `apps/vscode-extension` workspace、manifest 文件或资源文件；其中出现的 `dist/apps/vscode-extension/**` 仅是内部 runtime payload，不是可安装扩展分发。 |
| 2026-04-07T02:20:00Z | `pnpm run check:ide-entry-smoke` | Pass | IDE entry smoke 继续保证 VS Code / JetBrains / Cursor / Claude Code 示例入口资产一致，同时公开支持边界仍把真实 VS Code extension 保持在 source-checkout 路径。 |
| 2026-04-07T02:20:23Z | `pnpm run check:ide-docs-parity` | Pass | IDE 模板文档 parity 在受检的 `integrations/ide/**` 面继续保持绿色；公开 VS Code 支持边界的 packaged-artifact 真值仍由 packaging-boundary test 与 `pnpm pack --json --dry-run` 共同支撑，而 support-matrix/playbook/README 的文字收口是在同一 closeout 窗口内完成的。 |
| 2026-04-06T23:37:45Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run` | Pass | `.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` 以及生成的 report/replay/diagnostics 产物保留了 `dry_run=true`、`policy_outcome=allow`，并在 project-final review 前留下完整可回放的 `prepare -> execute -> report` 成功链路。 |
| 2026-04-06T23:37:26Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters verify` | Warn（非阻断） | `.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json` 与 `/Users/jimmydaddy/.repo-ai-governor/workspaces/2cf23e5951f0/.repo-ai-governor/context/diagnostics/verify/verify-1775518628055.json` 现已把 `role_tester` 投影为 `selected=github-copilot transport=cli_exec`；剩余 warning 仍只限于 tool-managed workspace 的 bootstrap 真值，而不是 required-role failure。 |
| 2026-04-06T23:36:54Z | `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1` | Pass | sprint-003 的定向验证切片一次性覆盖了 `github-copilot`、`local-model`、adapter-verification runtime projection 与 first-batch routing acceptance（`4` 个文件、`42` 个测试全部通过）。 |
| 2026-04-06T17:45:29Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run` | Pass | `.tmp/project-053-sprint-002-run-dry-run-trace.json` 以及生成的 report/replay/diagnostics 产物现已保留 `dry_run=true`、`policy_outcome=allow`，并在默认 `codex` primary route 下完成了完整的基线 `prepare -> execute -> report` 成功链路。 |
| 2026-04-06T17:44:58Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters verify` | Warn（非阻断） | `.tmp/project-053-sprint-002-verify-adapters.json` 与 verify diagnostics artifact 已把 `planner` / `architect` / `coder` / `reviewer` / `verifier` 投影为 `codex + cli_exec`；剩余 warning 仅限于 tool-managed workspace 的 durable-storage、artifact-registry 与 task-ledger 初始化真值。 |
| 2026-04-06T16:26:31Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run` | Warn | `.tmp/project-053-sprint-001-run-dry-run-trace.json` 以及生成的 report/replay/diagnostics 产物完整保留了 `dry_run=true`、`policy_outcome=allow` 和 `stage-task-prepare` 的 stage-level failure attribution；当前默认 route 仍失败在 `codex`，但证据链已可回放。 |
| 2026-04-06T16:25:22Z | `node ./dist/bin/repo-ai-governor.js --output json --adapters verify` | Warn（非阻断） | `.tmp/project-053-sprint-001-verify-adapters.json` 与 verify diagnostics artifact 明确给出 `claude-code` 的 effective `cli_exec`、`request_timeout_ms=30000`、`max_retries=2`，并把本地 health-check failure 保持为 environment-precondition warning，而不是静默 `null` transport。 |
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

## 9. GA Support Truthfulness 快照（TK-596）

1. `docs/support-matrix*.md` 现在是当前支持状态与 GA support truthfulness 的唯一公开 truth surface。
2. `docs/maintainer-validation-playbook*.md` 保留为 maintainer runbook 与 backlink router，不再维护一张平行的 support-status 表。
3. `docs/ga-readiness-evidence*.md` 保留为 program-level signal matrix；它可以回链这里，但不再独立重定义公开支持边界。

| Claim scope | Audience | Surface | Status | 证据时间（UTC） | 证据命令 / 产物 | 证据摘要 | Backlink target | Refresh trigger | Residual risk |
|---|---|---|---|---|---|---|---|---|---|
| VS Code secondary surface boundary | adopter + maintainer | source-checkout editor-native companion | Pass | 2026-04-07 | `apps/vscode-extension/README.md`、`docs/support-matrix.zh-CN.md`、`docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` | 当前支持边界已明确把真实 VS Code extension 提升为首选 secondary surface，但仅限于已构建源码仓的使用路径。packaging-boundary test、service-runtime degrade-path guard 与 dry-run package manifest 一起证明：正式支持仍不包含 packaged npm/VSIX 分发，tarball 中即使出现内部 `dist/apps/vscode-extension/**` 也只属于非安装型 runtime payload；`check:ide-docs-parity` 只覆盖受检的 IDE 模板文档面，不直接证明这张公开 support-truth 表本身。 | `docs/local-adoption-playbook.zh-CN.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`apps/vscode-extension/README.md` | extension packaging path、trust-gating contract 或 secondary-surface 叙事变化 | 若后续要支持正式 VSIX 或 packaged delivery，必须新增独立 packaging truth 行并补齐专门演练证据。 |
| clean-room install baseline | adopter + maintainer | `path` / `link` 安装模式 | Pass | 2026-04-06T12:09:11Z | `.tmp/project-052-sprint-001-cleanroom-report.json` | `path` 与 `link` 都通过了 clean-room 链路，并覆盖 workspace-switch rollback 相关预检。 | `docs/maintainer-validation-playbook.zh-CN.md`、`.tmp/project-052-sprint-001-cleanroom-report.json` | install-mode contract 或 packaged runtime 变化 | 更宽的 `tgz` / registry-backed packaged install 仍依赖单独的 packaged distribution rehearsal。 |
| packaged distribution rehearsal | maintainer | local distribution / packaged surface | Pass | 2026-04-06T12:08:49Z | `.tmp/project-052-sprint-001-local-distribution-report.json` | 本地分发验证通过，且 adapter `doctor/verify` 继续以非阻断 warn 处理，而不是被误判成支持失败。 | `docs/maintainer-validation-playbook.zh-CN.md`、`.tmp/project-052-sprint-001-local-distribution-report.json` | packaging layout、release asset 或 dist runtime 变化 | adapter warn 语义仍与环境前置条件有关。 |
| repo-external upgrade/workspace closeout | adopter + maintainer | `upgrade` 与 `workspace` 用户路径 | Pass | 2026-04-06T21:29:47Z | `.tmp/project-052-sprint-002-command-rehearsal-summary.json` | 外部 rehearsal 已通过 `preview -> apply -> rollback` 与 `dry-run -> execute -> rollback`，并验证 rollback 与 scratch cleanup 都成立。 | `docs/local-adoption-playbook.zh-CN.md`、`.tmp/project-052-sprint-002-command-rehearsal-summary.json` | command contract、rollback artifact 语义或 troubleshooting 流程变化 | 最终 project completion promotion 现在只取决于 project-final review clean 与最终 closeout write-back。 |
| real adapter invocation rollout | adopter + maintainer | 多 adapter 支持真值（`claude-code`、`codex`、`github-copilot`、`local-model`） | Pass | 2026-04-06T23:37:45Z | `.tmp/project-053-sprint-003-verify-adapters-tk-605-606.json`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` | support matrix 现在已明确区分 `claude-code` / `codex` / `github-copilot` 的 real-path available 与 `local-model` 的 fallback-only real-path，且新的 dry-run trace 也保留了默认 CLI-backed 基线的 replay/report/diagnostics 证据链。 | `docs/local-adoption-playbook.zh-CN.md`、`.tmp/project-053-sprint-003-run-dry-run-trace-tk-605-606.json` | adapter routing contract、support-label 语义或 verify projection 变化 | `verify --adapters` 仍会报告与 required-role failure 无关的 tool-managed workspace bootstrap 非阻断 warning。 |
| maintainer release runbook | maintainer | 本地 release-gate rehearsal | Pass | 2026-04-04T12:12:23Z | `pnpm run release:verify-local` | maintainer gate 继续在一条 runbook 步骤里验证 CLI help smoke、desktop entry smoke、examples runtime smoke、dist-binary remote-api smoke 与 packed-surface truthfulness。 | `docs/maintainer-validation-playbook.zh-CN.md` | release gate 组成或 packaged surface 变化 | 这一行是 runbook-backed rehearsal，不是新的公开 support contract。 |
| program-level GA signals | maintainer + project-closeout | 跨阶段 GA readiness | Pass | 2026-04-05 | `docs/ga-readiness-evidence.zh-CN.md` | 更广义的 GA signal matrix 仍然全绿，并改为回链本 section，而不是再充当一份平行的公开 support claim。 | `docs/ga-readiness-evidence.zh-CN.md` | GA signal threshold 或上游 evidence refresh 变化 | completion recommendation 已准备完成；最终 project completion promotion 仍取决于 project-final review clean 与最终 closeout write-back。 |

4. `project-052` 的 prepared closeout recommendation 现已写入 `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/project-052-adopter-truthfulness-and-ga-closeout-completion-audit-summary.md`；最终 `completed` verdict 现在只取决于 project-final review loop clean 与最终 completion write-back。

## 10. 备注

1. adapter 的 degrade / warning 仍属于环境前置条件（如 `github-copilot` quota/probe、`claude-code` CLI health-check / auth 前置条件、`local-model` endpoint/model capability 限制），而不是治理链路失败。
2. `project-046` 已把 desktop artifact pane 从 deferred gate 推进为 service-owned typed query contract；renderer 仍不允许直接旁路 workspace 文件系统。
3. 官方 `GitLab CI` 与 `Jenkins` 模板现已发布到 `integrations/ci/`，并复用与 GitHub Actions 相同的 install、quality-gate 与 release-governance 命令契约。
4. 本文档定义 `TK-301`、desktop baseline refresh `TK-547`、`project-046` P1 收口工作、`project-052 / sprint-001` install-mode truth refresh、`project-052 / sprint-002` upgrade/workspace contract 与 acceptance closeout、`project-052 / sprint-003` 的 GA support truthfulness consolidation、`project-053 / sprint-001` 的 `claude-code` real-path baseline truth refresh、`project-053 / sprint-002` 的 `codex` real-path plus routed dry-run acceptance refresh、`project-053 / sprint-003` 的 `github-copilot` real-path 与 `local-model` fallback-only positioning closeout、`project-054 / sprint-001` 的 VS Code secondary-surface packaging/support freeze，以及 `project-054 / sprint-002 / TK-610` 冻结出的 VS Code MVP gap list 与 desktop foundation non-goal guardrails 这些正式支持边界；更广义的 GA Readiness 收口现在转入后续项目。
