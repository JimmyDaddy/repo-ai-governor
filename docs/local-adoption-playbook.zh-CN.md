# 本地接入操作手册

这份 playbook 面向在目标仓库中接入 `repo-ai-governor` 的使用者。

当你想回答这些问题时，用它最合适：

1. 我应该怎样把它装进一个真实仓库，或者先做一轮演练？
2. 最安全、最短的首轮成功路径是什么？
3. 多工具接入、个人默认值和 secrets 应该怎么配？
4. 怎样在不冒不必要风险的前提下跑通第一条 governed loop？

如果你维护或发布的是 `repo-ai-governor` 本身，请改看 `docs/maintainer-validation-playbook.zh-CN.md`。

`docs/support-matrix.zh-CN.md` 仍然是正式支持真值；这份文档是面向操作者的 runbook。

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

## 3. 优先使用 `adopt` 的受管安装路径

当 bootstrap 成功后，优先走 managed installer，而不是直接切到更低层的 host export。

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

为什么这是默认路径：

1. `adopt apply` 会把受管宿主资产、安装元数据和 adoption guides 落到 `.repo-ai-governor/adoption/installations/**`。
2. 内置 adoption pack 不要求目标仓库预先存在 source-local `.codex/skills/**`。
3. 安装之后，`adopt verify`、`adopt diff`、`adopt upgrade`、`adopt remove` 就成为正式支持的生命周期路径。

只有当目标仓库本身要承载一套 repo-local governance workspace 模板时，才使用 self-host profile：

```bash
pnpm exec repo-ai-governor adopt apply adopter-complete --adoption-profile self-host-complete --repo . --workspace-mode repo_local --hosts codex --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

这条路径只会 seed 空白或模板化的治理 surface，不会复制本仓库的 live execution state。

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
2. `context/diagnostics/verify/`
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

## 9. 可选的 secondary surface 和更低层路径

这些 surface 是真实存在的，但它们不是默认 adopter story。

### VS Code companion

```bash
cd <governor-repo>
pnpm run build
code --extensionDevelopmentPath <governor-repo>/apps/vscode-extension <target-repo>
```

只有当你想在正常 CLI 路径之上，再验证 editor-native companion 时才使用。当前正式支持限定在 built source checkout 和本地 VSIX / packaged extension root 演练。

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

把 `host export`、`host verify`、`host pack` 理解成主安装路径 `adopt apply` 之下的 lower-level follow-up surface，而不是默认安装方式。

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
5. 先查 `docs/support-matrix.zh-CN.md`，再判断某个 surface 是否正式 supported

## 11. 接下来读什么

1. 需要短版产品概览时，读 `README.zh-CN.md`
2. 需要正式支持真值时，读 `docs/support-matrix.zh-CN.md`
3. 只有在维护或发布本仓库时，才读 `docs/maintainer-validation-playbook.zh-CN.md`
4. 想看可运行场景而不是通用 runbook 时，读 `examples/`
