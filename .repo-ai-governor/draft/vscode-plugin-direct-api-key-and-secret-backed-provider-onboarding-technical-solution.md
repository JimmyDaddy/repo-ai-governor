# VS Code Plugin Direct API Key And Secret-Backed Provider Onboarding Technical Solution (Draft)

- Status: draft
- Date: 2026-04-20
- Owner: AI-Agent
- Scope: `VS Code 插件 provider onboarding / 直接 API key 输入 / secret-backed credentialRef authoring / zero-env-var human path`
- Target Modules:
  - `runtime.governance-clients`
  - `runtime.agent-projection`
- Related Inputs:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
  - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
  - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
  - `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
  - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
  - `apps/vscode-extension/README.md`
  - `docs/local-adoption-playbook.zh-CN.md`
  - `https://code.visualstudio.com/api/extension-capabilities/common-capabilities`
  - `https://code.visualstudio.com/api/references/vscode-api`
  - `https://docs.continue.dev/customization/settings`
  - `https://docs.continue.dev/customize/model-providers/top-level/openai`

## 1. 背景与问题

当前仓库已经把 VS Code 插件提升为 built-source checkout 与本地 VSIX 路径上的 primary human-facing workbench，但 provider onboarding 这一条最常见的人类路径仍然没有达到“像其他插件一样直接填 API key 即可”的体验。

当前真实缺口主要有四个：

1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts` 中现有的 connect flow 仍会提示用户填写 `credentialEnvVar`，把 IDE 内的首轮接入变成“先理解环境变量语义，再去手动配置 shell/env”。
2. 插件虽然已经有 `setManagedSecret()` 这样的 secure prompt 能力，也已有 `credentialRef` / secret readiness 的 runtime seam，但它们没有被串成一个默认 provider onboarding 闭环。
3. 现有 README 与 adoption playbook 仍然偏 CLI / env-var 心智，和“插件已是 primary workbench”的用户预期不一致。
4. 用户当前还需要理解 `credentialRef`、`credentialEnvVar`、`setManagedSecret`、`configure-user-default` 这些底层概念，才能把一个 provider 接起来，门槛过高。

结合仓库内正式真值与外部官方资料，可以得到一个明确结论：

1. 仓库内已经正式接受 `credentialRef + secret backend` 作为 canonical secret 边界，而不是把真实 key 写进共享配置。
2. VS Code 官方扩展能力已经提供加密 secret storage 与 password-masked input，这说明“插件里直接输入 API key，但底层不明文持久化”是平台级可行路径。
3. 主流 IDE AI 插件普遍把“选择 provider / 粘贴 API key / 保存”作为首轮体验，而不是要求用户先理解环境变量与外部 CLI。

因此，本 draft 要解决的不是“是否继续保留 secret-backed credentialRef 方向”，而是“如何把既有正式方向落成一个插件内可直接使用的 provider onboarding 主路径”。

## 2. 目标

1. 让 VS Code 插件用户可以直接在插件内完成 provider 选择、model / endpoint 配置与 API key 输入，而不需要手动设置环境变量。
2. 保持 canonical secret boundary 不变：真实 API key 只进入 secret backend，配置层只保存 `credentialRef` 与 provider / model / endpoint 等非敏感字段。
3. 把 provider onboarding 的用户心智从“手工拼配置键与 env var”收敛为“插件内连接 provider”，并让 readiness / doctor / refresh 能给出 editor-native 的结果与下一步动作。

## 3. 非目标

1. 不移除 CLI、CI、headless automation 对 `credentialEnvVar` 或其他非 GUI 路径的兼容支持。
2. 不把真实 API key 写入 `settings.json`、`governor.yaml`、`user-config.yaml`、chat transcript、命令预览或日志。
3. 不为旧用户设计迁移策略；当前应用尚未上线，本轮按直接改正用户主路径处理。

## 4. 现状与约束

1. `contract.runtime.vscode-governance-workbench-surface.v1` 已经冻结 VS Code 插件只能作为 `local_orchestration_service` 的受控 consumer，不能在 extension host 内自建 shadow truth。
2. `contract.runtime.governance-local-config-and-secret-command.v1` 与 `runtime.agent-projection` 的 ADR 已正式接受：
   - 用户私有默认值进入 `user-config.yaml`
   - 真实 secret 进入 secret backend
   - `credentialRef` 作为 selector truth
   - canonical normalization 仍由 `runtime.agent-projection` 负责
3. 插件当前已经拥有两条相关能力，但未被组合成默认 onboarding：
   - `setManagedSecret()` 可通过 no-echo prompt 写入 managed secret
   - service runtime 已能解析 configured `credentialRef` 与 secret readiness
4. 插件当前 connect flow 仍把 `credentialEnvVar` 当作人类默认 authoring path，这和“插件是 primary human-facing workbench”的定位冲突。
5. 本方案必须遵守现有事实边界：
   - 插件不能直接把 raw key 落入配置文件
   - 插件不能直接读取 canonical files 取代 service truth
   - CLI 仍然保留为 automation / CI / scriptable / debugging path
6. `runtime.agent-projection` 已经 formalize 了三类不能被插件重写的真值：
   - `surface -> transport -> provider binding` 的 canonical 组合关系
   - `connect / doctor / verify` 的 analyze-first / read-only onboarding 边界
   - `verification_status / next_action(s)` 的通用 readiness taxonomy
7. 因而 VS Code 插件可以把“如何让用户更顺手地输入 API key”做成 host-native UX，但不能借此重新定义：
   - `remoteApi.provider` / `remoteApi.vendorBinding` 的解析规则
   - `credentialRef` 的 canonical selector 语义
   - `connect / doctor / verify` 的 mutation 责任边界
8. 补充外部证据只用于佐证实现方向，不改变仓库真值：
   - VS Code 官方文档说明 `ExtensionContext.secrets` 适合保存敏感信息，且桌面端使用平台安全存储能力。
   - VS Code API 允许 `showInputBox({ password: true })` 这类受保护输入。
   - Continue 官方文档已把 provider 配置与 API key 输入作为 IDE 内可理解的常见用户路径。
9. 但这不等价于把 VS Code extension-local secret storage 升格为 Governor 的 canonical secret owner；本方案的持久化真值仍然是 Governor managed secret backend。

## 5. 方案选项与对比

### 5.1 方案 A：继续保留 env-var-first 的插件接入路径

1. 插件继续提示用户填写 `credentialEnvVar`，必要时再引导用户自行调用 secret/config 命令。
2. 优点：
   - 代码改动最小
   - 复用当前 connect surface
   - CLI / headless 与插件看起来使用同一组低层参数
3. 缺点：
   - 对人类用户而言仍然是“先学内部参数，再学插件”
   - 和 primary workbench / zero-cli human path 定位冲突
   - 继续把 IDE 内首轮接入建立在环境变量心智上，体验不符合常见插件预期
   - 已有的 secret-backed contract 不能成为默认主路径

### 5.2 方案 B：允许插件把 raw API key 直接保存到 VS Code settings 或本仓库配置

1. 用户在插件里输入 key，插件直接把明文写进 `settings.json` 或 `governor.yaml`。
2. 优点：
   - 实现最简单
   - 用户可见路径直观
3. 缺点：
   - 违反既有 `credentialRef + secret backend` 正式方向
   - 容易把密钥带进共享配置、备份、截图、日志或设置同步
   - 与 VS Code 平台已提供的 secret storage 能力相冲突

### 5.3 方案 C：插件原生 provider onboarding，底层保持 secret-backed `credentialRef`

1. 用户在插件内选择 provider / model / endpoint，并直接粘贴 API key。
2. 插件通过 service-owned seam 完成两类写入：
   - secret write：把 raw key 写入 managed secret backend
   - config write：把 provider / vendorBinding / model / endpoint / `credentialRef` 写入 user-local config
3. 插件的人类主路径不再提示 `credentialEnvVar`；CLI / CI / headless surface 仍保留 env-var 兼容入口。
4. 优点：
   - 符合用户对 IDE AI 插件的常见预期
   - 与既有 secret-backed contract 一致
   - 不需要 extension host 自建 shadow state
   - 可以把 `/status`、overview、doctor 等 surface 的 readiness guidance 直接收敛到“provider 已连接 / secret 缺失 / 需要更新 key”
5. 缺点：
   - 需要补齐 provider onboarding 的 typed service contract 与测试
   - 需要同步清理 docs 与 copy，避免继续暴露 env-var-first 文案

### 5.4 对比结论

1. 方案 A 只能算低层兼容路径，不能继续作为插件的人类默认主路径。
2. 方案 B 虽然省事，但会直接破坏已经 formalize 的 secret boundary，因此不应考虑。
3. 方案 C 在用户体验、安全边界与现有正式方向之间最平衡，且能把“插件 primary workbench”落实到最常见的首轮接入场景，因此推荐采用。

## 6. 推荐方案

1. 将 VS Code 插件中的 provider onboarding 明确改成“直接输入 API key”的 editor-native 主路径。
2. 人类用户在插件中的默认心智统一为：
   - 选择 tool / provider
   - 选择或确认 model
   - 必要时填写 endpoint
   - 直接粘贴 API key
   - 插件自动保存非敏感配置与 secret selector
3. 推荐的持久化边界固定为：
   - raw secret：只写入 managed secret backend
   - persistent config：只写入 `tools.<tool>.remoteApi.provider`
   - `tools.<tool>.remoteApi.vendorBinding`
   - `tools.<tool>.remoteApi.model`
   - `tools.<tool>.remoteApi.endpoint`（如适用）
   - `tools.<tool>.remoteApi.credentialRef=secret://<provider>/api-key`
4. `credentialEnvVar` 从插件的人类主路径中移除，不再作为 connect wizard 的默认输入项；它继续留给 CLI / CI / headless / compatibility surface。
5. 插件继续作为 service consumer，而不是自行拼接文件写入逻辑：
   - onboarding 状态通过 service query 提供
   - secret write 与 config mutation 通过 service command seam 提供
   - refresh / doctor / overview / chat 继续读取 service-owned readiness truth
6. `connect / doctor / verify` 继续保持 analyze-first / read-only onboarding 语义；插件 direct API key entry 必须通过显式 provider-onboarding mutation surface 或等价 host-facing command seam 完成，而不是把 secret/config 写入偷渡进现有 analyze-first 路径。
7. 插件的人类可见 CTA 可以是 `Connect Provider`、`Update API Key` 这类 editor-native wording，但底层仍必须映射回已有 canonical truth：
   - transport / provider / vendorBinding 由 `runtime.agent-projection` 解析和校验
   - readiness 仍由 `verification_status / next_action(s)` 等 canonical fields 表达
   - UI 不得自创一套与 runtime 不一致的 provider-binding 或 readiness taxonomy
8. 这是一份 follow-up draft，而不是对现有 `technical-solution.api-key-remote-adapter-invocation` 或 `technical-solution.local-user-config-and-secret-backed-command-configuration` 正式方向的替代；它只把已 formalize 的 transport / provider-binding / secret-backed truth 收敛成一个 VS Code 插件内真正可用的人类主路径。

## 7. 核心设计与契约影响

### 7.1 Provider Onboarding UX Contract

1. 插件需要提供清晰的用户入口，例如：
   - `Connect Provider`
   - `Update API Key`
   - `Reconnect Provider`
2. 这些入口应在 `Workbench Overview`、command palette 与 chat `@governor` 中可达，而不是只暴露为低层 `setManagedSecret` / `configure-user-default`。
3. 默认表单不要求用户理解 `credentialRef` 或 `credentialEnvVar`；这两者属于实现细节。

### 7.2 Secret And Config Persistence Contract

1. 插件 secure prompt 采集到的 raw key 不得进入：
   - `settings.json`
   - `governor.yaml`
   - `user-config.yaml`
   - chat transcript
   - command preview / argv
   - diagnostics payload
2. 默认 selector 约定为 `secret://<provider>/api-key`，以保证 provider 级复用与 predictable lookup；若未来需要 per-tool 或 per-workspace selector，再做显式 follow-up。
3. service command 必须以原子语义返回一个 onboarding receipt，至少包含：
   - `provider`
   - `tool`
   - `credentialRef`
   - `secretBackend`
   - `warning[]`
   - `nextAction`
4. 即便 VS Code 宿主自身支持 `SecretStorage`，本方案也不把 extension-local secret persistence 视为 canonical truth；最终持久化后的 secret owner 仍应是 Governor managed secret backend。

### 7.3 Service-Native Typed Seam

1. 推荐新增一组 provider onboarding typed DTO / command seam，由 `local_orchestration_service` 持有真值：
   - provider onboarding snapshot
   - provider onboarding apply request
   - provider onboarding receipt / readiness summary
2. 这组 facade 是 host-facing aggregation seam，不替代 `contract.runtime.agent-onboarding.v1` 的 canonical onboarding truth，也不重写 `runtime.agent-projection` 对 transport / provider binding / next_action taxonomy 的所有权。
3. 插件不再在 extension host 中自行编排“先 secret set，再零散 config set”的跨步骤真值；可以由 UI 分步采集，但提交和结果必须收敛到同一条 service-owned mutation / receipt。
4. 如果首轮实现需要复用既有 secret/config mutation seam，也应在 service runtime 内聚合成 typed provider onboarding facade，而不是把 raw config key authoring 永久暴露给插件 UI。
5. 若 `provider + transport` 不能唯一推出 `vendorBinding` 或 selector 约定，facade 必须 fail-closed 并回到 canonical guidance，而不是在插件内用临时 heuristics 静默补全。

### 7.4 Readiness And Degraded-State Contract

1. 当 provider 未配置时，overview / status / doctor 应明确提示“未连接 provider”，并给出插件内可执行 CTA。
2. 当 `credentialRef` 已存在但 secret 缺失时，surface 应提示“需要更新 API key”，而不是要求用户手动去查找 env var 或 CLI 命令。
3. 当 endpoint / model / provider 配置不完整时，surface 应返回结构化 guidance，不得卡成无限 loading 或空白无解释状态。
4. 这些 plugin-native CTA 只能是 canonical `next_action(s)` 或 provider-onboarding snapshot 的 host-level 呈现，不应反向把 VS Code 专属动作名写进 `runtime.agent-projection` 的通用 readiness taxonomy，除非后续有单独 contract 变更。

### 7.5 Docs And Support-Truth Impact

1. `apps/vscode-extension/README.md` 与 adoption playbook 需要把 VS Code 的首轮接入改写成插件内 provider onboarding，而不是继续把 env-var authoring 写成默认路径。
2. CLI 相关文档仍保留，但应明确它是 scriptable / CI / debugging / headless path，而不是插件变得可用的前置要求。
3. 公开文案应与运行时行为一致：如果插件人类路径已支持直接输入 API key，就不应继续把“先设置环境变量”写成 editor-first 默认步骤。

## 8. 风险与权衡

1. 风险：provider 的默认 selector 规则若设计不稳，后续可能出现命名漂移。
   - 缓解：首轮固定 `secret://<provider>/api-key`，避免暴露自定义 selector 给普通用户。
2. 风险：部分 provider 的认证方式不止一个 API key。
   - 缓解：当前 scope 明确收敛为“API key first”的 provider onboarding；更复杂认证形态以后续 typed auth-profile 扩展承接。
3. 风险：插件为了优化 UX，重新长出一层 client-owned state。
   - 缓解：把 typed onboarding snapshot / apply / receipt 交给 service seam，插件只做输入采集与结果呈现。
4. 权衡：把插件的人类默认路径从 env-var 切到 direct key entry，会让 CLI 与插件的默认 authoring 心智不完全一致。
   - 这是有意 trade-off；对 IDE 用户来说，插件内直接完成 onboarding 才符合 primary human-facing workbench 的产品定位，而 CLI 仍可保留更底层的自动化入口。
5. 风险：promotion 误把本方案写成对现有 active runtime truth 的 supersede，导致 `remote_api` / `connect` contract 被重复定义。
   - 缓解：明确把本方案定位为 `runtime.governance-clients` 的 host-facing follow-up；只有在 generic onboarding truth 真正变化时，才对 `runtime.agent-projection` 做最小增量修订。

## 9. 分阶段落地建议

1. Phase A：直接改正插件主路径
   - 移除 connect wizard 中面向人类用户的 `credentialEnvVar` 输入步骤
   - 增加 provider / model / endpoint / API key 的 editor-native onboarding flow
   - 落地 secret-backed `credentialRef` 持久化与 readiness 回显
   - 保持 `connect / doctor / verify` 的 analyze-first contract 不变
2. Phase B：补齐插件内 provider lifecycle
   - 增加 `Update API Key`、`Reconnect Provider`、`Open Provider Settings` 等入口
   - 在 overview / chat / doctor 中统一 provider readiness copy
   - 同步 README 与 adoption playbook 文案
   - 将 host-native CTA 与 canonical `next_action(s)` 的映射关系固定下来
3. Phase C：扩展高级认证与更强状态可视化
   - 在不破坏 `credentialRef + secret backend` 前提下支持更复杂的 auth profile
   - 视需要增加 provider connection history、last-verified status 或 richer receipt/backlink

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.vscode-plugin-direct-api-key-and-secret-backed-provider-onboarding`
2. 建议 `target_module_ids`：`runtime.governance-clients` / `runtime.agent-projection`
3. 进入 `technical-solution-review` 前需要重点复核的边界：
   - raw API key 是否在任何配置、日志、diagnostics、chat transcript 或 preview surface 泄漏
   - 插件是否仍然保持 `local_orchestration_service` consumer 身份，而不是自建 shadow truth
   - 插件 direct onboarding 是否与 `connect / doctor / verify` 的 analyze-first 边界清晰分离
   - 插件是否只是消费既有 `transport / provider / vendorBinding / next_action(s)` canonical truth，而不是重新发明一套 host-only taxonomy
   - `credentialEnvVar` 是否只是退出插件人类主路径，而不是被错误地从 CLI / CI / headless compatibility 中删除
   - docs / support wording 是否与新的 editor-first runtime 行为同步
4. 若后续进入 `technical-solution-promotion`，预期 formal docs 落点：
   - 主要落点应为 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/` 下新增或扩展 VS Code provider onboarding / host-facing UX contract
   - 主要落点应为 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/` 下新增插件 direct API key onboarding ADR
   - 只有在 generic onboarding truth、`next_action(s)` taxonomy、`vendorBinding` resolution 或 `credentialRef` canonical semantics 真正变化时，才同步更新 `runtime.agent-projection` 相关 ADR / contract
