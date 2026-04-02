# Layered Adapter Health Check And Route Probe Technical Solution (Draft)

- Status: draft
- Date: 2026-04-02
- Owner: AI-Agent
- Scope: `adapter health check / route availability probe / doctor+verify diagnostics / codex + github-copilot + claude-code + ollama`
- Target Modules:
  - `packages/adapters/codex`
  - `packages/adapters/github-copilot`
  - `packages/adapters/claude-code`
  - `packages/adapters/local-model`
  - `apps/cli`
  - `packages/shared`
- Related:
  - `.repo-ai-governor/context/dev/project-036-runtime-durable-storage-and-registry-cutover/sprint-004-migration-verification-and-cutover-governance/tasks/TK-479-deliver-migration-verification-rebuild-and-cutover-governance-for-durable-storage-surfaces.md`
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
  - `packages/adapters/local-model/src/local-model-agent-adapter.ts`
  - `apps/cli/src/commands/verify-command.ts`
  - `apps/cli/src/commands/doctor-command.ts`

## 1. 目的

本方案解决当前 adapter health check 过于脆弱的问题。

已经在真实环境中暴露出的典型症状包括：

1. GitHub Copilot 本地手动运行正常，但治理探测失败并 fallback 到 Codex。
2. 失败原因并不是进程不可启动，而只是响应文本为 `OK.` 而非精确 `OK`。
3. `Codex`、`GitHub Copilot`、`Claude Code` 当前都采用相似的 `Respond with exactly OK.` 探测语义。
4. `Ollama` 已经不走这条文本回声路径，而是直接检查 `/api/tags` 与目标模型可用性。

这说明当前系统内部已经出现了两套不一致的 probe 设计：

1. 一套是“模型文本回声 + 精确字符串匹配”
2. 另一套是“能力型协议检查”

本方案希望把它们收敛为统一、可解释、可扩展的分层 health check 体系。

## 2. 问题定义

### 2.1 当前问题不是“工具不可用”，而是“探测判定太脆”

目前 `codex`、`github-copilot`、`claude-code` 的 probe 本质上是：

1. 启动 CLI
2. 发一个短 prompt：
   - `Respond with exactly OK.`
3. 解析输出
4. 要求响应文本精确等于 `OK`

这种做法的问题在于：

1. 工具真实可用，但可能返回 `OK.`、`"OK"`、`` `OK` ``、大小写差异，造成误判。
2. 不同供应商的 CLI 会插入系统事件、session 事件、MCP 事件、usage 事件，文本回声本身并不是最稳定的判断依据。
3. “能回答一个 OK” 并不等于：
   - 已登录
   - 有权限
   - 支持当前 route
   - 支持 reviewer/tester 所需工具限制
4. 同时把“安装 / 认证 / 协议 / 路由能力”压成一个布尔判断，导致 diagnostics 解释力很弱。

### 2.2 真实环境里已经出现误伤

GitHub Copilot 目前已出现以下实际情形：

1. CLI 能成功启动。
2. 非交互 probe 也能正常返回。
3. 但返回的是 `OK.`，所以被当前逻辑记录为：
   - `health_check_invalid_response:github-copilot:OK.`
4. 上层 role routing 因而把 surface 判成 unavailable，并 fallback 到 Codex。

这类失败不应继续被归类为“环境前置条件失败”。

## 3. 目标

### 3.1 必须达成

1. health check 必须减少对“精确文案回声”的依赖。
2. `Codex`、`GitHub Copilot`、`Claude Code`、`Ollama` 必须共享统一的诊断分层模型。
3. `doctor` 与 `verify` 必须能明确告诉用户失败发生在：
   - 安装
   - 认证
   - 协议输出
   - route 能力
4. route fallback 必须尽量基于真实 blocker，而不是文本标点误差。
5. 方案要兼容当前现有 adapter 结构，不要求一次性重写整个 probe runtime。

### 3.2 非目标

1. 不在本方案中把所有 adapter 都改为重型端到端真实任务执行。
2. 不在本方案中引入远端 SaaS 统一探针服务。
3. 不要求所有供应商都必须暴露 native `doctor` 命令。
4. 不要求第一阶段就完全取消文本 no-op probe；但它必须降级为次级信号。

## 4. 当前实现现状

### 4.1 Codex

当前 `Codex` probe 采用：

1. 启动 `codex exec ...`
2. 发送 `Respond with exactly OK.`
3. 解析 CLI 输出中的 agent message
4. 精确比较 `OK`

优点：

1. 简单
2. 能验证基本调用链可工作

问题：

1. 对文本格式脆弱
2. 不能区分登录失败和 route 能力不足
3. 不能表达“可聊天但 reviewer 工具链不可用”

### 4.2 GitHub Copilot

当前 `GitHub Copilot` probe 与上面类似，但还多一层命令入口回退：

1. 优先 `copilot`
2. fallback `gh copilot --`

它的问题比 Codex 更明显，因为 GitHub Copilot CLI 返回的结构化事件更丰富，更容易出现：

1. session 元事件
2. tool 更新事件
3. assistant 最终文本带标点

### 4.3 Claude Code

当前 `Claude Code` probe 也是：

1. 发送 `Respond with exactly OK.`
2. 读取 stdout
3. 精确等于 `OK`

它同样具备“协议层成功但语义回声不完全一致”的误伤风险。

### 4.4 Ollama

`Ollama` 当前已经是更合理的方向：

1. 访问 `/api/tags`
2. 验证返回符合协议
3. 验证目标模型存在

这说明系统内已经有“能力型 probe”实践，可作为统一方向的参考基线。

## 5. 外部资料启发

本方案在 `2026-04-02` 额外查阅了官方资料，得到以下稳定结论：

1. GitHub Copilot CLI 的可用性与认证状态并不只靠 prompt 回声决定；官方文档要求优先关注 CLI 认证与 `gh auth status`。
   - 来源：[GitHub Copilot CLI authentication](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli)
2. GitHub Copilot 在 GHE / hostname 场景下还存在主机绑定差异，因此 auth/install 层需要独立诊断。
   - 来源：[Using GitHub Copilot with an account on GHE.com](https://docs.github.com/en/copilot/how-tos/personal-settings/using-github-copilot-with-an-account-on-ghecom)
3. Claude Code 官方文档明确有 `claude doctor` 这类环境诊断入口，因此比“让模型回 OK”更适合作为认证/环境层信号。
   - 来源：[Claude Code getting started](https://docs.anthropic.com/en/docs/claude-code/getting-started)
   - 参考 CLI 能力：[Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-reference)
4. Ollama 官方 API 把 `/api/version` 和 `/api/tags` 作为稳定协议面，这类 probe 显然比文本回声更稳。
   - 来源：[Ollama get version](https://docs.ollama.com/api-reference/get-version)
   - 来源：[Ollama tags API](https://docs.ollama.com/api/tags)
5. Codex 官方公开资料强调 CLI 登录流程，例如 `codex --login`，这意味着认证状态本身应成为单独诊断层，而不是隐含在 prompt 回声里。
   - 来源：[Codex CLI and Sign in with ChatGPT](https://help.openai.com/en/articles/11381614-codex-cli-and-sign-in-withgpt)

这些资料共同支持一个结论：

`应把“能启动、已登录、能说话、能执行当前 route”拆成多个层次分别判断，而不是继续用单个文本回声布尔值承载全部语义。`

## 6. 备选方案比较

### 6.1 方案 A：继续使用精确 `OK`

优点：

1. 简单
2. 现有实现改动最少

问题：

1. 已在真实环境中造成误判
2. 对 CLI 文本细节高度敏感
3. 诊断信息贫弱

结论：

不推荐。

### 6.2 方案 B：仅把 `OK` 比较改成宽松字符串比较

做法：

1. 接受 `OK`、`OK.`、`"OK"`、大小写差异

优点：

1. 很快止血
2. 能修掉当前最明显的 false negative

问题：

1. 仍然把 install/auth/route 能力混成一层
2. 仍然没有统一分层诊断
3. 只是局部缓解，不是最终模型

结论：

应作为 Phase A 的短期修复，但不应作为终局。

### 6.3 方案 C：分层 health check + route probe

做法：

1. 把 probe 拆成四层
2. 每层产出独立状态与 reason code
3. 最终再聚合成 route 可用性

优点：

1. 可解释
2. 跨供应商兼容
3. 更适合 `doctor` / `verify`
4. 更适合后续 reviewer/tester 差异化探测

结论：

推荐。

## 7. 推荐方案：四层 health check

### 7.1 Layer 1: Install / Discovery

判断内容：

1. 可执行文件是否存在
2. 命令候选是否可回退
3. endpoint 是否可达

示例：

1. `codex` / `copilot` / `gh` / `claude` 二进制是否存在
2. `Ollama` endpoint 是否可连通

产出建议：

1. `install_status=pass|warn|fail`
2. `reason=command_missing|endpoint_unreachable|fallback_entrypoint_used`

### 7.2 Layer 2: Auth / Session Readiness

判断内容：

1. 是否已登录
2. 是否有订阅 / token / host 配置
3. 是否命中 credential / unauthorized / forbidden

建议：

1. GitHub Copilot 优先看 `gh auth status`
2. Claude Code 优先看 `claude doctor`
3. Codex 通过 `codex --login` 相关错误语义与已知登录状态推断
4. Ollama 无需 auth 层，但可以标记为 `not_applicable`

产出建议：

1. `auth_status=pass|warn|fail|na`
2. `reason=credential_missing|login_required|forbidden|host_mismatch`

### 7.3 Layer 3: Protocol / Transport Readiness

判断内容：

1. 进程能否正常启动
2. 是否能输出我们可解析的协议格式
3. 是否能拿到最小 assistant 终态或合法接口响应

这里的关键变化是：

1. 不再把“精确等于 OK”作为主判据
2. 只要求“协议链路成功 + 返回结构可识别”

对 CLI surface 建议：

1. 退出码正常
2. 可解析 JSON / print output
3. 有 assistant terminal message 或等价完成信号

对 Ollama 建议：

1. `/api/version` 或 `/api/tags` 返回合法 JSON
2. 配置模型存在

产出建议：

1. `protocol_status=pass|warn|fail`
2. `reason=protocol_invalid|unexpected_exit|timeout|model_missing`

### 7.4 Layer 4: Semantic Echo / Route Capability

这一层再拆两部分：

#### A. Semantic Echo

如果仍保留 low-cost no-op prompt，则只做**宽松归一化比较**：

1. 接受 `OK`
2. 接受 `OK.`
3. 接受 `"OK"` / `` `OK` ``
4. 接受大小写和空白差异
5. 不接受带额外实义 prose 的回复，如 `OK, ready to help`

这一层的定位应是：

1. 次级 confidence signal
2. mismatch 时更适合 `warn`，而不是直接 `unavailable`

#### B. Route Capability

判断内容：

1. 该 surface 是否支持当前 route 需要的执行模式
2. 是否支持 chat-only / tool-forbidden / review-shell-allowlist 等约束

例如：

1. `reviewer` route 与 `tester` route 需要 shell/tool 权限，不应和 direct-answer 使用同一可用性结论
2. `Ollama` 即使 protocol 正常，也不应被误判为可承担 tool-calling reviewer

产出建议：

1. `route_capability_status=pass|warn|fail`
2. `reason=tool_calling_unsupported|review_scope_unsupported|confirmation_gate_missing`

## 8. 每个 adapter 的建议落点

### 8.1 Codex

建议：

1. 保留当前低成本 probe 调用链
2. 将 `OK` 判定改为宽松归一化
3. 把 auth/login 相关错误显式分类为 auth 层
4. reviewer route 增加 route-capability 维度，而不是只看 probe 成败

### 8.2 GitHub Copilot

建议：

1. 先做 install/discovery：
   - `copilot`
   - `gh copilot --`
2. 再做 auth 层：
   - `gh auth status`
3. 再做 JSON protocol smoke
4. 文本回声仅作为次级信号

特别说明：

`health_check_invalid_response:github-copilot:OK.` 这类结果不应再导致 surface 被直接标记 unavailable。

### 8.3 Claude Code

建议：

1. install/discovery
2. `claude doctor`
3. print / non-interactive protocol smoke
4. 宽松 semantic echo

如果 `doctor` 已明确失败，则无需再把后续文本 mismatch 当成主失败原因。

### 8.4 Ollama

建议：

1. 继续以 `/api/version` + `/api/tags` + model 存在性为主
2. 不引入 `Respond with exactly OK.` 这类文本回声探测
3. route capability 明确标记：
   - direct-answer 可用
   - tool-calling reviewer/tester 不可用或 degraded

## 9. 新的诊断模型

建议在 `doctor` / `verify` 的 durable diagnostics 之外，为 adapter probe 增加结构化字段：

```json
{
  "surface": "github-copilot",
  "install_status": "pass",
  "auth_status": "pass",
  "protocol_status": "pass",
  "semantic_status": "warn",
  "route_capability_status": "pass",
  "selected_availability_status": "available",
  "reasons": [
    "semantic_echo_variant:github-copilot:OK."
  ]
}
```

这样可以把下面几种情况分开：

1. 真不可用
2. 仅语义回声有轻微漂移
3. 可聊天但不可 review
4. 可 direct-answer 但不适合作为 tester/reviewer

## 10. 实施建议

### 10.1 Phase A：止血

1. 为 `codex / github-copilot / claude-code` 引入共享的 health-check echo normalization helper
2. 接受 `OK.` 等 trivial 变体
3. 继续保持现有 probe 架构不变

### 10.2 Phase B：诊断分层

1. 将当前 adapter probe reason 拆成：
   - install
   - auth
   - protocol
   - semantic
   - route capability
2. `doctor` / `verify` 输出新的结构化字段

### 10.3 Phase C：native preflight

1. GitHub Copilot 接入 `gh auth status`
2. Claude Code 接入 `claude doctor`
3. Codex 接入更明确的 login/session readiness 判断
4. Ollama 接入 `/api/version`

### 10.4 Phase D：route synthetic probes

1. 为 reviewer/tester/direct-answer 分别建立轻量 capability probe
2. 不再依赖单一 probe 结论横向套用到所有 role

## 11. 验收标准

1. `OK.`、`"OK"` 这类 trivial 变体不再导致 `github-copilot`、`codex`、`claude-code` 被误判 unavailable。
2. `doctor` / `verify` 能明确指出失败层级，而不是只给出 `health_check_failed`。
3. `Ollama` 不被强行纳入文本 echo probe 语义。
4. role fallback 更贴近真实 blocker，而不是文案噪声。
5. 用户在本地手动确认 surface 可用时，治理探测结果与真实体验的一致性显著提升。

## 12. 最终建议

最终推荐不是“把 `OK` 比较写得更宽松”这么简单，而是：

1. 短期：
   - 用共享 normalization helper 修掉当前 false negative
2. 中期：
   - 引入四层 health check 诊断模型
3. 长期：
   - 让 route availability probe 从“单一 no-op 文本探测”演进到“surface-specific native preflight + route capability synthesis”

一句话总结：

`适配器健康检查不应再以精确文本回声作为唯一真值；推荐收敛为 install/auth/protocol/route-capability 四层模型，并只把宽松语义回声作为次级信号。`
