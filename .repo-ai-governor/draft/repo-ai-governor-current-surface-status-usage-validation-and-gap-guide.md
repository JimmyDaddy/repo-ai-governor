# Repo AI Governor 当前端面现状、使用方式、验证路径与功能缺口指南

- Status: draft
- Date: 2026-04-06
- Scope: current repository surfaces / usage / validation / known gaps
- Audience:
  - 外部 adopter
  - 本仓库维护者
  - 需要评估当前产品完成度的内部协作者
- Basis:
  - `README.md`
  - `README.zh-CN.md`
  - `docs/local-adoption-playbook.zh-CN.md`
  - `docs/maintainer-validation-playbook.zh-CN.md`
  - `docs/support-matrix.zh-CN.md`
  - `apps/cli/README.md`
  - `apps/desktop/README.md`
  - `apps/vscode-extension/README.md`
  - `integrations/ide/README.md`
  - `integrations/desktop/README.md`
  - `integrations/ci/README.md`
  - `packages/standards/README.md`
  - `examples/README.md`
  - `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`

## 1. 一句话结论

当前仓库已经不是概念性 MVP 骨架，而是具备正式 CLI 主入口、多工具接入、多阶段治理闭环、host-native distribution、desktop sidecar foundation、VS Code extension MVP、CI 模板、examples 与维护者验证路径的可运行产品基线。

但如果问题变成“是否已经达到全面 GA、所有端面都同等成熟”，结论仍然是否定的。当前最成熟的是 CLI、治理引擎、host distribution 和内部维护者验证链；仍在继续收口的主要是更广泛 adopter 产品化体验、真实 provider 调用默认化、desktop richer product、以及部分非 CLI surface 的正式支持宣告。

## 2. 当前端面总览

| 端面 / Surface | 当前状态 | 已实现内容 | 主要使用入口 | 主要验证方式 | 当前主要缺口 |
|---|---|---|---|---|---|
| CLI | production primary entry | `init/doctor/check/run/review/review-verify/verify/connect/plan/host/upgrade/workspace/workflow/resume`，并支持 session-first shell、`pretty/plain/json` 输出 | `pnpm exec repo-ai-governor ...` 或 `node dist/bin/repo-ai-governor.js ...` | `pnpm run build`、`node ./dist/bin/repo-ai-governor.js --help`、`pnpm run check` | 外部 adopter 的安装/升级体验仍需继续产品化 |
| Session shell / React shell | active | CLI 无子命令入口、`resume`、slash command、workflow/upgrade/plan 等交互式入口 | `pnpm exec repo-ai-governor --output pretty` | 本地 TTY 演练、`resume` 恢复、相关命令 smoke | 仍以 CLI shell 为核心，不是独立桌面产品 |
| 多工具接入与治理闭环 | active | `connect -> doctor/verify -> run -> review -> review-verify`，支持 Codex / Claude Code / GitHub Copilot / local-model routing | `connect`、`verify --adapters`、`run --dry-run --trace` | `verify --adapters`、adapter smoke、examples | 多数正式支持仍偏 fixture-backed，真实 provider 默认化仍需推进 |
| Host-native distribution | completed in current scope | `host export / verify / pack`、Codex / Claude Code project-local assets、GitHub Copilot repo-local / cli plugin targets、`.mcp.json`、Claude hooks、Codex subagents、Copilot hooks | `repo-ai-governor host ...` | `host --help`、project-050 audit、bundle / verify smoke | GitHub.com coding agent 仍是 reserved target |
| Desktop execution surface | MVP foundation formally supported | sidecar + IPC、typed preload bridge、session bridge、execution board / HITL inbox / queue overview / artifact pane service seam | `apps/desktop` + `@cjhdev/repo-ai-governor/service-host` | `pnpm run check:desktop-entry-smoke`、`release:verify-local`、desktop tests | 仍是 foundation / command-center surface，不是完整桌面成品 |
| VS Code extension app | MVP app active | activity bar container、`Execution Board`、`HITL Inbox`、`Workspace Context`、`Review Detail`、`@governor` chat participant | `apps/vscode-extension` | package-level tests、`check:ide-entry-smoke`、`check:ide-docs-parity` | 当前是 editor companion MVP，root support matrix 还未把它单列为 primary support surface |
| IDE wrapper/contracts | active | VS Code / JetBrains / Cursor / Claude Code wrapper contract、环境变量注入、降级与 nextAction 约定 | `integrations/ide/` | `pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` | wrapper 面成熟，高阶 IDE-native product 仍未全部产品化 |
| CI templates | active | GitHub Actions / GitLab CI / Jenkins 模板、统一 quality/release gate 契约 | `integrations/ci/` | 模板 review + `pnpm run check` / `release:*` | 更多 CI 平台和更强 adopter onboarding 仍可扩展 |
| Standards packs / language templates | active | `StandardsPackRegistry`、`RuleRenderer`、`AgentsProjector`、`StandardsUpgradePlanner`、Python/Go minimal packs | `@repo-ai-governor/standards` | package tests、docs、runtime loader use cases | 更丰富语言生态与外部团队消费体验仍需继续打磨 |
| Examples / docs playbooks | active | 单角色、多角色、HITL 升级、受限网络降级、optional plugin memory example、维护者/采用手册 | `examples/`、`docs/*.md` | `check:examples-doc-smoke`、`check:examples-runtime-smoke` | 文档面较完整，但仍需随着产品边界继续刷新 |

## 3. 各端实现情况

### 3.1 CLI 主入口

当前 CLI 是本仓库明确的生产主入口，也是当前对外 adopter 最稳定的使用面。

已经落地的核心命令面：

1. `init`
2. `doctor`
3. `check`
4. `run`
5. `review`
6. `review-verify`
7. `verify`
8. `connect`
9. `plan`
10. `host`
11. `upgrade`
12. `workspace`
13. `workflow`
14. `resume`
15. `set-ui-theme`

当前 CLI 已具备的核心特征：

1. 支持 `pretty / plain / json` 三种输出模式。
2. 在本地 TTY + `pretty` 下可进入 session-first shell。
3. `run` 支持 `--dry-run`、`--trace`、`--replay <path>`。
4. `review-verify` 会写入台账回填产物。
5. `workspace` 已支持 `tool_managed / repo_local` 迁移、回滚、配置清理与主题设置。
6. `workflow` 已支持 preview / create / edit。
7. `upgrade` 已支持 preview / apply / rollback 的受控语义。

当前判断：

1. CLI 已不是只展示帮助信息的壳，而是产品主线已经收敛的可执行入口。
2. 如果只选择一个面向外部 adopter 的正式入口，仍应优先选择 CLI。

### 3.2 Session shell / React shell

CLI 上已经叠加了比较成熟的交互式 shell 面：

1. 无子命令入口可进入 session shell。
2. `resume [session-id]` 可恢复持久化会话。
3. 支持 slash command 能力目录，例如 `/help`、`/connect`、`/doctor`、`/verify`、`/workflow`、`/plan`、`/review`、`/run`。
4. 支持 React shell 主题与交互式 workflow / upgrade surface。

当前判断：

1. 这部分已经是 CLI 产品体验的重要组成，而不是单纯开发实验。
2. 但它仍属于 CLI 交互层，不应被误解为已独立交付的 desktop GUI。

### 3.3 多工具接入与治理闭环

当前仓库已经具备完整的 adopter-facing 接入和治理闭环：

1. `connect` 生成 candidate 配置，而不是直接粗暴改写活动 `governor.yaml`。
2. `doctor --adapters --fix` 负责 safe-local 诊断与有限自动修复。
3. `verify --adapters` 提供路由与 readiness 真值。
4. `run --dry-run --trace` 提供最安全的多工具路由演练。
5. `plan -> run -> review -> review-verify` 构成第一条治理闭环。

当前支持矩阵中的 adapter surface：

1. `codex`
2. `github-copilot`
3. `claude-code`
4. `local-model (ollama)`

当前状态口径需要特别注意：

1. 这些 adapter 已经进入正式支持矩阵。
2. 但支持说明仍以 `fixture-backed` 为主，而不是“所有场景默认真实远程调用”。
3. `local-model` 已被定义为正式本地 fallback surface，但 `tool_calling`、`structured_output`、`confirmation_gate` 仍维持保守/降级口径。

### 3.4 Host-native distribution 与 host command

这是当前已经非常完整、并在 `project-050` 中明确完成的一条产品线。

当前已完成的能力包括：

1. `host export / verify / pack` 正式命令面。
2. Codex / Claude Code 的 project-local assets。
3. GitHub Copilot 的 `repo_local` 与 `cli_plugin` target 区分。
4. `.codex-plugin`、`.claude-plugin`、Copilot CLI plugin installable bundle。
5. `.mcp.json`、Claude hooks、Codex subagents、Copilot hooks 等 advanced host enhancements。

当前仓库中已有完成态资产证据：

1. `.repo-ai-governor/generated/hosts-final/codex/`
2. `.repo-ai-governor/generated/hosts-final/claude-code/`
3. `.repo-ai-governor/generated/hosts-final/github-copilot-repo-local/`
4. `.repo-ai-governor/generated/hosts-final/codex-plugin/`
5. `.repo-ai-governor/generated/hosts-final/claude-code-plugin/`
6. `.repo-ai-governor/generated/hosts-final/github-copilot-cli-plugin/`
7. `.repo-ai-governor/generated/hosts-final/github-com-agent-apply-blocked/`
8. `.repo-ai-governor/generated/hosts-final/github-com-agent-verify-blocked/`

当前判断：

1. Host distribution 已不再停留在“未来要做”的层面。
2. 当前最大缺口不是 project-local / plugin / hooks，而是 GitHub.com coding agent target 仍是 reserved / non-MVP。

### 3.5 Desktop execution surface

当前 desktop 不是完整 Electron 产品，但已经形成正式 foundation。

已经冻结或已实现的核心边界：

1. sidecar + IPC desktop host bootstrap
2. typed preload bridge
3. session bridge
4. governance console transport-neutral view-model
5. lifecycle / restart / service-owned artifact-pane contract baseline
6. execution board / HITL inbox / queue overview / artifact pane 等 service-owned read-model seam

当前正式约束：

1. desktop 只能消费 `@repo-ai-governor/orchestration-service-client` 的 DTO / event contract。
2. 唯一推荐 host / transport 组合是 `sidecar + ipc`。
3. richer UI 不得旁路 service-owned state truth。
4. 需要本地 service host 时，应通过根包公开入口 `@cjhdev/repo-ai-governor/service-host` 使用。

当前判断：

1. desktop 已有正式 foundation 与验证链。
2. 但它还不是“完整桌面产品完成态”，更像 command center surface foundation。

### 3.6 VS Code extension app

`apps/vscode-extension` 已经不是 wrapper sample，而是“真实 VS Code extension workspace app for the editor companion MVP”。

当前 MVP 面包含：

1. Activity bar 自定义容器
2. `Execution Board`
3. `HITL Inbox`
4. `Workspace Context`
5. `Review Detail` webview
6. `@governor` chat participant

当前 runtime boundary 也比较明确：

1. extension host 只做 activation wiring 与 presentation。
2. service truth 由 `LocalOrchestrationServiceSidecarClient` 持有。
3. extension 不持有 shadow execution / session / policy state。
4. trust-sensitive actions 继续受 `Workspace Trust` gate 保护。

当前判断：

1. VS Code extension 已是 package/app 级真实实现。
2. 但根级支持矩阵当前仍重点宣告 CLI 与 desktop sidecar；因此它更接近“活跃 MVP app”，而不是“最稳定 primary surface”。

### 3.7 IDE wrapper/contracts

`integrations/ide` 不是 VS Code extension app 本体，而是多 IDE wrapper 基线。

它负责：

1. 统一 CLI 调用 envelope
2. 注入 `REPO_AI_GOVERNOR_*` 环境变量
3. 提供 VS Code / JetBrains / Cursor / Claude Code 的样例模板
4. 固化降级、capability 与 `nextAction` 语义

当前判断：

1. IDE wrapper/contracts 已相当成熟。
2. 其价值主要在于“跨 IDE 接入一致性”，不是单一 IDE 的完整产品体验。

### 3.8 CI 模板端

`integrations/ci` 已发布三套官方模板：

1. GitHub Actions
2. GitLab CI
3. Jenkins declarative pipeline

它们共享同一命令契约：

1. `pnpm install --frozen-lockfile`
2. `pnpm run check:stage9-handoff`
3. `pnpm run check`
4. 可选 `pnpm run ci:quality`
5. release channel 走 `release:check` / `release:candidate` / `release:ga-candidate-unified-gate`

当前判断：

1. CI 端已经形成可复用模板，不再是“只支持 GitHub Actions”的早期状态。
2. 当前缺口更多在模板覆盖面继续扩展，而不是基线不存在。

### 3.9 Standards packs 与最小语言模板

`@repo-ai-governor/standards` 当前已经具备：

1. `StandardsPackRegistry`
2. `RuleRenderer`
3. `AgentsProjector`
4. `StandardsUpgradePlanner`
5. `StandardsRuntimeLoader`

并且已经内置：

1. `pythonMinimalGovernancePack`
2. `goMinimalGovernancePack`

当前判断：

1. Standards/AGENTS 投影这一块在治理层面很成熟。
2. 仍可继续扩展更多语言与更强的外部消费体验，但这已不属于“能力缺失”，而是“范围继续扩展”。

### 3.10 Examples / adoption docs / maintainer docs

当前 examples 与 docs 面已经较完整：

1. `examples/single-role-minimal-flow`
2. `examples/multi-role-collaboration-flow`
3. `examples/hitl-escalation-flow`
4. `examples/restricted-network-degrade-flow`
5. `examples/optional-plugin-memory-flow`（仅 plugin-enabled distribution）
6. `docs/local-adoption-playbook*.md`
7. `docs/maintainer-validation-playbook*.md`
8. `docs/support-matrix*.md`

当前判断：

1. 文档和 examples 已经能支撑 adopter 与 maintainer 两类人群。
2. 后续主要工作是随产品边界继续同步更新，而不是从零补文档。

## 4. 怎么使用

### 4.1 外部 adopter 的最小接入

推荐安装路径优先级：

1. `path`
2. `link`
3. `dist-binary`
4. `tgz`（需要联网解析 registry 依赖）

最小起步命令：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

如果暂时不想改目标仓库依赖图，可直接用：

```bash
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
```

### 4.2 多工具接入

推荐路径：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

使用建议：

1. 先看 `connect` 生成的 candidate，而不是直接 apply。
2. 把 `verify --adapters` 看作真实执行前的 readiness gate。
3. 首次演练优先使用 `run --dry-run --trace`。

### 4.3 第一条治理闭环

推荐路径：

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

典型输出会出现在活动 workspace 下，例如：

1. `context/diagnostics/run/`
2. `context/review-queue/requests`
3. `context/review-queue/results`
4. `context/ledger-backfill/review-verify`

### 4.4 Session shell / React shell

推荐路径：

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume
```

建议关注：

1. 本地 TTY + `pretty` 时才会真正进入交互壳。
2. `plain/json`、非 TTY、`--no-interactive` 会自动走非交互路径。

### 4.5 Workspace 模式迁移

推荐路径：

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

建议：

1. 保留 `plan-path`。
2. 迁移后重新执行 `doctor` 确认 `workspaceRoot`。

### 4.6 Host-native assets / plugin bundle

基础命令：

```bash
repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex
repo-ai-governor host verify --output-dir .repo-ai-governor/generated/hosts/codex
repo-ai-governor host pack --host claude-code --mode plugin-bundle --bundle-dir .repo-ai-governor/generated/bundles/claude
```

适用场景：

1. 想向 Codex / Claude Code / GitHub Copilot 输出宿主可发现资产。
2. 想做 plugin bundle 的本地分发或验收演练。

### 4.7 维护者级使用路径

维护者应优先走：

```bash
pnpm run check
pnpm run release:verify-local
pnpm run release:ga-check
```

如果要做真实目标仓库验收，可参考：

```bash
TARGET_REPO=/absolute/path/to/real-target-repo \
bash "$GOVERNOR_REPO/scripts/acceptance/run-project-027-real-project-validation.sh"
```

## 5. 怎么验证

### 5.1 本次窗口已做的 spot-check

本次变更窗口内已实际执行并通过：

1. `pnpm run build`
2. `node ./dist/bin/repo-ai-governor.js --help`
3. `node ./dist/bin/repo-ai-governor.js host --help`
4. `node ./dist/bin/repo-ai-governor.js workflow --help`
5. `pnpm run check:examples-doc-smoke`
6. `pnpm run check:examples-runtime-smoke`

说明：

1. 同一窗口内，`examples-runtime-smoke` 目前在本工作区是通过的。
2. 这意味着 examples 层至少在当前工作区和当前构建产物下没有明显漂移。

### 5.2 adopter 级快速验证

推荐命令：

```bash
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

判定目标：

1. CLI 不崩溃。
2. workspace 能初始化。
3. `doctor/check` 返回机器可读结构。
4. `verify --adapters` 能返回路由和 readiness 真值。
5. `run --dry-run --trace` 能产出诊断 artifact。

### 5.3 host distribution 验证

推荐命令：

```bash
node ./dist/bin/repo-ai-governor.js host --help
pnpm run release:verify-local
```

如需更直接的 bundle / export / verify 验证，可结合 `host export / verify / pack` 与 `generated/hosts-final/**` 产物进行抽样。

### 5.4 VS Code extension 验证

推荐命令：

```bash
pnpm exec vitest run apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts
pnpm run build
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md
```

### 5.5 Desktop surface 验证

推荐命令：

```bash
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local
pnpm run release:verify-cleanroom-local-install
```

如需更细粒度验证，可执行 desktop package 相关 vitest 切片。

### 5.6 IDE wrapper / docs parity 验证

推荐命令：

```bash
pnpm run check:ide-entry-smoke
pnpm run check:ide-docs-parity
```

### 5.7 CI / release / maintainer 级验证

推荐命令：

```bash
pnpm run check
pnpm run ci:quality
pnpm run release:verify-cleanroom-local-install
pnpm run release:verify-local
pnpm run release:ga-check
```

### 5.8 历史验证快照

支持矩阵中已有较新的正式快照证据：

1. `2026-04-04`：`pnpm run build`、`test:packages`、`test:integration`、`release:verify-local`
2. `2026-04-05`：desktop package 定向测试、adapter smoke 切片
3. `2026-03-27`：`doctor`、`verify --adapters`、workspace dry-run、本地分发验证、desktop smoke

这说明当前结论并不只依赖本次手工 spot-check。

## 6. 当前功能缺口与已知限制

### 6.1 CLI 虽然最成熟，但 adopter 产品化仍未完全等于 GA

当前 CLI 已经可用，但“可用”和“外部 adopter 全场景都无痛接入”仍有差距。

仍需继续推进的点：

1. 更平滑的升级迁移 UX。
2. 更强的 packaged-install / clean-room 口径统一说明。
3. 更进一步的 adopter 级 onboarding 收口。

### 6.2 Adapter 正式支持仍大量依赖 fixture-backed 口径

当前支持矩阵承认 Codex / Claude Code / GitHub Copilot / local-model 都在正式支持范围中，但多数口径仍是：

1. fixture-backed 主路径
2. readiness / degrade / fallback 受控
3. 真实 provider 调用仍需要额外环境准备

这不是“适配器不存在”，而是“默认生产化真实调用路径还没有完全收口”。

### 6.3 GitHub.com coding agent target 仍是 reserved / non-MVP

当前 host distribution 已明确把 GitHub Copilot target 拆成：

1. `repo_local`
2. `cli_plugin`
3. reserved `github_com_agent`

当前缺口：

1. GitHub.com coding agent 还未进入正式开放支持。
2. 相关导出 / apply / verify 仍保持 blocked/reserved 口径。

### 6.4 Desktop 仍是 foundation，而不是完整桌面产品完成态

当前 desktop 的强项是：

1. service seam
2. sidecar + IPC
3. governance console view-model
4. artifact-pane / queue overview / HITL inbox

当前仍未完成的点：

1. 完整桌面产品壳
2. 更丰富的交互面板与稳定的 end-user packaging narrative
3. 与 CLI 同等级别的 adopter-facing 产品宣告

### 6.5 VS Code extension 已经存在，但 root-level 正式支持重心仍在 CLI

VS Code extension 已经是 active app，但从整体产品口径看：

1. CLI 仍是 primary surface。
2. VS Code extension 更接近 editor companion MVP。
3. 它需要继续积累更多 installer / packaging / adopter docs / release evidence，才能与 CLI 同等级别对外宣告。

### 6.6 `local-model` 仍保留能力降级边界

已知保守口径包括：

1. `tool_calling`
2. `structured_output`
3. `confirmation_gate`

因此它更适合作为本地 fallback / restricted-network path，而不是当前默认的最强能力主路由。

### 6.7 `tgz` 与 package install 的现实边界仍需明确管理

当前文档明确指出：

1. `tgz` 不是离线自包含安装。
2. 安装阶段仍需访问 npm registry。
3. `dist-binary` 验证的是 CLI/runtime 行为，不等于 package install surface 全部已验证。

这说明分发真值虽然已经很强，但仍需要继续避免“看起来能装”和“真正外部接入稳定”之间的误解。

### 6.8 GA signals 仍在继续沉淀

支持矩阵已经明确提醒：

1. 当前正式支持边界已经形成。
2. 但 `GA Readiness` 的全量信号覆盖仍在持续沉淀。

换句话说：

1. 产品主线已形成。
2. 但还不适合把所有尚在深化中的能力都表述为“完全完成”。

## 7. 推荐的下一步优先级

如果目标是继续提高“对外 adopter 的真实完成度”，建议优先顺序如下：

1. 继续强化 packaged-install / clean-room / release truthfulness，并保持 docs 与 gate 完全同步。
2. 逐步把 fixture-backed adapter 支持推进到更稳定的 real-invocation product path。
3. 完善 desktop / VS Code extension 的 adopter-facing narrative、安装说明和 release evidence。
4. 决定是否开启 GitHub.com coding agent target 的 follow-up stream，而不是在现有 target 上直接放开。
5. 继续扩展语言模板、团队 pack 分发与更广泛生态消费体验。

## 8. 结论

截至 `2026-04-06`，Repo AI Governor 的当前状态可以概括为：

1. CLI、治理引擎、多工具接入、examples、CI、host distribution 已经形成强基线。
2. desktop 与 VS Code extension 已进入“真实实现 + 可验证 MVP/foundation”阶段，而不是纸面设计。
3. 当前最大的剩余工作不再是“能力是否存在”，而是“外部 adopter 体验是否足够稳定、足够清晰、足够全面”。
4. 因此，当前最准确的定位不是“未完成原型”，也不是“所有端面 GA 完成”，而是“核心产品面已成型，正在从强工程基线持续收口到更成熟的 adopter-facing 产品”。
