# Remote API Transport And Provider Binding Seam ADR

- Status: active
- Date: 2026-04-02
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.remote-api-transport-and-provider-binding-seam.v1`

## 1. Context

当前 `Codex`、`Claude Code` 与 `GitHub Copilot` 的远端调用语义主要通过 `CLI_EXEC` 落地。该路径已经证明“真实 agent 调用可行”，但它把 CLI 安装/登录态、本机 host 约束、provider 远程 API、能力声明与诊断语义混在了一层里。随着 server-side / sidecar / desktop host 需求上升，Governor 需要一条与 CLI 并列的一等 `remote_api` transport seam，并让 `connect / doctor / verify`、route probe、agent projection 与 invoke-liveness 继续共享同一份 truth。

与此同时，供应商生态并不等价：

1. `OpenAI Responses API` 与 `Anthropic Messages API` 已具备稳定的 API key + streaming + structured output contract。
2. `GitHub Copilot SDK` 仍是 technical preview，更像高层产品 integration surface，而不是第一阶段默认 `REMOTE_API` canonical seam。
3. `GitHub Models` 是 key-based inference gateway，但并不是 `Copilot persona` 的严格远端等价物。

因此，Governor 不能把“surface”“transport”“provider binding”重新压成单层字符串，也不能让 provider-specific HTTP 细节反向污染 `adapter-sdk`。

## 2. Decision

1. 将 runtime agent projection 接受的 transport truth 扩展为：
   - `baseline`
   - `cli_exec`
   - `remote_api`
2. 统一使用 `surface -> transport -> provider binding` 的组合关系，而不是把品牌名与 transport 名硬绑定。
3. `adapter-sdk` 保持 provider-neutral，只定义 transport-neutral contract；OpenAI / Anthropic / GitHub Models 的 vendor binding 应 colocate 在各自 `packages/adapters/*` package 内。
4. `remoteApi.vendorBinding` 仅允许在用户配置层按“唯一合法映射”省略；一旦进入 onboarding / probe / projection / liveness runtime，必须 materialize resolved `vendor_binding_kind`，否则 fail-closed。
5. `connect / doctor / verify`、route probe、`AgentDescriptor` 与 invoke-liveness contract 都必须显式变为 transport-aware / binding-aware。
6. `connect / doctor / verify` 在 secret store 与 provider-owned config 上继续遵守 analyze-first / read-only 边界；secret 创建更新、provider login 与 config write-back 必须通过显式 follow-up surface 或 `next_action` 承接。
7. GitHub 第一阶段继续保留 `github-copilot + cli_exec` 为稳定路径；若需要 key-based remote inference，应新增 `github-models` surface。`Copilot SDK` 可以作为 experimental transport 评估，但不视为默认 formal seam。
8. release gate、clean-room smoke 与 distribution matrix 只作为 delivery follow-up guidance；若未来升级为正式 gate profile 或 release governance 契约，必须由 companion governance change 单独承接。

## 3. Consequences

1. Governor 可以在不破坏现有 CLI parity 的前提下，引入真正 server-friendly 的 `remote_api` transport。
2. capability truthfulness 不再依赖“同一 surface 默认等价同一能力”；CLI 与 remote API 的能力矩阵、取消语义、reason code 与 model support 可以被诚实表达。
3. `connect / doctor / verify`、route fallback、agent descriptor 与 invoke-liveness 共享同一份 transport-aware 真值，避免 runtime 里再长出第二套 provider 路由事实源。
4. `adapter-sdk` 不会因为引入 `remote_api` 而变成供应商 SDK 聚合层；统一 seam 体现在 shared contract 与 normalized runtime，而不是把所有 provider 代码塞回公共包。
5. GitHub 路径的产品语义保持清晰：`Copilot`、`GitHub Models` 与 `Copilot SDK` 各自的 truthfulness、delivery ownership 与 rollout 风险可以分别治理。
