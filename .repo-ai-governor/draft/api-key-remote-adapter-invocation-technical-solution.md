# API-Key Remote Adapter Invocation Technical Solution (Draft)

- Status: draft
- Date: 2026-04-02
- Owner: AI-Agent
- Scope: `adapter transport expansion / api-key remote invocation / provider capability truthfulness / routing + diagnostics + delivery follow-up guidance`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`
  - `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - `apps/cli/src/runtime/adapter-routing-runtime.ts`
  - `packages/config/src/types/interfaces/governor.interface.ts`
  - `.repo-ai-governor/draft/multi-ai-tool-collaboration-status-and-path-to-production.md`

## 1. 目的

当前各个远端 agent surface 主要通过对应 CLI 接入：

1. `codex -> codex exec`
2. `claude-code -> claude / claude-code`
3. `github-copilot -> copilot / gh copilot`

这条路径已经证明了真实调用可行，但也带来了 4 类限制：

1. 依赖本机 CLI 安装、登录态和版本兼容。
2. 在 server-side / sidecar / desktop host 中不适合作为唯一生产 transport。
3. 无法把 API key、组织级配额、provider endpoint 和成本治理收敛到统一 contract。
4. `CLI transport` 和“供应商官方 remote API”被混在同一层里，不利于 capability truthfulness。

本方案的目标是：

1. 在保留现有 `CLI_EXEC` 路径的前提下，新增一条 `API key + remote service` transport。
2. 让 `Codex/OpenAI`、`Claude/Anthropic`、`GitHub` 路径的能力声明、鉴权方式、流式事件、工具调用、超时/取消语义都能被结构化表达。
3. 不把“供应商品牌”与“具体 transport”硬绑定，避免后续扩展时架构继续耦合。

## 2. 当前状态与问题定义

### 2.1 当前实现事实

当前仓库里的远端 adapter 是典型的 `CLI_EXEC` 架构：

1. `adapter-sdk` 里只有 `AgentCliExecutionMode = baseline | cli_exec`。
2. `CodexAgentAdapter`、`ClaudeCodeAgentAdapter`、`GithubCopilotAgentAdapter` 都通过 `spawn(...)` 调 CLI。
3. `CliAdapterRoutingRuntime` 默认对这 3 个 surface 实例化 `CLI_EXEC` 模式。
4. capability matrix、probe、retry/backoff、diagnostics 目前也主要围绕 `CLI transport` 设计。

这意味着当前系统缺的不是“再接一个 provider”，而是：

`缺一个与 CLI 并列的一等 remote API transport seam。`

### 2.2 新 transport 需要解决的问题

如果直接在现有 adapter 里零散加几个 `fetch(...)`：

1. `CLI` 和 `HTTP API` 的错误模型会混在一起。
2. capability truthfulness 会失真。
3. GitHub 这类“不存在严格 1:1 Copilot public inference API”的情况会被错误包装。
4. `connect/doctor/verify` 无法区分“本机 CLI 可用”与“远端 API 凭据可用”。

因此本方案不建议做“每个 adapter 私下补一个 API 分支”，而是建议正式扩展 transport 模型。

## 3. 外部决策输入（官方资料）

以下判断依赖官方文档，截至 `2026-04-02`：

### 3.1 OpenAI

1. OpenAI 官方当前推荐的主线是 `Responses API`，支持 API key、流式响应、工具调用和 structured outputs：
   - [Developer quickstart](https://platform.openai.com/docs/quickstart)
   - [Streaming API responses](https://platform.openai.com/docs/guides/streaming-responses)
   - [Structured model outputs](https://platform.openai.com/docs/guides/structured-outputs?lang=javascript)
   - [Responses API reference](https://platform.openai.com/docs/api-reference/responses/compact?api-mode=responses)
2. 从官方文档看，`Responses API` 已具备：
   - API key 环境变量接入
   - SSE streaming
   - function/tool calling
   - JSON schema structured outputs

### 3.2 Anthropic

1. Anthropic 官方主线是 `Messages API`：
   - [Claude API overview](https://docs.anthropic.com/en/api/overview)
   - [Create a Message](https://platform.claude.com/docs/en/api/beta/messages/create)
   - [Streaming Messages](https://platform.claude.com/docs/en/build-with-claude/streaming)
   - [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
2. 从官方文档看，Anthropic 已具备：
   - `x-api-key` 鉴权
   - SSE streaming
   - `output_config.format` 结构化输出
   - `strict: true` 的 tool input schema 校验
3. Anthropic 官方还定义了 Claude Code 的正式 settings 文件层级，其中 user-level settings 位于 `~/.claude/settings.json`：
   - [Claude Code settings](https://docs.anthropic.com/en/docs/claude-code/settings)
4. 这说明对 `Claude` 生态而言，“provider-local config discovery”是有官方路径可依赖的，但它更适合作为本地开发默认值来源，而不是覆盖 repo 显式配置的全局真值。

### 3.3 GitHub

GitHub 需要分成 3 条线看，不能混为一谈：

1. `GitHub Copilot CLI`
   - [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli)
   - [Authenticating GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)
   - 这是 CLI 产品，不是干净的“API key 直连 inference API”。
2. `GitHub Copilot SDK`
   - [GitHub Copilot SDK](https://docs.github.com/en/copilot/how-tos/copilot-sdk)
   - [Getting started with Copilot SDK](https://docs.github.com/en/enterprise-cloud%40latest/copilot/how-tos/copilot-sdk/sdk-getting-started)
   - 官方文档表明：SDK 当前仍处于 technical preview，并提供多种 setup / auth 路径，例如 Bundled CLI、GitHub OAuth、Local CLI 与 BYOK。
   - 这说明 `Copilot SDK` 更像一个高层产品 integration surface，而不是一个“`PAT + endpoint + stable inference contract`”就能描述清楚的底层 remote API seam。
3. `GitHub Models REST API`
   - [About GitHub Models](https://docs.github.com/en/github-models/about-github-models)
   - [Prototyping with AI models](https://docs.github.com/github-models/prototyping-with-ai-models)
   - [REST API endpoints for models inference](https://docs.github.com/en/rest/models/inference)
   - [Using GitHub Models to develop AI-powered applications in your enterprise](https://docs.github.com/en/github-models/github-models-at-scale/use-models-at-scale)
   - 官方文档表明它支持：
     - PAT / App token
     - `models:read`
     - streaming / non-streaming
     - tool-calling
     - structured response format
     - 多家模型目录
4. GitHub Copilot CLI 官方认证文档还明确给出了本地凭据优先级：
   - 环境变量
   - OS keychain
   - `gh auth token` fallback
   - 当 keychain 不可用时，可回退到 `~/.copilot/config.json`
   - [Authenticating GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)

### 3.4 关键判断

基于上述官方资料，可得出 3 个重要判断：

1. `Codex/OpenAI` 与 `Claude/Anthropic` 可以直接做 first-class remote API transport。
2. `GitHub Copilot` 生态当前没有一个像 OpenAI Responses 或 Anthropic Messages 那样既稳定、又适合直接作为 Governor 默认 `REMOTE_API` seam 的“同品牌一一对应 inference contract”。
3. 若要做 GitHub 的 key-based remote transport，更诚实的路线是：
   - 要么新增 `github-models` surface
   - 要么将 `github-copilot-sdk` 标成 experimental transport

这里第 3 点是我基于官方文档做出的推论：

`Copilot SDK 虽然可以评估为更高层的产品集成路线，但它的接入/认证矩阵和产品语义都不等同于一个简单的 provider-native inference API；GitHub Models 又不是 Copilot persona 本身，所以不应把二者强行包装成“GitHub Copilot 的纯 remote API 等价物”。`

## 4. 方案结论

### 4.1 总体结论

建议新增：

`baseline | cli_exec | remote_api`

三种一等 transport，而不是继续让 `CLI_EXEC` 承担所有远端调用语义。

### 4.2 推荐路线

1. 保留现有 `CLI_EXEC`，因为它仍有较高的 agentic parity。
2. 新增 `REMOTE_API` transport，优先覆盖：
   - `codex -> openai responses api`
   - `claude-code -> anthropic messages api`
3. GitHub 路线分开处理：
   - `github-copilot` surface 继续以 `CLI_EXEC` 为稳定路径
   - 新增 `github-models` surface 作为 key-based remote inference 路径
   - `Copilot SDK` 只作为实验路线，不作为第一阶段主线

### 4.3 不推荐路线

不推荐直接把 `github-models` 塞进现有 `github-copilot` surface 的 `REMOTE_API` 模式。

原因是：

1. 用户语义会误以为这是“Copilot 远程服务等价路径”。
2. GitHub Models 是模型网关，不是 Copilot CLI/agent persona 的完全镜像。
3. 这会让 routing、diagnostics、capability truthfulness 变得不诚实。

### 4.4 模块 / lifecycle / delivery 归属

这份方案默认不新建独立 technical-solution module，而是作为 `runtime.agent-projection`
下的一条 follow-up technical solution 演进。

推荐的 formalization 归属如下：

1. `target_module_ids`
   - `runtime.agent-projection`
2. 推荐 `solution_id`
   - `technical-solution.api-key-remote-adapter-invocation`
3. 推荐 lifecycle 关系
   - 不 supersede `runtime.agent-projection` 模块本身
   - 优先视为对以下 active solution 的增量补充：
     - `technical-solution.multi-ai-tools-onboarding-role-agent-projection`
     - `technical-solution.layered-adapter-health-check-and-route-probe`
   - 若最终接受了 liveness contract 的字段扩展，再额外 amend：
     - `technical-solution.agent-invoke-liveness-and-timeout-governance`
4. 推荐 `final_paths`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`（仅在采纳 liveness delta 时）
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
5. 推荐 delivery mode
   - `followup_required`
6. 推荐 delivery ownership
   - 不在当前 `project-037 / sprint-001` 直接吸收
   - 默认落到 `current-context.md` 已登记的 follow-up stream：
     `project-037-agent-invoke-liveness-and-timeout-governance-rollout / sprint-002-cross-adapter-liveness-rollout-and-diagnostics`
   - 若后续实现被证明确实需要新增 `packages/adapters/github-models`、调整 `adapter-sdk` public exports、
     或引入新的 clean-room distribution / release matrix，则应拆到独立 runtime-agent-projection
     transport rollout stream，而不是继续挤进 liveness-only sprint
7. 影响分类建议
   - 默认按 `exported_contract_change` 处理
   - 只有在新增 `github-models` surface 并同步新增 formal doc consumer 面时，才升级为伴随
     `module_registry_change` 的 promotion 窗口
8. `release gate / clean-room smoke / distribution matrix` 在本方案中默认只作为 delivery follow-up guidance
   - 不属于本次 `runtime.agent-projection` formalization 的直接 `final_paths`
   - 若后续真的需要修改 gate profile、CI profile 或 release governance 契约，应拆出 companion change，
     由 `governance.execution-gates` 或 release-governance surface 单独承接

## 5. 目标架构

## 5.1 传输层抽象升级

建议把 `AgentCliExecutionMode` 演进为更通用的 transport seam。

这里建议明确遵循本仓库的有限集合治理基线：`transport`、`remote provider`、`vendor binding kind`
都应通过集中 enum/constants 管理，而不是在配置契约和运行时里散落裸字符串。

例如：

```ts
export enum AgentExecutionTransportKind {
  BASELINE = "baseline",
  CLI_EXEC = "cli_exec",
  REMOTE_API = "remote_api",
}

export enum AgentRemoteApiProviderKind {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GITHUB_MODELS = "github_models",
}

export enum AgentRemoteApiVendorBindingKind {
  OPENAI_RESPONSES = "openai_responses",
  ANTHROPIC_MESSAGES = "anthropic_messages",
  GITHUB_MODELS_INFERENCE = "github_models_inference",
}
```

如果要最小化对现有代码的扰动，也可以保留旧 enum，同时新增：

1. `AgentExecutionTransportKind`
2. `AgentRemoteApiProviderKind`
3. `AgentRemoteApiOperationsRuntime`

然后逐步让各 adapter 从“CLI 专属 executionMode”迁移到“通用 transport kind”。

## 5.2 新增 provider binding 层

这里的“统一 binding seam”不能只停留在概念层，必须明确 package ownership。

推荐做法不是“在 `adapter-sdk` 之上再发明一个模糊中间层”，而是：

1. 在 `adapter-sdk` 中定义 transport-neutral contract
2. 在 `adapters/*` 中落具体 vendor binding
3. 在 `core-agent-projection` / runtime consumer 中只消费归一化后的 binding facts

对应的 binding 类型包括：

1. `OpenAiResponsesVendorBinding`
2. `AnthropicMessagesVendorBinding`
3. `GitHubModelsVendorBinding`

每个 binding 只负责：

1. 鉴权头
2. endpoint / SDK client 构建
3. request/response mapping
4. provider-specific error normalization
5. usage/request-id extraction

而 adapter 仍负责：

1. `probe / invokeStage / streamEvents / requestConfirmation / cancel`
2. capability matrix
3. route-level diagnostics
4. prompt shaping
5. stage output normalization

这样可以避免把供应商 HTTP 细节散落到每个 adapter 中。

### 5.2.1 package ownership 与依赖方向

推荐的 package 分层如下：

1. `packages/adapter-sdk`
   - 只放 transport-neutral 的 public contract：
     - `AgentExecutionTransportKind`
     - `AgentRemoteApiProviderKind`
     - `AgentRemoteApiVendorBindingKind`
     - `RemoteApiBindingContract`
     - `RemoteApiInvokeRequest / Response`
     - `AgentRemoteApiOperationsRuntime`（前提是它本身不内嵌 vendor SDK 细节）
   - 不放：
     - 固定供应商 endpoint
     - 供应商鉴权头常量
     - OpenAI / Anthropic / GitHub SDK 依赖
2. `packages/adapters/codex`
   - 负责 `codex` surface 的 `CLI_EXEC`
   - 负责 `codex -> remote_api -> openai_responses`
   - `OpenAiResponsesVendorBinding` 应 colocate 在该 package 内
3. `packages/adapters/claude-code`
   - 负责 `claude-code` surface 的 `CLI_EXEC`
   - 负责 `claude-code -> remote_api -> anthropic_messages`
   - `AnthropicMessagesVendorBinding` 应 colocate 在该 package 内
4. `packages/adapters/github-copilot`
   - 第一阶段继续只负责 `github-copilot + cli_exec`
   - 若后续要评估 Copilot SDK，应作为 experiment 放在该 package 内，而不是反向污染 `adapter-sdk`
5. `packages/adapters/github-models`
   - 若接受 `github-models` surface，应新增独立 adapter package
   - `GitHubModelsVendorBinding` 与该 surface 的 capability truthfulness 一起 colocate
6. `packages/core-agent-projection`
   - 负责把 `surface -> transport -> provider binding` 组合投影成 onboarding / probe /
     projection / liveness consumer 可以稳定消费的结构化事实
   - 只读取 normalized binding metadata，不直接 import vendor SDK
7. `apps/cli`
   - 继续拥有 host-local adapter assembly 与 `CliAdapterRoutingRuntime`
   - 但它组装的依赖应是“surface adapter + normalized transport config”，而不是直接内联 provider HTTP 细节

依赖方向约束应明确为：

1. `adapter-sdk` 可被 `adapters/*`、`core-*`、`apps/cli` 依赖，但自身保持 provider-neutral
2. `adapters/*` 可以依赖 vendor SDK，并实现 `RemoteApiBindingContract`
3. `core-agent-projection`、`core-runtime`、`apps/cli` 不直接依赖 OpenAI / Anthropic / GitHub 的 provider SDK
4. 这样“统一 seam”体现在 shared contract 与 normalized runtime，而不是把所有供应商代码塞回一个公共 SDK

## 5.3 配置契约

建议在 `packages/config/src/types/interfaces/governor.interface.ts` 的 `AdapterToolConfig` 下新增。

这里的重点是：配置层不直接表达“品牌名 = transport 名”，而是拆成：

1. `toolId`：用户可见 surface
2. `transport`：执行通道
3. `remoteApi.provider` / `remoteApi.vendorBinding`：远端供应商与协议绑定

示例：

```ts
interface AdapterToolRemoteApiConfig {
  provider: AgentRemoteApiProviderKind;
  vendorBinding?: AgentRemoteApiVendorBindingKind;
  model: string;
  apiKeyEnv?: string;
  credentialRef?: string;
  baseUrl?: string;
  baseUrlEnv?: string;
  requestTimeoutMs?: number;
  maxRetries?: number;
  organization?: string;
  project?: string;
  apiVersion?: string;
  enableStreaming?: boolean;
  enableStructuredOutput?: boolean;
  enableToolCalling?: boolean;
  allowProviderLocalConfig?: boolean;
  resolutionPolicy?: "explicit_first" | "prefer_provider_local";
}

interface AdapterToolConfig {
  toolId: AdapterSurface;
  enabled?: boolean;
  availability?: AdapterAvailability;
  unavailableReasons?: string[];
  transport?: AgentExecutionTransportKind;
  remoteApi?: AdapterToolRemoteApiConfig;
  localModel?: AdapterToolLocalModelConfig;
}
```

这里需要明确两层语义：

1. `vendorBinding` 可以在 user-authored config 中省略，但只允许在“该 `surface + transport + provider`
   当前只有一个合法 binding 映射”的情况下省略。
2. 一旦配置进入 runtime / onboarding / probe / projection / diagnostics，必须先被归一化为显式 binding truth，
   不允许再依赖“字段缺失即表示默认 binding”。

当前推荐的确定性解析矩阵为：

1. `codex + remote_api + openai -> openai_responses`
2. `claude-code + remote_api + anthropic -> anthropic_messages`
3. `github-models + remote_api + github_models -> github_models_inference`

补充约束：

1. 若将来同一 `surface + provider` 同时支持多个 vendor binding，`vendorBinding` 就必须在 repo 配置中显式填写。
2. `connect` 生成的 candidate config、`enabled_tools[]` row、health probe payload、`AgentDescriptor`
   与 liveness snapshot 都必须 materialize resolved `vendor_binding_kind`。
3. 无法唯一解析 binding 时，必须 fail-closed，而不是静默挑一个默认值。

对应示例：

```yaml
adapters:
  tools:
    - toolId: codex
      enabled: true
      transport: remote_api
      remoteApi:
        provider: openai
        model: gpt-5.2
        credentialRef: openai/default
        apiKeyEnv: OPENAI_API_KEY
        baseUrlEnv: OPENAI_BASE_URL
        requestTimeoutMs: 30000
        maxRetries: 2
        enableStreaming: true
        enableStructuredOutput: true
        enableToolCalling: true
        resolutionPolicy: explicit_first

    - toolId: claude-code
      enabled: true
      transport: remote_api
      remoteApi:
        provider: anthropic
        model: claude-sonnet-4-5
        credentialRef: anthropic/default
        apiKeyEnv: ANTHROPIC_API_KEY
        baseUrlEnv: ANTHROPIC_BASE_URL
        apiVersion: 2023-06-01
        requestTimeoutMs: 30000
        maxRetries: 2
        enableStreaming: true
        enableStructuredOutput: true
        enableToolCalling: true
        allowProviderLocalConfig: true
        resolutionPolicy: prefer_provider_local
```

对于 GitHub，推荐新增新 surface 后再配置：

```yaml
    - toolId: github-models
      enabled: true
      transport: remote_api
      remoteApi:
        provider: github_models
        model: openai/gpt-4.1
        credentialRef: github-models/default
        apiKeyEnv: GITHUB_TOKEN
        baseUrlEnv: GITHUB_MODELS_BASE_URL
        apiVersion: 2026-03-10
        requestTimeoutMs: 30000
        maxRetries: 2
        enableStreaming: true
        enableStructuredOutput: true
        enableToolCalling: true
        resolutionPolicy: explicit_first
```

### 5.3.1 Endpoint / baseUrl 策略

`baseUrl` 不应该只是“可有可无的附带字段”，而应作为正式 contract 支持。

原因是至少存在以下场景：

1. 企业网关 / 代理层转发
2. OpenAI-compatible 中转端点
3. region / residency / enterprise host 差异
4. 本地 sidecar / internal relay 作为统一出口

因此建议：

1. `baseUrl` 支持在 `governor.yaml` 显式配置。
2. 同时支持 `baseUrlEnv`，便于 CI / deployment profile 覆盖。
3. 若 provider 存在官方本地 settings 文件，且开启了 `allowProviderLocalConfig=true`，可把 provider-local endpoint 作为本地开发默认值来源。
4. 任何 provider-local / env 派生的 endpoint 都不得覆盖 repo 显式配置的 `baseUrl`。

推荐优先级：

1. `remoteApi.baseUrl`
2. `remoteApi.baseUrlEnv`
3. provider-local config 中的 endpoint / host
4. vendor binding 内建官方默认 endpoint

### 5.3.2 Provider-local config 发现策略

对于“是否优先读取本地 provider 配置”，本方案建议分层处理，而不是一刀切。

1. 对非 secret 的 provider 默认值：
   - 可以优先读 provider-local config
   - 典型例子：Claude Code 官方 `~/.claude/settings.json`
2. 对 secret / credential：
   - 不建议默认把任意 `~/.xxx` 文件当成最高优先级
   - 必须由 vendor binding 明确声明可读取哪些官方路径
   - 不允许做“扫描整个 home 目录”的隐式发现

因此建议引入以下规则：

1. `allowProviderLocalConfig` 默认 `false`
2. 只有在 binding 明确支持、且用户显式开启时，才读取 provider-local config
3. provider-local config discovery 只允许命中：
   - vendor 官方文档声明的 settings / auth path
   - OS keychain / credential manager
4. provider-local discovery 的用途应区分为两类：
   - `settings discovery`：模型别名、endpoint、workspace 行为
   - `credential discovery`：登录态、token、keychain entry

默认建议的读取顺序如下：

1. repo 显式配置
2. env override
3. secret store / keychain
4. provider-local config
5. 官方默认值

但对于明确希望“沿用本机现成 provider 登录态/配置”的本地开发者，可以允许：

```yaml
remoteApi:
  allowProviderLocalConfig: true
  resolutionPolicy: prefer_provider_local
```

此时推荐顺序变为：

1. repo 显式配置
2. provider-local config / provider-owned login-state discovery
3. env override（仅对未显式配置的可覆盖字段）
4. 官方默认值

这里要特别强调：

1. `resolutionPolicy` 主要影响 `settings discovery`
2. `credentialRef` 的 secret-store 优先级仍以 `§6.1.1` 为准
3. 也就是说，“prefer_provider_local” 不能把 repo 明确声明的 `credentialRef` 压到后面

也就是说：

`可以支持读取 ~/.claude 或同类 provider-owned config roots，但它应是 binding-aware、显式开启、且不能越过 repo 显式配置。`

## 5.4 route/runtime 选择策略

`CliAdapterRoutingRuntime` 需要从“每个 surface 固定走 CLI”改成：

1. 先看 `tool.transport`
2. 再看 `remoteApi.provider / vendorBinding`
3. 最后实例化对应 adapter transport + vendor binding
4. `probe` 与 `connect/doctor/verify` 输出 transport-aware diagnostics

伪代码：

```ts
switch (tool.transport) {
  case "cli_exec":
    return new CodexAgentAdapter({ transportKind: "cli_exec", ... });
  case "remote_api":
    return new CodexAgentAdapter({
      transportKind: "remote_api",
      remoteApi: ...,
      vendorBindingKind: "openai_responses",
      ...
    });
  default:
    return new CodexAgentAdapter({ transportKind: "baseline", ... });
}
```

也就是说，推荐的组合关系是：

`surface -> transport -> provider binding`

而不是把 `codex`、`claude-code`、`github-copilot` 这些 surface 与 `openai/anthropic/github_models`
这些 provider 视为同一层对象。

## 5.5 capability truthfulness 规则

新 transport 不能沿用 CLI 的能力声明，必须按 transport 单独计算。

建议最小策略如下：

| Surface | Transport | Provider Binding | Streaming | Structured Output | Tool Calling | Confirmation Gate | Cancellation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `codex` | `cli_exec` | `n/a` | degraded | supported | supported | unsupported | unsupported/degraded |
| `codex` | `remote_api` | `openai_responses` | supported | supported | supported | unsupported | degraded |
| `claude-code` | `cli_exec` | `n/a` | degraded | degraded | supported | unsupported | unsupported/degraded |
| `claude-code` | `remote_api` | `anthropic_messages` | supported | supported | supported | unsupported | degraded |
| `github-copilot` | `cli_exec` | `n/a` | supported | degraded | supported | unsupported | unsupported/degraded |
| `github-models` | `remote_api` | `github_models_inference` | model-dependent | model-dependent | model-dependent | unsupported | degraded |

解释：

1. `Confirmation Gate` 仍然属于 Governor 自己的人类治理能力，不应假装变成 provider 原生能力。
2. `Cancellation` 对大多数 HTTP API 最多只能保证“本地连接 abort”，不能默认宣称 provider 端强取消，因此建议至少从 `supported` 收紧到 `degraded`。
3. `GitHub Models` 的 tool-calling / structured output 应以 catalog/model capability 为准，不能写死全量支持。

## 5.6 runtime.agent-projection contract delta

这份方案若要 promotion-ready，不能只写“routing 要 transport-aware”，还必须把 active consumer contract 的字段变化写清楚。

本方案推荐的原则是：

1. 优先 additive change，尽量保持现有 consumer 可兼容
2. 只有当 minimum field 集合被破坏时，才升级到 `v2`
3. CLI-only 现有 payload 必须能通过显式默认值继续表达，而不是依赖“缺字段即代表 cli_exec”

### 5.6.1 `agent-onboarding-contract` 增量

推荐补充的结构化事实：

1. `enabled_tools[]` 对应的 tool row 应显式带出：
   - `transport_kind`
   - `provider_kind`
   - `vendor_binding_kind`
   - `model`
   - `credential_mode`
   - `endpoint_source`
2. `connect` 生成 candidate config 时，必须能稳定输出：
   - `transport`
   - `remoteApi.provider`
   - `remoteApi.vendorBinding`
   - `remoteApi.model`
   - `remoteApi.apiKeyEnv | credentialRef | baseUrl | baseUrlEnv`
3. `doctor` / `verify` 的 `next_action` 与 `next_actions[]` 必须区分：
   - `install_cli`
   - `set_api_key_env`
   - `create_credential_ref`
   - `switch_to_cli_exec`
   - `switch_surface_to_github-models`

兼容策略：

1. CLI-only surface 仍输出 `transport_kind=cli_exec`
2. `provider_kind` / `vendor_binding_kind` 对 CLI-only row 可为 `null`
3. 若只扩展 tool-level nested payload，可保持 top-level contract 继续为 `v1`

### 5.6.2 `adapter-health-and-route-probe-contract` 增量

推荐新增或显式化以下 probe 字段：

1. `transport_kind`
2. `provider_kind`
3. `vendor_binding_kind`
4. `model`
5. `credential_source`
6. `endpoint_source`
7. `request_cancellation_mode`

推荐补充的 reason-code 语义：

1. `cli_missing`
2. `credential_missing`
3. `credential_invalid`
4. `endpoint_unreachable`
5. `provider_rate_limited`
6. `provider_quota_exhausted`
7. `model_capability_missing`
8. `provider_binding_mismatch`
9. `vendor_binding_required`

兼容策略：

1. `cli_exec` row 仍然有效，只需显式带出 `transport_kind=cli_exec`
2. route fallback 应优先看新的 transport-aware reason code，而不是再猜 stderr

### 5.6.3 `agent-projection-contract` 增量

`AgentDescriptor` 需要从“只选 surface”升级到“surface + transport + binding”的可回放视图。

推荐新增字段：

1. `selected_transport`
2. `selected_provider_kind`
3. `selected_vendor_binding_kind`
4. `selected_model`
5. `capability_snapshot_source`

新增约束：

1. `selected_surface` 继续保留为用户语义主键
2. capability snapshot 必须按 transport 计算，不允许把 `codex(cli_exec)` 的能力偷渡给 `codex(remote_api)`
3. fallback 决策必须能区分“surface 不可用”和“同 surface 的 remote_api binding 不可用”

兼容策略：

1. 现有 descriptor consumer 仍可只看 `selected_surface`
2. transport-aware consumer 再额外消费新增字段
3. 若新增字段保持 optional，可先 additive rollout；若被提升为 minimum fields，则同步升级 contract version

### 5.6.4 `agent-invoke-liveness-contract` 增量

如果 `remote_api` rollout 进入 shared liveness runtime，则该 contract 也应显式补 transport 事实。

推荐新增字段：

1. `transport_kind`
2. `vendor_binding_kind`
3. `remote_request_id`
4. `cancel_mechanism`

新增语义要求：

1. `last_transport_activity_at` 对 `remote_api` 必须覆盖 HTTP chunk / SSE event / structured stream event
2. `cancelled` 在 `remote_api` 场景默认只表示“本地 abort 已发出”，不默认宣称 provider 端任务已被强取消
3. `invoke_transport_idle_timeout` 与 `invoke_semantic_stall_timeout` 的判断逻辑必须同时适用于 child process 和 remote stream

兼容策略：

1. 若第一阶段只是把 liveness telemetry 适配到 HTTP stream，可优先走 additive field
2. 若 consumer 必须把这些字段视为 minimum truth，则应单独把 `agent-invoke-liveness-contract` 升到 `v2`

## 6. 安全与运维契约

## 6.1 密钥管理与持久化存储

必须坚持以下规则：

1. `governor.yaml` 不保存明文 API key。
2. `governor.yaml` 可以保存：
   - 环境变量名（如 `apiKeyEnv`）
   - 持久化 secret 引用（如 `credentialRef`）
3. 对本地开发 / desktop / interactive shell，推荐引入加密 secret store，而不是要求用户每次启动都导出环境变量。
4. 对 CI / server-side / sidecar deployment，环境变量仍然是最简单且最可审计的输入面。
5. 若启用本地持久化 secret store，优先使用 OS 原生安全设施：
   - macOS: Keychain Access
   - Windows: Credential Manager
   - Linux: libsecret / GNOME Keyring / KWallet
6. 只有当 provider 自己官方文档明确支持本地 keychain / config 存储时，才允许读取 provider-owned secret location。
7. audit/report/cli-output 中禁止回显：
   - `Authorization`
   - `x-api-key`
   - provider SDK config
8. diagnostics 只允许输出：
   - `api_key_missing`
   - `invalid_credentials`
   - `rate_limited`
   - `quota_exhausted`
   - `endpoint_unreachable`

### 6.1.0 secret-store / provider-local mutation boundary

`connect / doctor / verify` 在 secret 与 provider-owned config 这件事上，必须继续遵守 analyze-first /
safe-local 的边界，不能因为新增 `remote_api` 就静默跨过去。

明确规则如下：

1. `connect`
   - 可以读取 repo 显式配置、env、`credentialRef` 指向的 secret store、provider-local config 和官方声明的
     provider-owned auth path
   - 可以生成 candidate config、diagnostic artifact 与 `next_action`
   - 不得默认写入 OS keychain、credential manager、`~/.claude/settings.json`、`~/.copilot/config.json`
     或任何其他 provider-owned auth/config 文件
2. `doctor`
   - 可以做 read-only credential existence / validity probe
   - 可以执行 `safe_local` 范围内的非 secret 修复
   - 不得创建、更新、删除 secret store entry，也不得代替用户完成 provider login
3. `verify`
   - 只能消费已有配置与已有凭据做 read-only 验证
   - 不得顺手写入新的 credential、token cache 或 provider-owned config
4. 若用户需要创建或更新 `credentialRef`
   - 必须走显式 follow-up surface，并保持 preview/confirm 或等价 receipt/audit 语义
   - 在该 surface 尚未正式定义前，`connect / doctor / verify` 只能输出 `next_action`，例如：
     - `create_credential_ref`
     - `set_api_key_env`
     - `run_provider_login`
5. provider-local config discovery 只允许 read-only；不允许把“发现能力”扩展成“自动迁移 / 自动修复 /
   自动写回本机 provider 配置”

### 6.1.1 推荐 secret 解析顺序

为了兼顾“本地开发方便”和“CI/生产环境确定性”，本方案推荐：

1. 一次性 env override
2. `credentialRef` 指向的 OS keychain / credential manager
3. provider-local credential discovery
4. fail-closed

解释：

1. env override 适合作为显式临时覆盖，便于调试和 CI。
2. `credentialRef` 适合作为本地长期默认值，解决“每次启动都 export API key 太麻烦”的问题。
3. provider-local credential discovery 只作为 convenience fallback，不应成为不可见的最高优先级真值。

也就是说，本方案建议后续提供类似这样的能力：

```yaml
remoteApi:
  provider: openai
  credentialRef: openai/default
  apiKeyEnv: OPENAI_API_KEY
```

这样在本地开发时：

1. 默认从 `openai/default` 对应的 keychain secret 读取
2. 若用户显式设置了 `OPENAI_API_KEY`，则临时覆盖
3. 若两者都不存在，再看是否允许 provider-local fallback

### 6.1.2 不推荐的做法

1. 不推荐把 API key 明文写入 `governor.yaml`
2. 不推荐自动把 secret 落到仓库内 `.repo-ai-governor/**`
3. 不推荐对 `~/.claude`、`~/.copilot`、`~/.config/**` 做无白名单递归扫描
4. 不推荐让 provider-local credential state 覆盖 repo 显式的 `credentialRef` / env 约束

## 6.2 错误分类

建议新增统一 error attribution：

1. `credential_missing:<provider>`
2. `credential_invalid:<provider>`
3. `rate_limited:<provider>`
4. `quota_exhausted:<provider>`
5. `transport_timeout:<provider>`
6. `stream_interrupted:<provider>`
7. `schema_validation_failed:<provider>`
8. `tool_call_contract_failed:<provider>`

并继续通过共享 runtime 做：

1. retry/backoff
2. deadline budgeting
3. reason sanitization
4. provider request-id capture

## 6.3 成本与限流

新增 `REMOTE_API` 之后，成本与限流必须进入正式治理面：

1. `probe` 只做最小成本健康检查。
2. `invokeStage` 记录：
   - provider
   - model
   - input/output/total tokens
   - elapsedMs
   - requestId
3. route runner 可在后续阶段引入：
   - `budgetPolicy`
   - `provider concurrency window`
   - `rate-limit degrade`

## 7. 供应商级推荐方案

## 7.1 Codex / OpenAI

### 结论

推荐作为第一优先级落地。

### 原因

1. 官方 API 稳定且能力完整。
2. 与当前 `codex` adapter 语义最容易对齐。
3. structured output / tool calling / streaming 都有明确官方 contract。

### 推荐实现

这里不是把 `codex` 与 `openai` 视为并列可替换对象，而是：

1. `codex` 是 surface
2. `remote_api` 是 transport
3. `openai_responses` 是该 transport 下的 provider binding

所以推荐表达应是 `codex -> remote_api -> openai_responses`。

1. 保留 `codex + cli_exec`
2. 新增 `codex -> remote_api -> openai_responses`
3. provider binding 直接走 OpenAI `Responses API`

## 7.2 Claude Code / Anthropic

### 结论

推荐作为第二优先级落地。

### 原因

1. `Messages API` + `streaming` + `structured outputs` + `strict tool use` 已足够支持 agent stage 调度。
2. 比当前 `claude` CLI 更适合 server-side / sidecar transport。

### 推荐实现

同理，这里推荐表达应是 `claude-code -> remote_api -> anthropic_messages`，而不是把
`claude-code` 和 `anthropic` 写成同层级组合项。

1. 保留 `claude-code + cli_exec`
2. 新增 `claude-code -> remote_api -> anthropic_messages`
3. provider binding 走 Anthropic `Messages API`

## 7.3 GitHub

### 结论

不建议第一阶段把 `github-copilot` 直接升级成“纯 API-key remote service adapter”。

### 原因

1. Copilot SDK 仍是 technical preview。
2. Copilot SDK 的 setup / auth 与运行形态明显更接近高层产品 integration surface，而不是一个
   可被 `PAT + endpoint + stable inference contract` 充分描述的底层 provider-native remote seam。
3. GitHub Models 虽然是 clean 的 key-based REST API，但它是模型网关，不是 Copilot persona 的严格等价物。
4. 因此若直接把 `github-copilot + remote_api` 定义为第一阶段正式主线，会让 transport truth、
   capability truthfulness 和产品语义边界一起变得含混。

### 推荐实现

分两步：

1. 第一阶段：
   - 继续保留 `github-copilot + cli_exec`
   - 不承诺 `github-copilot + remote_api`
2. 第二阶段：
   - 新增 `github-models` surface
   - 用 GitHub Models REST API 做 key-based remote inference
   - 若后续产品确实需要 Copilot SDK，再作为 `experimental transport` 处理

## 8. 分阶段落地建议

### Phase 1: SDK / Config / Runtime Baseline

1. 在 `adapter-sdk` 引入通用 transport seam
2. 新增 `remote-api` config contract
3. 新增共享 `AgentRemoteApiOperationsRuntime`
4. 扩展 diagnostics / verify 输出 transport 维度

### Phase 2: OpenAI First-Class Remote API

1. `codex` adapter 增加 `REMOTE_API`
2. `connect/doctor/verify` 增加 OpenAI API key probe
3. 增加 unit/integration/live smoke

### Phase 3: Anthropic First-Class Remote API

1. `claude-code` adapter 增加 `REMOTE_API`
2. 接入 Messages API / streaming / structured outputs
3. 补齐 capability truthfulness 与 delivery verification guidance

### Phase 4: GitHub Remote Path Clarification

1. 新增 `github-models` surface
2. 接 GitHub Models REST API
3. 若需要，再单独评估 `Copilot SDK` 实验接入

### Phase 5: Delivery Follow-Up / Onboarding / Documentation

1. `connect` 生成 transport-aware baseline config
2. `doctor/verify` 输出 transport / provider / model / credential health
3. delivery follow-up 应评估以下验证面：
   - default distribution
   - remote-api enabled distribution
   - clean-room remote smoke
4. 若上述验证面最终被提升为正式 gate profile 或 release governance 契约，应在 companion change 中
   归属到 `governance.execution-gates` / release governance，而不是继续由本 runtime draft 单独承接

## 9. 测试与交付验证建议

## 9.1 单测

1. request mapping
2. stream event accumulation
3. structured output schema mapping
4. error normalization
5. credential fail-closed

## 9.2 集成测试

1. route runner 依据 `transport` 选择正确 adapter path
2. `connect/doctor/verify` 输出 transport-aware diagnostics
3. capability truthfulness 不因 transport 切换而漂移

## 9.3 live smoke（仅在凭据存在时启用）

1. `OPENAI_API_KEY` -> `codex remote api`
2. `ANTHROPIC_API_KEY` -> `claude remote api`
3. `GITHUB_TOKEN(models:read)` -> `github-models`

## 10. 风险与边界

1. provider API 演进快，`remote_api` 方案必须依赖 vendor binding 单层收敛，不能把 HTTP 细节散在业务层。
2. `structured output` 与 `tool calling` 在不同 provider 上存在细微语义差异，必须用 capability truthfulness 明确暴露。
3. `GitHub` 路径最容易被误建模；必须把 `Copilot` 与 `GitHub Models` 分开表达。
4. 新 transport 会引入更多 secret 管理和计费风险；至少要同步扩大 delivery verification，若后续升级为
   正式 gate profile，则必须由 companion governance/release change 承接。

## 11. 最终建议

最终建议是：

1. 不替换当前 CLI adapters。
2. 新增一条与 CLI 并列的 `REMOTE_API` transport。
3. 第一阶段只做：
   - `codex -> OpenAI Responses API`
   - `claude-code -> Anthropic Messages API`
4. GitHub 不做伪等价：
   - `github-copilot` 继续走 CLI
   - 如需 key-based remote inference，则新增 `github-models` surface
5. 通过 surface-aware + transport-aware + provider-binding-aware capability matrix、diagnostics 与 delivery verification 保持 truthfulness。

这个路线的好处是：

1. 对用户新增了真正 server-friendly 的 remote API 调用方式。
2. 不破坏当前已验证的 CLI path。
3. 不会因为 GitHub 路径语义模糊而把整个 adapter 层设计做歪。
