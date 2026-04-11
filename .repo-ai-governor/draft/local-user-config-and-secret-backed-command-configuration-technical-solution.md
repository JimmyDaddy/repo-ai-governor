# Local User Config And Secret-Backed Command Configuration Technical Solution (Draft)

- Status: draft
- Date: 2026-04-11
- Owner: AI-Agent
- Scope: `local user configuration / secret-backed api-key management / command-based config mutation / remote_api defaults / workspace mode defaults`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/runtime/global-cli-theme-preference-service.ts`
  - `packages/config/src/workspace-resolver.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

## 1. 目的

当前仓库已经支持：

1. repo-local / tool-managed 两种 workspace 根路径解析；
2. `connect --remote-api-model/--remote-api-credential-env-var/--remote-api-endpoint` 的首次 `remote_api` 命令式 authoring；
3. 轻量的全局 CLI 主题偏好文件 `~/.repo-ai-governor/cli-preferences.yaml`；
4. `remoteApi.credentialRef` schema 字段，但 adapter runtime 目前仍将其当作 manual-only / read-only truth，而不会自动去本机 secret store 取真实值。

用户新的需求是：

1. 希望有一个“隐藏的本地配置文件”来保存私有默认值，例如 workspace mode、默认 model、默认 endpoint；
2. 希望能通过命令修改这些本地默认值，而不是手写 YAML；
3. 希望也能通过命令设置 API key；
4. 但又不希望把密钥直接塞进共享的 `governor.yaml` 或命令历史里。

本 draft 的目标，是为此给出一套与现有仓库 seams 相兼容的方案比较、推荐架构和 phased rollout。

## 2. 当前仓库真实接缝

### 2.1 配置分层现状

当前 CLI 启动时会优先尝试：

1. `<repo>/.repo-ai-governor/governor.yaml`
2. tool-managed workspace 下的 `<workspaceRoot>/governor.yaml`

相关实现位于：

1. `apps/cli/src/main.ts -> resolveRuntimeContext(...)`
2. `packages/config/src/workspace-resolver.ts`

这说明仓库当前只有“共享或至少 workspace-scoped 的治理配置”，还没有“用户级私有默认配置”这一层。

### 2.2 已存在的轻量全局配置 precedent

`apps/cli/src/runtime/global-cli-theme-preference-service.ts` 已经引入了一个非常轻量的用户级隐藏文件：

- `~/.repo-ai-governor/cli-preferences.yaml`

它只承载：

1. React shell 主题偏好

这条先例很重要，因为它证明：

1. 仓库已经接受“本机私有、非 governor.yaml、非第二套完整治理配置”的轻量文件层；
2. 但这个文件当前只面向 UI theme，不适合作为通用配置层直接无限膨胀。

### 2.3 远端凭据现状

当前 `codex` / `claude-code` 的 `remote_api` 路径：

1. 可以通过 `credentialEnvVar` 从环境变量取值；
2. schema 接受 `credentialRef`；
3. runtime 当前会把 `credentialRef` 视为 selector truth，但不会自动物化真实 secret。

因此，如果想支持“通过命令设置 apikey”，当前真正缺的是：

1. 本机 secret backend；
2. `credentialRef -> secret backend` 的 runtime resolution seam；
3. 安全的命令输入方式；
4. 用户级本地默认值层与 workspace/shared 真值层之间的优先级规则。

## 3. 外部参考（官方资料）

本方案参考了几类成熟工具的官方做法：

### 3.1 AWS CLI：配置与凭据分离

AWS CLI 提供：

1. `config` 与 `credentials` 两类文件；
2. `aws configure set` 这样的命令式修改入口；
3. profile-aware 的本机配置管理模型。

官方资料：

1. [Configuration and credential file settings](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
2. [aws configure](https://docs.aws.amazon.com/cli/latest/reference/configure/)
3. [aws configure set](https://docs.aws.amazon.com/cli/v1/reference/configure/set.html)

可借鉴点：

1. “共享配置”和“私有凭据”不要混在一份文件里；
2. 命令式配置是正式一等入口，不要求用户总是手改文件。

### 3.2 npm：多层配置与 set/get/delete

npm 的官方做法是：

1. 支持 layered config；
2. 支持 `npm config set/get/delete`；
3. 用户级 `.npmrc` 是常见的私有默认值层。

官方资料：

1. [npm config](https://docs.npmjs.com/cli/v11/commands/npm-config)
2. [npm config settings](https://docs.npmjs.com/cli/v11/using-npm/config)
3. [The npmrc files](https://docs.npmjs.com/cli/v11/configuring-npm/npmrc)

可借鉴点：

1. “本机默认值层”非常适合做命令式读写；
2. 优先级必须稳定清晰，否则会让用户感觉“到底哪个配置生效”不可预测。

### 3.3 Docker：配置文件 + credential store/helper

Docker 官方模型是：

1. 普通配置在 `config.json`；
2. 凭据通过 `credsStore` / `credHelpers` 接到系统级或外部 credential helper；
3. `docker login --password-stdin` 避免把密码落进 shell history。

官方资料：

1. [docker login](https://docs.docker.com/reference/cli/docker/login/)

可借鉴点：

1. 明文 secret 不应默认落盘；
2. 命令行 secret 输入应优先用 `stdin` 或无回显交互，而不是位置参数；
3. helper/backend 抽象比把 secret 存储逻辑硬编码进主配置文件更可持续。

### 3.4 GitHub CLI：偏好和认证分层

GitHub CLI 的官方路径是：

1. `gh auth login` 负责认证；
2. 凭据优先放入系统安全存储；
3. 用户只通过命令管理 auth 状态，而不是自己编辑 token 文件。

官方资料：

1. [gh auth login](https://cli.github.com/manual/gh_auth_login)

可借鉴点：

1. 认证/secret 命令族适合独立于普通 config 命令；
2. 用户心智上，“设置 token”与“设置 mode/theme/default model”是两类对象，最好不要混在一个文件和一组命令里。

### 3.5 Git：credential helper 协议

Git 官方支持：

1. 用 credential helper 抽象不同平台和不同后端；
2. 主程序不直接绑定某一种 secret 存储实现。

官方资料：

1. [gitcredentials](https://git-scm.com/docs/gitcredentials)

可借鉴点：

1. 如果后续要做跨平台 secret backend，helper/provider seam 比直接写死某一个库更稳。

## 4. 方案对比

### 4.1 方案 A：单个隐藏文件同时保存 mode 与 apikey

示例：

```yaml
workspace:
  mode: tool_managed
secrets:
  openaiApiKey: sk-...
```

优点：

1. 最容易实现；
2. 文件排障简单；
3. 命令实现也直接。

缺点：

1. API key 明文落盘；
2. 容易被误备份、误复制、误同步到云盘；
3. 很容易被用户误认为“这和 governor.yaml 一样可以分享”；
4. 与仓库当前已经存在的 `credentialRef` 方向相冲突。

结论：

1. 不推荐作为默认方案。

### 4.2 方案 B：用户配置文件 + 本地 secrets 文件

示例：

1. `~/.repo-ai-governor/user-config.yaml`
2. `~/.repo-ai-governor/secrets.json`

优点：

1. 实现成本相对低；
2. 能把“普通默认值”和“secret”分开；
3. 可以先不依赖平台 keychain。

缺点：

1. 如果 `secrets.json` 只是“本地文件但未加密”，本质仍是明文落盘；
2. 如果自己做“轻量加密文件”，往往只是伪安全；
3. 跨平台权限、备份和恢复策略仍难界定。

结论：

1. 可作为 fallback 或开发模式；
2. 不适合作为默认主方案。

### 4.3 方案 C：用户配置文件 + OS keychain / credential helper

示例：

1. `~/.repo-ai-governor/user-config.yaml`
2. API key 存入系统 keychain / credential manager / libsecret / helper backend

优点：

1. 安全性与用户体验最平衡；
2. 可以自然映射到 `credentialRef: secret://...`；
3. 与 Docker / GitHub CLI / Git helper 的成熟路径一致；
4. 能保留 repo-level `governor.yaml` 的可共享真值边界。

缺点：

1. 跨平台实现复杂度更高；
2. 需要定义 secret backend abstraction；
3. 测试夹具和 clean-room 文档要多一层 backend 说明。

结论：

1. 推荐作为默认方案。

### 4.4 方案 D：继续只用环境变量，不新增隐藏配置

优点：

1. 最简单；
2. CI 友好；
3. 复用当前 adapter 行为。

缺点：

1. 无法满足“通过命令配置 apikey / 默认 mode”的明确用户需求；
2. 用户需要手动管理 shell/profile/direnv，体验不统一；
3. 不利于形成正式的本机私有配置层。

结论：

1. 仍应保留为 CI/自动化路径；
2. 但不能单独满足当前需求。

## 5. 推荐方案

推荐采用：

`方案 C：用户配置文件 + OS keychain/helper 为默认；方案 B 只作为显式 opt-in fallback。`

推荐理由：

1. 它最符合仓库当前“共享治理真值”和“私有本机偏好/凭据”分层方向；
2. 它能自然承接现有 `credentialRef` schema，而不是再造一套 secret 语义；
3. 它能给用户清晰命令体验，同时避免把 API key 落进 repo-level `governor.yaml`、命令历史或 review artifact；
4. 它和 AWS CLI、npm、Docker、GitHub CLI、Git helper 的主流设计最接近，后续用户理解成本低。

## 6. 推荐架构

### 6.1 三层配置面

#### Layer 1：共享治理真值

仍然是：

1. repo-local 或 tool-managed workspace 下的 `governor.yaml`

职责：

1. 记录仓库共享的治理意图；
2. 记录显式的 adapter / routing / workspace 策略；
3. 如有需要，只记录 `credentialRef`，不记录真实 secret。

#### Layer 2：用户级隐藏配置文件

新增 canonical 路径：

1. `~/.repo-ai-governor/user-config.yaml`

职责：

1. 保存本机私有默认值，例如显式 `workspace.mode_preference`、tool-level default transport/provider/model、默认 `credentialRef`、theme 偏好；
2. 不承载完整 governor schema；
3. 不记录明文 secret；
4. 只能补齐默认值，不能覆盖 repo / workspace 已显式声明的治理真值。

兼容策略：

1. 当前已经存在 `~/.repo-ai-governor/cli-preferences.yaml`；
2. 推荐新实现采用 `user-config.yaml` 作为 canonical path；
3. 读取时兼容旧 `cli-preferences.yaml`；
4. 写入时优先迁移到 `user-config.yaml`，并把 `ui.react.theme` 合并进去。

其中 `workspace.mode_preference` 需要特殊约束：

1. 它表示“当前用户希望默认用哪种 workspace mode”，不是覆盖 repo 显式模式的第二事实源；
2. 若 repo / active workspace 已显式声明 `workspace.mode`，则 `user-config.yaml` 里的 mode preference 不得反向覆盖；
3. `repo_local` 仍应被视为高级 opt-in profile，文案上应与现有 self-host / bootstrap 边界保持一致，而不是被呈现为 silent default。

#### Layer 3：secret backend

默认 backend：

1. macOS: Keychain
2. Windows: Credential Manager
3. Linux: libsecret / Secret Service

fallback backend：

1. 仅在系统 backend 不可用且用户显式 opt-in 时，允许 `file_plaintext` 或等价 fallback

注意：

1. fallback backend 必须在 UX 上明确标注为“unsafe / local-only / not recommended”。

### 6.2 secret identifier 约定

推荐使用稳定的 namespaced key：

1. `openai/api-key`
2. `anthropic/api-key`
3. `github-models/token`

在配置中使用：

```yaml
credentialRef: secret://openai/api-key
```

这样可以把“secret selector”与“secret value”彻底分开。

### 6.3 运行时优先级

推荐优先级：

1. CLI 显式参数
2. 活动 workspace `governor.yaml`
3. `user-config.yaml` 本机默认值
4. built-in defaults

为什么 `governor.yaml` 要高于 `user-config.yaml`：

1. 因为前者代表共享治理真值；
2. 本机私有层只能补默认，不应悄悄覆盖仓库显式约束。

secret resolution 则遵循当前 transport truth：

1. `credentialEnvVar` 继续从环境变量取值；
2. `credentialRef` 走 secret backend；
3. provider-local login state 仍是另一类只读发现路径，不应与 secret backend 混淆。

### 6.4 正式落点与 lifecycle 关系

这份方案不应被 promotion 成一个“孤立的新 secret 子系统”，而应显式挂到现有 formal module boundary 上。

推荐的 formal landing 为：

1. `runtime.agent-projection`
   - 拥有 `credentialRef -> secret backend` 的 runtime resolution seam；
   - 拥有 `user-config` 默认值归一到 canonical onboarding / projection truth 的责任；
   - 拥有 `connect / doctor / verify` 在 read-only discovery 边界内如何消费这些默认值的 contract。
2. `runtime.governance-clients`
   - 拥有 top-level `config` / `secret` command family 的 CLI surface；
   - 拥有 session shell `/config`、`/secret` discoverability 与 presenter copy；
   - 拥有“用户如何 authoring 这些默认值”的 host-facing command/documentation boundary。

因此推荐的 `target_module_ids` 是：

1. `runtime.agent-projection`
2. `runtime.governance-clients`

与现有 active solution 的关系应明确为：

1. 不 supersede `technical-solution.api-key-remote-adapter-invocation`；
2. 它是后者的 companion follow-up：
   - `technical-solution.api-key-remote-adapter-invocation` 已 formalize `remote_api / credentialRef / provider binding` 的 runtime seam；
   - 本方案补的是“本机私有默认值如何 authoring、secret 如何安全写入、以及这些 authoring facts 如何投影回同一套 runtime truth”；
3. promotion 时不得重复发明第二套 `remote_api` or `credential` contract，而应复用现有 `runtime.agent-projection` contract，并只在需要时为 `runtime.governance-clients` 增补 command-surface contract。

推荐的 promotion landing shape：

1. producer truth：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
2. consumer truth：
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-surface-client-contract.md`

### 6.5 方案 C 下用户如何实际设置 apikey

在方案 C 下，用户不会把 apikey 写进 `user-config.yaml`，也不会写进 `governor.yaml`。

用户实际操作应是两步：

1. 先用 `secret` 命令把真实 secret 写入 OS keychain / credential helper；
2. 再用 `config` 或共享 `governor.yaml` 只保存 `credentialRef: secret://...` 这样的 selector。

推荐的一次性设置流程：

```bash
printf '%s' "$OPENAI_API_KEY" | repo-ai-governor secret set openai/api-key --stdin
repo-ai-governor config set tools.codex.transport remote_api
repo-ai-governor config set tools.codex.remoteApi.provider openai
repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
repo-ai-governor config set tools.codex.remoteApi.model gpt-5
repo-ai-governor config set tools.codex.remoteApi.endpoint https://api.openai.com/v1
```

如果用户已经先把 key 放在环境变量里，也可以走导入路径：

```bash
repo-ai-governor secret import openai/api-key --from-env OPENAI_API_KEY
repo-ai-governor config set tools.codex.transport remote_api
repo-ai-governor config set tools.codex.remoteApi.provider openai
repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
```

后续消费方式是：

1. `secret set/import` 只把真实值写入本机 secret backend；
2. `config set ...credentialRef` 只把 selector 写入 `~/.repo-ai-governor/user-config.yaml`；
3. 如果仓库希望共享“应该使用哪个 secret 名称”的约定，可以在 `governor.yaml` 中保存同样的 `credentialRef`，但仍不保存真实 key；
4. `connect` 或 adapter runtime 在命中 `credentialRef` 时，再通过 secret backend 解析出真实 secret。

也就是说，三类真值分别落在不同层：

1. secret value -> OS keychain / credential helper
2. default selector 与默认 model/endpoint -> `~/.repo-ai-governor/user-config.yaml`
3. workspace/shared governance truth -> `governor.yaml`（仅在需要共享约束时保存 `credentialRef`，不保存明文 secret）

这样用户的心智会比较清晰：

1. “设置 apikey” 是 `secret` 命令；
2. “指定默认用哪个 key / model / endpoint” 是 `config` 命令；
3. “仓库团队要不要共享 selector 约定” 才是 `governor.yaml` 的职责。

### 6.6 `user-config` 到 canonical onboarding / projection truth 的映射

`user-config.yaml` 可以有自己的 authoring-friendly path，但它不能成为平行于 onboarding / projection contract 的第二事实源。

推荐的写法是：

```yaml
workspace:
  mode_preference: tool_managed

tools:
  codex:
    transport: remote_api
    remoteApi:
      provider: openai
      model: gpt-5
      credentialRef: secret://openai/api-key
      endpoint: https://api.openai.com/v1
```

这里有两个关键约束：

1. `user-config.yaml` 中的 `tools.<surface>.remoteApi.*` 只是用户 authoring 面；
2. 一旦 `connect / doctor / verify` 或 projection runtime 读取它，这些值必须先被归一化为 `runtime.agent-projection` 已有的 canonical truth。

具体映射应为：

1. `tools.codex.transport=remote_api`
   - `enabled_tools[].transport_kind=remote_api`
   - `enabled_tools[].transport_selection_source=user_config`
   - `enabled_tools[].transport_selection_locked=true`
2. `tools.codex.remoteApi.provider=openai`
   - `enabled_tools[].provider_kind=openai`
3. `tools.codex.remoteApi.vendorBinding`
   - 若用户未显式写入，authoring 层允许省略；
   - 进入 onboarding runtime 后，必须 materialize 为 `enabled_tools[].vendor_binding_kind=openai_responses`
   - 无法唯一解析时必须 fail-closed，而不是猜默认值
4. `tools.codex.remoteApi.model / credentialRef / endpoint`
   - 进入 `enabled_tools[].configured_remote_api`
   - 同时稳定投影出 `model`、`credential_mode=credential_ref`、`endpoint_source=user_config`
5. projection / replay truth
   - `AgentDescriptor.selected_transport=remote_api`
   - `AgentDescriptor.selected_provider_kind=openai`
   - `AgentDescriptor.selected_vendor_binding_kind=openai_responses`
   - `AgentDescriptor.selected_model=gpt-5`

因此，`connect` 在消费 user-config 时，不应输出“因为用户配过默认值，所以 runtime 自动切成 remote_api”的模糊结果，而应输出与现有 contract 一致的 machine truth：

1. canonical onboarding machine surface 仍固定为 `enabled_tools[]`
2. `configured_remote_api` 是正式 nested truth
3. 若兼容期仍保留 `tool_transport_matrix.remote_api_candidate`，它也只能机械派生自 `enabled_tools[]`

同时必须继续遵守 analyze-first / read-only 边界：

1. `connect / doctor / verify` 可以读取 `user-config.yaml`、repo config、env 与 `credentialRef`
2. 但不能因为 user-config 里写了 `credentialRef` 就静默创建/更新本机 secret
3. 若命中的 `credentialRef` 在 secret backend 中不存在，应通过 `next_action=create_credential_ref` 或等价 `secret set/import` guidance 暴露，而不是在 onboarding 流程里隐式修复

## 7. 命令契约建议

### 7.1 `config` 命令族

建议新增 top-level 命令，而不是塞进 `workspace`：

```bash
repo-ai-governor config get workspace.mode_preference
repo-ai-governor config set workspace.mode_preference tool_managed
repo-ai-governor config set ui.react.theme calm
repo-ai-governor config set tools.codex.transport remote_api
repo-ai-governor config set tools.codex.remoteApi.provider openai
repo-ai-governor config set tools.codex.remoteApi.model gpt-5
repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
repo-ai-governor config unset tools.codex.remoteApi.model
repo-ai-governor config list --json
```

理由：

1. 这些是“用户级本机私有默认值”，不是 workspace migration 或 workspace artifact 行为；
2. 放进 `workspace` 会让语义混乱，看起来像是在改仓库共享状态；
3. 使用 `tools.<surface>.remoteApi.*` 这样的 authoring path，更容易机械映射到 `enabled_tools[] / configured_remote_api`，而不是再引入 `connect.defaults.*` 这类命令特有的平行 vocabulary。

### 7.2 `secret` 命令族

```bash
repo-ai-governor secret set openai/api-key --stdin
repo-ai-governor secret import openai/api-key --from-env OPENAI_API_KEY
repo-ai-governor secret delete openai/api-key
repo-ai-governor secret list
repo-ai-governor secret status
```

安全约束：

1. 不支持 `repo-ai-governor secret set openai/api-key sk-...`
2. 只支持 `--stdin` 或无回显交互输入
3. `secret list` 默认只返回 key 名称、backend、存在性，不回显 secret 值

一个完整的用户路径示例：

```bash
printf '%s' "$OPENAI_API_KEY" | repo-ai-governor secret set openai/api-key --stdin
repo-ai-governor config set tools.codex.transport remote_api
repo-ai-governor config set tools.codex.remoteApi.provider openai
repo-ai-governor config set tools.codex.remoteApi.credentialRef secret://openai/api-key
repo-ai-governor config set tools.codex.remoteApi.model gpt-5
repo-ai-governor connect --tools codex --output pretty
```

这个 flow 的关键点是：

1. 命令历史里不会出现明文 key；
2. `user-config.yaml` 只会看到 `secret://openai/api-key` 这样的引用；
3. 未来即便团队把 `credentialRef` 收敛到共享 `governor.yaml`，真实 key 仍然只留在用户本机；
4. `connect` 消费到的仍是 transport-aware canonical truth，而不是某个 command-surface 专用的默认值语法。

### 7.3 `connect` 的后续消费方式

Phase 1 可只做“命令能设置本地默认值”。

Phase 2 再让 `connect` 消费：

1. 当命中 `--tools codex` 且用户未显式提供更高优先级的 `--remote-api-*` 参数时，可从 `user-config.yaml` 读取该 tool 的默认 `transport / remoteApi.provider / remoteApi.model / credentialRef / endpoint`；
2. `connect` 读取后必须先把这些默认值归一化为 `enabled_tools[] + configured_remote_api`，再输出 candidate config / diagnostics，而不是把 `user-config` 原始 path 直接透传成新的 runtime truth；
3. 若 `governor.yaml` 已显式给出该 tool 的 transport / remoteApi truth，则仍以 `governor.yaml` 为准；
4. 显式 CLI 参数永远覆盖二者；
5. 若 user-config 中省略了 `remoteApi.vendorBinding`，runtime 必须在输出前解析成确定的 `vendor_binding_kind`；解析失败则 fail-closed。

## 8. 与现有实现的最小兼容落点

### 8.1 Phase 1 最小代码落点

1. `apps/cli/src/main.ts`
   - 新增 `config` / `secret` command family
2. `packages/config`
   - 新增 `user-config` loader / writer
3. `apps/cli/src/runtime`
   - 抽出 `UserConfigService`
   - 抽出 `SecretBackend` / `SecretManager`
4. `packages/shared`
   - secret backend state / error code / i18n keys

### 8.2 Phase 2 最小代码落点

1. `packages/adapters/codex/src/codex-agent-adapter.ts`
2. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`

目标：

1. 把当前 manual-only 的 `credentialRef` 升级为真实 runtime resolution seam；
2. 把 user-config 默认值先归一化到 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*` 这条 canonical truth 链路；
3. 保持 `credentialEnvVar` 路径继续兼容。

### 8.3 Phase 3 最小代码落点

1. `doctor`
   - 增加 secret backend 可用性和 missing secret 指引
2. `connect`
   - 支持从 user-config 读取默认 remote_api authoring 值，并保持输出 contract 继续以 canonical onboarding truth 为准
3. session shell
   - 给 `/config`、`/secret` 做 discoverability

## 9. 安全边界

### 9.1 必须坚持的边界

1. `governor.yaml` 不保存明文 API key
2. 默认 secret backend 不使用明文文件
3. 命令历史中不出现明文 secret
4. 审计/错误输出不得打印 secret 值

### 9.2 允许的例外

只有在以下情况下，才允许本地文件型 secret backend：

1. 用户显式选择 `unsafe-local-file`
2. CLI 在写入前给出高噪声警告
3. 文档明确说明不推荐用于生产或共享机器

## 10. 风险与 trade-off

1. 新增 `config` / `secret` family 会增加 CLI surface，但这是“用户级私有配置”与“workspace/shared 配置”语义分层所必须付出的复杂度。
2. keychain/helper 会提高跨平台测试和文档成本，但若默认回退到明文文件，会把安全风险转嫁给用户。
3. 如果让 `user-config.yaml` 覆盖 `governor.yaml`，将破坏仓库治理真值，因此必须坚持“只补默认、不静默覆盖共享真值”。

## 11. 分期建议

### Phase 1

1. 引入 `user-config.yaml`
2. 引入 `config` / `secret` 命令
3. 接入 macOS Keychain backend
4. 兼容读取旧 `cli-preferences.yaml`

### Phase 2

1. 接入 Windows / Linux backend
2. 将 `credentialRef` 从 manual-only 升级到真实 runtime resolution
3. `doctor` 增加 secret backend 与 missing secret 诊断

### Phase 3

1. `connect` 自动消费 user-config 默认 remote_api authoring 值
2. session shell 增加 `/config`、`/secret` discoverability
3. 如果需要，再抽出 helper/plugin seam

## 12. 本 draft 的推荐结论

本 draft 明确推荐：

1. 不要做“单隐藏文件同时保存 mode + apikey 明文”的简化方案；
2. 采用“共享 `governor.yaml` + 用户级 `user-config.yaml` + 默认 OS keychain/helper”的三层模型；
3. 新增 top-level `config` / `secret` 命令族，而不是把这类用户私有行为塞进 `workspace`；
4. 让 `user-config.yaml` 只补默认、不覆盖共享显式真值；
5. 正式落点采用 `runtime.agent-projection` producer + `runtime.governance-clients` consumer 的 split ownership，而不是 promotion 时临时发明模块归属；
6. 后续实现时优先把 `credentialRef` 与 user-config 默认值一起投影回既有 `enabled_tools[] / configured_remote_api / selected_transport` truth，而不是再新增一套与现有 contract 平行的私有字段。

## 13. Open Questions

1. `config` / `secret` 是否需要支持 profile 维度，还是先只做“当前用户全局默认值”？
2. Linux fallback backend 的正式支持边界是否要限定为 `libsecret`，还是允许 plugin/helper 扩展？
3. `workspace.mode_preference=repo_local` 是否要额外要求一次显式确认，以避免用户误把高级 self-host 路径当成普通 silent default？
