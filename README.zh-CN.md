# Repo AI Governor

`repo-ai-governor` 是一个面向仓库本地使用的 AI 治理 CLI。它把 Codex、Claude Code、GitHub Copilot 等工具接到同一套流程里，用统一的计划、执行、评审、复核和审计方式来管理 AI 开发工作。

这个项目不是“再来一个 AI 助手壳层”，而是给真正需要可重复流程、清晰 review 闭环、显式人工闸口和可追溯 workspace 产物的团队准备的。

- 英文指南：`README.md`
- adopter 操作手册：`docs/local-adoption-playbook.zh-CN.md`
- maintainer 验证手册：`docs/maintainer-validation-playbook.zh-CN.md`
- 正式支持边界：`docs/support-matrix.zh-CN.md`
- 可运行示例：`examples/`
- 变更日志：`CHANGELOG.zh-CN.md`

## 这个项目现在能帮你做什么

当前公开 CLI surface 可以覆盖这些目标：

| 目标 | 主要命令 |
|---|---|
| 初始化仓库并检查环境状态 | `init`、`doctor`、`check` |
| 安装并维护受管 adoption baseline | `adopt list`、`adopt apply`、`adopt diff`、`adopt verify`、`adopt upgrade`、`adopt remove` |
| 把多种 AI 工具接到同一套治理基线 | `connect`、`verify` |
| 把个人机器偏好与密钥从共享配置中隔离出来 | `config`、`secret` |
| 跑一条受治理的交付闭环 | `plan`、`run`、`review`、`review-verify` |
| 使用对话式 shell，而不是一次性子命令 | 无子命令执行 `repo-ai-governor`、`resume` |
| 预览 workflow、处理 workspace 或 schema 变更 | `workflow`、`workspace`、`set-ui-theme`、`upgrade` |
| 生成更低层的宿主资产与 service-host 集成 | `host export`、`host verify`、`host pack`、`@cjhdev/repo-ai-governor/service-host` |

如果你只想记一条最重要的路径：大多数 adopter 应先跑 `init`、`doctor`、`adopt apply`，然后再进入 `connect` 和带 trace 的 `run --dry-run`。

## 从这里开始

先按目标选择路径：

| 如果你想... | 建议从这里开始 |
|---|---|
| 不改目标仓库依赖图，先验证 CLI/runtime 行为 | `dist-binary` 演练 |
| 在正常的 `pnpm` 仓库里安装 governor | `path` 安装 |
| 让目标仓库持续跟随本地源码仓变化 | `link` 安装 |
| 演练打包后的 CLI tarball | `tgz` 安装 |

假设本仓库根目录是 `<governor-repo>`，目标仓库是 `<target-repo>`。

### 方式 A：用 `dist-binary` 做最快的安全演练

适合目标仓库是脏工作树、使用 Yarn/npm，或你只是想先证明 CLI/runtime 能跑通。

```bash
cd <governor-repo>
pnpm run build

cd <target-repo>
node <governor-repo>/dist/bin/repo-ai-governor.js --help
node <governor-repo>/dist/bin/repo-ai-governor.js init --output pretty
node <governor-repo>/dist/bin/repo-ai-governor.js doctor --output json
node <governor-repo>/dist/bin/repo-ai-governor.js check --output json
```

### 方式 B：普通 `pnpm` 仓库的推荐安装路径

适合想走最顺滑本地接入故事的场景。

```bash
cd <target-repo>
pnpm add --save-exact <governor-repo>
pnpm exec repo-ai-governor --help
pnpm exec repo-ai-governor init --output pretty
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

### 方式 C：给真实 adopter 仓库应用受管 baseline

当 bootstrap 通过后，优先使用受管安装，而不是手工复制宿主资产。

```bash
pnpm exec repo-ai-governor adopt list --output json
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot --output json
pnpm exec repo-ai-governor adopt verify --repo . --output json
```

跑完之后你应该看到：

1. `init` 能完成一轮引导式初始化。
2. `doctor` 和 `check` 会输出可读或机器可读事实，而不是直接失败。
3. `adopt apply` 会把受管安装元数据写到 `.repo-ai-governor/adoption/installations/**`。
4. `adopt verify` 会成为后续证明这套 baseline 仍然健康的正式入口。

## 第一条成功工作流

仓库 bootstrap 之后，最短的一条端到端受治理路径是：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
```

这条顺序的意义是：

1. `connect` 先生成可审阅的 candidate config，而不是盲改活动配置。
2. `doctor --adapters --fix` 只处理 safe-local 修复。
3. `verify --adapters` 是真实执行前的 readiness gate。
4. `run --dry-run --trace` 能以最低风险拿到路由与产物证据。
5. `review` 和 `review-verify` 用正式 review 生命周期把闭环补齐。

## 个人默认值与密钥

当前产品里一个很容易被文档埋掉、但实际非常重要的能力是：共享仓库配置和个人机器配置是分开的。

共享的仓库接入用 `connect`，而 model、endpoint、credential selector 这类只应留在个人机器上的配置，用 `config` 和 `secret`：

```bash
pnpm exec repo-ai-governor config set tools.codex.transport remote_api
pnpm exec repo-ai-governor config set tools.codex.remoteApi.model gpt-5
pnpm exec repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
printf '%s' "$OPENAI_API_KEY" | pnpm exec repo-ai-governor secret set openai/api-key --stdin
pnpm exec repo-ai-governor secret status
pnpm exec repo-ai-governor connect --tools codex --output pretty
```

这样共享 workspace 配置里只会保留像 `secret://openai/api-key` 这样的 selector，不会把明文 secret 写进去。

## 常见使用路径

可以把产品理解成下面几条主路径：

| 要完成的事 | 推荐命令 |
|---|---|
| 安装或刷新一套受治理仓库 baseline | `adopt apply`、`adopt verify`、`adopt diff`、`adopt upgrade`、`adopt remove` |
| 给一个仓库接多种 AI 工具 | `connect`、`doctor --adapters`、`verify --adapters` |
| 跑通第一条 plan -> run -> review 闭环 | `plan`、`run --dry-run --trace`、`review`、`review-verify` |
| 使用对话式 shell | `repo-ai-governor --output pretty`、`resume` |
| 把 workspace 迁入或迁出目标仓库 | `workspace dry-run`、`workspace execute`、`workspace rollback` |
| 预览或应用受控升级 | `upgrade`、`upgrade apply`、`upgrade rollback` |
| 从源码仓生成宿主原生 follow-up 资产 | `host export`、`host verify`、`host pack` |

当前 session shell 的主题 selector 已提供 `governor`、`catppuccin`、`calm`、`tokyo-night`、`kanagawa` 和 `flexoki`。如果你想交互式选择主题，可直接执行 `repo-ai-governor set-ui-theme --output pretty` 或 `repo-ai-governor workspace set-ui-theme --output pretty`。

## 下一步该读哪份文档

建议这样使用文档体系：

| 文档 | 适合解决什么问题 |
|---|---|
| `README.zh-CN.md` | 产品概览、快速开始、最短成功路径 |
| `docs/local-adoption-playbook.zh-CN.md` | adopter 的日常 runbook，包括安装、接入、dry-run、rollback、排障 |
| `docs/support-matrix.zh-CN.md` | install mode、adapter、secondary surface 的正式支持真值 |
| `docs/maintainer-validation-playbook.zh-CN.md` | 仓库维护者自己的验证、发布与证据回链 runbook |
| `examples/` | 团队演练和命令契约示例 |

## 最值得提前知道的边界

这些约束最容易让新读者踩坑：

1. `dist-binary` 证明的是 CLI/runtime 行为，不是 packaged install 行为。
2. `tgz` 是联网的 packaged install 演练，不是离线自包含安装器。
3. 内置 `adopt apply` 才是默认整仓安装路径；更低层的 `host export` 和 `host pack` 只是 follow-up surface，不是默认 installer story。
4. VS Code 目前支持的是 built-source companion 和本地 VSIX 打包路径，不是 Marketplace 发布路径。
5. Desktop 目前仍是 built-source foundation-only，不是独立桌面产品。
6. `local-model` 是受能力约束的 fallback surface，不是 primary remote adapter 的等价替代。

所有正式支持边界，都以 `docs/support-matrix.zh-CN.md` 为准。

## 示例

仓库当前提供这些可运行场景：

1. Single-role minimal flow
2. Multi-role collaboration flow
3. HITL escalation flow
4. Restricted-network degrade flow
5. Optional plugin-memory flow

如果你更想从具体场景而不是泛化 quick start 入手，先看 `examples/README.md`。
