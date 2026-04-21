# 本地接入操作手册

这份 playbook 面向在目标仓库中接入 `repo-ai-governor` 的使用者。

当你想回答这些问题时，用它最合适：

1. 我应该怎样把它装进一个真实仓库，或者先做一轮演练？
2. 最安全、最短的首轮成功路径是什么？
3. 多工具接入、个人默认值和 secrets 应该怎么配？
4. 怎样在不冒不必要风险的前提下跑通第一条 governed loop？

如果你维护或发布的是 `repo-ai-governor` 本身，请改看 `docs/maintainer-validation-playbook.zh-CN.md`。

`docs/support-matrix.zh-CN.md` 仍然是正式支持真值；这份文档是面向操作者的 runbook。

## 一屏看懂默认路径

大多数 adopter 一开始不需要把所有模式和命令全部比较一遍。

如果你只想先走最短、最稳妥的默认路径，就按下面做：

1. 想先无安装演练，用 `dist-binary`；要接入真实 `pnpm` 仓库，用 `path`。
2. 跑 `init`。
3. 跑 `doctor`。
4. 跑 `adopt bootstrap`。
5. 跑 `check`。
6. 再跑 `connect`，然后执行 `run --dry-run --trace`。

后面的章节再展开解释：什么时候该换路径，以及如何解读这些命令产出的 diagnostics。

## 1. 先选最轻的安装路径

优先选择“刚好能证明你关心的行为”的最小路径。

| 模式 | 适用场景 | 主命令 |
|---|---|---|
| `dist-binary` | 想先做无安装演练，或目标仓库是脏工作树 / 非 `pnpm` | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |
| `path` | 想在 `pnpm` 仓库里走正常本地接入路径 | `pnpm add --save-exact <governor-repo>` |
| `link` | 目标仓库需要持续跟随你的本地源码 checkout | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | 想在联网环境里演练打包后的 CLI tarball | `pnpm pack --json` 然后 `pnpm add --save-exact <tarball>` |

简单判断：

1. 想要最低风险证明，先用 `dist-binary`。
2. 目标仓库本来就是 `pnpm`，而且准备长期安装 governor，就用 `path`。
3. 只有明确要跟着本地源码变化走，才用 `link`。
4. 只有明确需要 packaged-install 证据，并且环境还能访问 npm registry，才用 `tgz`。它不是离线自包含安装器。

## 2. 最短首轮成功路径

假设 governor 源码仓是 `<governor-repo>`，目标仓库是 `<target-repo>`。

### 路径 A：无安装演练

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

### 路径 B：装进目标仓库

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

首轮成功的判断标准：

1. `init` 能完成一轮引导式初始化。
2. `doctor` 会输出事实，而不是崩溃。
3. `check` 即使面对一个不是 self-host 副本的外部仓库，也能返回机器可读结果。

给外部 adopter 的提示：

1. 全新的目标仓库仍可能出现 `baseline_docs missing=5/5` 或 `script_not_found` 之类 warning。
2. 除非你本来就要 vendoring 本仓库的治理文档和脚本，否则应把它们视为提示，而不是失败。
3. `init` 默认是 `tool_managed`，因此新的目标仓库未必会立刻生成 `.repo-ai-governor/`。

## 3. 优先使用 `adopt bootstrap` 的受管安装路径

当基础环境 bootstrap（`init` + `doctor`）成功后，优先走受管安装 quickstart，而不是直接切到更低层的 host export。

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt bootstrap --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor check --output json
```

为什么这是默认路径：

1. `adopt bootstrap` 会按固定顺序执行 `init -> bootstrap doctor preflight -> adopt apply -> adopt verify`。
2. 如果你省略 selector，bootstrap 会默认选用官方内置 pack；显式 selector 则复用当前的 pack-id/profile-alias 规则，并在歧义时保持 fail-closed。
3. bootstrap 产生的 init/bootstrap-doctor/bootstrap-summary 产物只是增量 hand-off diagnostics；install receipt 与 `adopt verify` summary 仍然是 `.repo-ai-governor/adoption/installations/**` 下的 canonical install truth。
4. 只有匹配且干净的旧安装会被 clean rerun 复用；一旦出现 drift 或 pack/profile mismatch，就会导回 `adopt diff/upgrade/remove`。
5. `check` 仍然是安装后的显式更广治理 follow-up，而不是 install 结果的一部分。

quickstart 成功后，后续的复验或变更仍然走这组受管生命周期命令：

```bash
pnpm exec repo-ai-governor adopt verify --repo . --output json
pnpm exec repo-ai-governor adopt diff --repo . --output json
pnpm exec repo-ai-governor adopt upgrade --repo . --output json
pnpm exec repo-ai-governor adopt remove --repo . --output json
```

只有当目标仓库本身要承载一套 repo-local governance workspace 模板时，才使用 self-host profile：

```bash
pnpm exec repo-ai-governor adopt bootstrap --adoption-profile self-host-complete --repo . --workspace-mode repo_local --hosts codex --output json
pnpm exec repo-ai-governor check --output json
```

这条路径只会 seed 空白或模板化的治理 surface，不会复制本仓库的 live execution state。

对 self-host 验证结果要保守解读：

1. 新鲜的 `self-host-complete + repo_local` bootstrap 或后续 `adopt verify`，在 starter governance、product-direction 或 execution placeholder 仍未触碰时，预期会返回 `warn`。
2. 这些 warning 只属于 self-host readiness signal；默认的 `adopter-complete` 安装路径不会继承它们。
3. `adopt verify` 现在会对未触碰的 self-host starter placeholder 暴露 `execution_preflight_signal=blocked` warning；在无人值守的 self-host 执行前，应把它视为硬阻断，因为当前公开契约还没有单独的自动 preflight 命令。
4. 当仓库开始编写自己的 repo-local surface 之后，应继续把 `check` 当成显式的更广治理审计，而不是用 `adopt verify` 代替完整 workspace readiness。

## 4. 先接工具，再去执行

当你希望一个仓库基线能通过同一套 governed flow 路由多种工具时，用 `connect`。

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
```

每一步的意义：

1. `connect` 先写可审阅 candidate config，不会原地盲改活动配置。
2. `doctor --adapters --fix` 只做 safe local repairs。
3. 第二次 `doctor --adapters` 是真实执行前的只读 readiness check。
4. `run --dry-run --trace` 是证明路由和 projected descriptor 是否合理的最低风险方式。

如果你一开始就要配置 `remote_api`，用显式 authoring flags，不要先手改配置；这也是最低风险的 remote-api rehearsal 路径：

```bash
pnpm exec repo-ai-governor connect --tools codex --remote-api-model codex=gpt-5 --output pretty
pnpm exec repo-ai-governor connect --tools claude-code --remote-api-model claude-code=<model> --remote-api-credential-env-var claude-code=ANTHROPIC_API_KEY --remote-api-endpoint claude-code=https://api.anthropic.com/v1/messages --output pretty
```

要提前知道的边界：

1. 显式 `remote_api` 选择是 environment-gated 的；出现 warn 不代表系统已经静默切回 `cli_exec`。
2. `local-model` 是受能力约束的 fallback surface，不是需要 `tool_calling`、`structured_output`、`confirmation_gate` 路线的等价替代。

### 在第一次真实执行前先把 readiness 链路读回来

把命令产出的 diagnostics payload 当成事实来源。playbook 只负责解释这些字段，不会自己重算一套 readiness 真值。

直接复用 onboarding 时已经在跑的命令：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
```

按这个顺序读字段：

| 字段 | 读取位置 | 用法 |
|---|---|---|
| `verification_status` | 最新 `connect` 或 `doctor` diagnostics artifact 中的 `verificationMatrix.verification_status` | 把它当作刚刚这条公开 surface 的 readiness verdict。不要只因为命令退出成功，就自行推断成 `pass`。 |
| `diagnostic_summary` | `verificationMatrix.diagnostic_summary` | 把它当成 required-role failure、fallback/degraded role 计数，以及 `doctor --fix` 的 `safe_local_fix=<n>` 活动摘要。`safe_local_fix` 只表示本地 workspace/config 修补发生过，不代表 CLI、auth 或 model 已经替你补好。 |
| `next_action` / `next_actions` | `verificationMatrix.next_action` 与 `verificationMatrix.next_actions` | 把它们当作 canonical operator next steps。playbook 可以重组或解释，但不能凭空写出更绿的结论。 |
| `launch_diagnostics` | 受影响 tool/role 对应的 `verificationMatrix.tool_transport_matrix[]` 与 `verificationMatrix.role_binding_matrix[]` 行 | 只有在先看完 readiness verdict 后，再用这些 additive 细节解释 `selected_entrypoint`、`shell_wrapped`、`process_tree_policy`、`spawn_error_code` 等事实。 |

如果后面需要求助或申请 support-truth refresh，请把最新的 `connect` / `doctor` diagnostics artifact 路径，以及最新的 `verification_status`、`diagnostic_summary` 与 `next_action(s)` 一起保留下来；如果问题只会在执行路径上出现，再补上 `run --dry-run --trace` 的 artifact 路径。这就是最小的 evidence hand-off 包。

## 5. 共享配置和个人 secrets 要分开

仓库级真值留在 workspace config；只属于某台机器或某个操作者的设置，用 `config` 和 `secret` 管。

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

这条路径适合：

1. 你希望仓库只引用 `secret://openai/api-key` 这类稳定 selector。
2. 你不希望真实 API key 落进共享的 `governor.yaml`。
3. 不同操作者在不同机器上需要不同的个人默认值。

## 6. 跑通第一条 governed loop

仓库 bootstrap 完成、至少一条 adapter path ready 之后，用这组最小闭环：

```bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

重点看活动 workspace 根下这些产物：

1. `context/diagnostics/connect/`
2. `context/diagnostics/doctor/`
3. `context/diagnostics/run/`
4. `context/diagnostics/trace/`
5. `context/review-queue/requests`
6. `context/review-queue/results`

如果当前 workspace 暴露了 canonical sprint `tasks/` surface，review 链路还可能自动分配并推进一个 `CR-xxx` 生命周期。

## 7. 对话式场景用 Session Shell 更顺手

如果你想走 conversation-first 入口，而不是一次性命令，就直接进 session shell：

```bash
pnpm exec repo-ai-governor --output pretty
pnpm exec repo-ai-governor --output pretty "summarize this repository"
pnpm exec repo-ai-governor resume [session-id]
```

快速检查点：

1. 在本地 TTY + `pretty` 模式下，无子命令入口应进入交互 shell。
2. `resume` 应能恢复最近一次或指定的持久化会话。
3. `/help`、`/history`、`/search <term>`、`/multiline`、`!<shell-command>` 应可用。
4. `plain`、`json`、非 TTY、`--no-interactive` 应保持非交互语义。

## 8. Day 1 之后最常见的操作

### Workspace 迁移与回滚

当你想把治理 workspace 放进目标仓库，而不是 tool-managed 存储时，用：

```bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace rollback <plan-path> --output json
```

务必保留输出里的 `plan-path`，它就是 rollback 的 hand-off artifact。

### 受控升级

当 workspace schema 或 config baseline 需要治理式变更时，用：

```bash
pnpm exec repo-ai-governor upgrade --output json
pnpm exec repo-ai-governor upgrade apply <report-path> --confirm-upgrade approve --output json
pnpm exec repo-ai-governor upgrade rollback <apply-receipt-or-rollback-snapshot> --output json
```

先 preview，再 apply，并保留 preview report 和 apply receipt。

### 主题与 shell 偏好

```bash
pnpm exec repo-ai-governor workspace set-ui-theme --output pretty
pnpm exec repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty
```

## 9. VS Code 主工作台与更低层路径

对于已构建源码仓 checkout 和一份由维护者产出的本地 VSIX，VS Code 现在就是 primary human-facing workbench。更低层的 CLI surface 仍然存在，但在支持范围内走 VS Code 路径时，它们已经不再是必经前置步骤。

### VS Code 主工作台

```bash
cd <governor-repo>
pnpm run build
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

当前正式支持限定在 built source checkout 和本地 VSIX / packaged extension root。VS Code 现在已经是这两条路径上的公开主工作台，但它仍不会把 Marketplace 或已发布 npm/tgz 安装面变成正式支持的扩展分发方式。

扩展运行起来之后，支持范围内的人类路径可以直接留在 VS Code 内完成：

1. 通过 Workbench Overview 执行 workspace bootstrap、`doctor` 和 `check`。
2. 通过 `Connect Provider`、`Update API Key`、`Reconnect Provider` 完成 provider authoring。当前受支持的插件人类路径会只通过 secure prompt 采集原始 API key，把 managed secret backend 保持为 canonical secret owner，并且只持久化非敏感 provider 默认值与 `credentialRef`。
3. 通过 Workflow Studio 完成 workflow preview/create/edit 与 service-backed run-control。
4. 通过 Execution Board、HITL Inbox、Review Queue、Review Detail、Automation Queue 完成日常治理执行与评审交互。
5. 通过 workbench 内的 service-backed 动作执行 `adopt / host / verify / upgrade`，而不是再把 CLI 当成必需交接面。
6. CLI 只保留给 automation、CI、session-shell、debugging，或显式 headless `credentialEnvVar` 兼容这类 terminal-native 场景。

如果你拿到的是一份本地 VSIX，而不是直接启动 extension-development host，请在 VS Code 里使用 `Extensions: Install from VSIX...` 安装，把它当成维护者引导下的人工演练。目标用户体验仍然是同一套 zero-cli workbench flow 加上宿主原生 direct provider onboarding，而当前 closeout 证据已经支撑这些 built-source/local-VSIX 受支持路径上的 zero-env-var claim。当前 release-blocking 的证据基线仍先收敛在 packaged-root 与 extracted-VSIX 验证，因此 GUI 安装仍属于附加人工证据，而不是必需的自动化 gate。

### Desktop foundation

```bash
cd <governor-repo>
pnpm run build
pnpm run check:desktop-entry-smoke
pnpm run release:verify-local
```

只有当你想验证 built source checkout 上的 desktop sidecar foundation 时才使用。它不是独立桌面安装器，也不是已发布桌面 bundle。

### 宿主原生资产生成

```bash
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
```

把 `host export`、`host verify`、`host pack` 理解成首选安装 quickstart `adopt bootstrap` 之下、并与显式 `adopt apply` 安装 surface 并列存在的 lower-level follow-up surface，而不是默认安装方式。
如果你需要 packaged local host bootstrap，请只通过 `repo-ai-governor/service-host` 导入 sidecar。

### ACP 宿主向 readiness

如果你要把 Codex 显式切到 ACP，而不是继续使用 `remote_api` 或默认 CLI-backed 路径，最小步骤是：

```bash
pnpm exec repo-ai-governor config set tools.codex.transport acp_exec
pnpm exec repo-ai-governor config get tools.codex.transport
pnpm exec repo-ai-governor host export --host codex --mode project-local --output-dir .repo-ai-governor/generated/hosts/codex --apply-to-repo /absolute/path/to/<target-repo>
pnpm exec repo-ai-governor host pack --host codex --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts/codex-plugin --bundle-dir .repo-ai-governor/generated/bundles/codex-plugin
pnpm exec repo-ai-governor host verify --manifest .repo-ai-governor/generated/hosts/codex/host-export.manifest.json
pnpm exec repo-ai-governor doctor --adapters --output json
```

这条 surface 要保守读取：

1. ACP 的配置值就是 `acp_exec`；它不是 `remote_api`，也绝不是 `cli_exec` 的 alias 或静默 fallback。
2. 如果你已经保留了 `tools.codex.remoteApi.*` 这组 endpoint/model/credential truth，通常不需要先删掉；显式 `transport=acp_exec` 可以和这些配置并存。
3. 只有当 `doctor` 或 `verify` 投影出 `transport=acp_exec`，并且 `acp_host_companion` 同时具备 runtime-service ready、packaged-distribution ready 与 clean-room verified summary 时，才把 ACP 视作 evidence-backed supported surface。
4. 如果 ACP 的 invoke、stream 或 confirm 仍然报告 blocked/fail-closed，就保持阻断；不要把它重新解释成同 surface 的 `cli_exec` 成功。

## 10. 排障与常见边界

如果首轮上手还是很懵，通常是这些原因：

1. 你把 adopter 文档和 maintainer-only 验证文档混在一起读了。除非你在验证 governor 项目本身，否则留在这份 playbook。
2. 你想用 `dist-binary` 证明 packaged-install 真值。它做不到。
3. 你把 `host export` 当成默认 installer。它不是。
4. 你把 environment-gated adapter warning 读成治理链路失败。大多数时候它只是 auth、endpoint、CLI health 或 quota 前置条件没满足。
5. 你期待 `local-model` 覆盖和 primary remote adapter 一样的能力面。它做不到。

不确定时，按这个顺序排查：

1. 重跑 `doctor --output json`
2. 重跑 `doctor --adapters --fix --output json`
3. 重跑 `doctor --adapters --output json`
4. 在 trace 产物看起来健康之前，优先使用 `run --dry-run --trace`
5. 在升级求助前，先读回 `verification_status`、`diagnostic_summary` 与 `next_action(s)`；`launch_diagnostics` 只作为被选路由的补充细节
6. 先查 `docs/support-matrix.zh-CN.md`，再判断某个 surface 是否正式 supported

## 11. 接下来读什么

1. 需要短版产品概览时，读 `README.zh-CN.md`
2. 需要正式支持真值时，读 `docs/support-matrix.zh-CN.md`
3. 只有在维护或发布本仓库时，才读 `docs/maintainer-validation-playbook.zh-CN.md`
4. 想看可运行场景而不是通用 runbook 时，读 `examples/`
