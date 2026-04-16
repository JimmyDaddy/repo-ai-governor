# Repo AI Governor

`repo-ai-governor` 是一个面向仓库本地使用的 AI 治理 CLI。它可以让一个仓库把 Codex、Claude Code、GitHub Copilot 等工具接入同一套 `plan -> run -> review -> verify` 工作流，并保留可追溯产物和明确的人类闸口。

你可以把它理解成“把一条受治理的 AI 交付闭环装进仓库里”，而不是“再套一层聊天壳”。

- 英文指南：`README.md`
- adopter 操作手册：`docs/local-adoption-playbook.zh-CN.md`
- maintainer 验证手册：`docs/maintainer-validation-playbook.zh-CN.md`
- 正式支持边界：`docs/support-matrix.zh-CN.md`
- 可运行示例：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 先记住默认路径

大多数团队可以直接按这个顺序开始：

1. `init`
2. `doctor`
3. `adopt bootstrap`
4. `check`
5. `connect`
6. `run --dry-run --trace`

如果你只想从这份 README 里记住一件事，就记住这条路径。

## 什么场景适合用它

当你需要下面这些能力时，`repo-ai-governor` 会比较合适：

- 同一个仓库里接入不止一种 AI 工具。
- 希望有可重复的流程，而不是一次次临时跑 agent。
- 希望高风险改动必须经过明确的 review 或人工批准。
- 希望计划、执行、复核和审计都有可追溯产物。

## 最短心智模型

你不用一次学完所有命令，先把它理解成下面几组工作即可：

| 如果你想... | 从这里开始 |
|---|---|
| 初始化仓库并检查环境状态 | `init`、`doctor`、`check` |
| 安装或刷新受管仓库设置 | `adopt list`、`adopt bootstrap`、`adopt verify`、`adopt diff`、`adopt upgrade`、`adopt remove` |
| 把工具接入仓库工作流 | `connect`、`doctor --adapters` |
| 让任务走完整条治理闭环 | `plan`、`run`、`review`、`review-verify` |
| 把个人默认值和密钥留在本机 | `config`、`secret` |
| 使用对话式入口 | 无子命令执行 `repo-ai-governor`、`resume` |
| 迁移 workspace 或执行受控升级 | `workspace`、`upgrade` |
| 生成更低层的宿主资产 | `host export`、`host verify`、`host pack`、`repo-ai-governor/service-host` |

## 先选最轻的安装路径

如果你第一次接触这个项目，先选“刚好能证明你关心行为”的最小路径。

| 模式 | 适用场景 | 主命令 |
|---|---|---|
| `dist-binary` | 想做无安装演练，或目标仓库是脏工作树 / 非 `pnpm` | `node <governor-repo>/dist/bin/repo-ai-governor.js <command>` |
| `path` | 想在 `pnpm` 仓库里走正常安装路径 | `pnpm add --save-exact <governor-repo>` |
| `link` | 目标仓库需要有意跟随你的本地源码 checkout | `pnpm add --save-exact link:<governor-repo>` |
| `tgz` | 想在联网环境里演练打包后的 CLI tarball | `pnpm pack --json` 然后 `pnpm add --save-exact <tarball>` |

简单记法：

1. 要最低风险演练，用 `dist-binary`。
2. 要在真实 `pnpm` 仓库里正常接入，用 `path`。
3. 只有明确要跟着本地源码变化走，才用 `link`。
4. 只有明确需要 packaged-install 演练，才用 `tgz`。

## 最快的安全演练

假设本仓库根目录是 `<governor-repo>`，目标仓库是 `<target-repo>`。

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

这条路径适合你先证明 CLI 和 runtime 行为，而不急着给目标仓库加依赖。

## 面向真实 `pnpm` 仓库的推荐安装路径

如果目标仓库本来就是 `pnpm` 仓库，默认从这里开始：

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor adopt bootstrap --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor check --output json
```

每一步分别在做什么：

1. `init` 建立基础 workspace/config 路径。
2. `doctor` 告诉你当前机器和仓库还缺什么。
3. `adopt bootstrap` 用一条命令装好受管仓库设置。
4. `check` 负责安装后的更广治理审计。

如果你是有意要走 repo-local 的 self-host 模板路径（`self-host-complete + repo_local`），请直接看 playbook，不要自己拼命令链：`docs/local-adoption-playbook.zh-CN.md`。

## 第一条受治理工作流

仓库 bootstrap 之后，最短的一条端到端治理路径是：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor doctor --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

这条顺序为什么合理：

1. `connect` 会先准备一份可审阅的仓库配置，而不是盲改活动配置。
2. `doctor --adapters --fix` 只允许 safe local repairs。
3. 第二次 `doctor --adapters` 是只读 readiness 复检。
4. `run --dry-run --trace` 是真实执行前最低风险的证明方式。
5. `review` 和 `review-verify` 会把正式的评审闭环补齐。

## 把个人默认值和密钥留在本机

共享仓库配置和个人机器配置是有意分开的。

仓库共用的接入配置用 `connect`。只属于某个操作者本机的配置，用 `config` 和 `secret`：

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

这样共享配置里只会保留 `secret://openai/api-key` 这类稳定 selector，不会把明文 secret 写进去。

## 下一步看哪份文档

建议按这个顺序读：

| 文档 | 适合解决什么问题 |
|---|---|
| `README.zh-CN.md` | 产品概览和最短成功路径 |
| `docs/local-adoption-playbook.zh-CN.md` | 真实 adopter 的安装、演练、回滚和排障 |
| `docs/support-matrix.zh-CN.md` | 安装模式、adapter 与 secondary surface 的正式支持边界 |
| `docs/maintainer-validation-playbook.zh-CN.md` | 本仓库 maintainer 的发布与验证流程 |
| `examples/` | 用具体可运行场景代替泛化说明 |

## 最值得提前知道的边界

下面这些限制最容易让新读者误解：

1. `dist-binary` 证明的是 CLI/runtime 行为，不代表 packaged install 已成立。
2. `tgz` 仍然是联网的 packaged-install 演练，不是离线或自包含安装器。
3. `adopt bootstrap` 才是默认的整仓安装路径；`host export` 和 `host pack` 是更低层的 follow-up 工具。
4. VS Code 目前支持的是 built-source companion 和本地 VSIX 路径，不是 Marketplace 支持。
5. Desktop 目前是 built-source foundation-only 路径，不是独立桌面安装器，也不是单独桌面产品。
6. `local-model` 是受能力约束的 fallback 路径，不是主远端 adapter 的完整替代。
7. 正式支持真值始终以 `docs/support-matrix.zh-CN.md` 为准。

## 示例

仓库当前提供这些可运行场景：

1. Single-role minimal flow
2. Multi-role collaboration flow
3. HITL escalation flow
4. Restricted-network degrade flow
5. Optional plugin-memory flow

如果你更想从具体场景入手，而不是先看通用 quick start，先看 `examples/README.md`。
