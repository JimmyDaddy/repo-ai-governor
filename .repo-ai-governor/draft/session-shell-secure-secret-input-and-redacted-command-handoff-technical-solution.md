# Repo AI Governor Session Shell 安全 Secret 输入与脱敏 Command Handoff 技术方案（Draft）

- Status: draft
- Date: 2026-04-12
- Owner: AI-Agent
- Scope: session shell `/secret set <keyName>` secure local capture / pre-commit secret rejection / redacted local secret mutation handoff
- Target Modules:
  - `runtime.cli-interactive-shell`
  - `runtime.governance-clients`
- Related:
  - `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
  - `.repo-ai-governor/draft/session-shell-ink-input-takeover-technical-solution.md`
  - `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`
  - `apps/cli/src/commands/secret-command.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
  - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`

## 1. 背景与问题

仓库已经在 `2026-04-11` 接受了“本机私有 user-config + secret backend mutation command family”的正式方向：

1. `config` 负责用户本地默认值。
2. `secret` 负责本机 secret backend mutation。
3. 真实 secret 不得进入 `governor.yaml` 或 `user-config.yaml`。
4. `secret set` 不允许通过位置参数接收明文 secret。

但当前 session shell 中的 `/secret` 仍停留在 discoverability / nested handoff 层，而没有形成真正安全可用的 secret 输入链路。

这在真实交互里暴露为两个问题：

1. `/secret set openai/api-key` 在 session shell 中会被桥接成 nested CLI JSON 执行，而 nested CLI 被固定为 `--no-interactive` 且 `isStdinTty=false`，导致 `secret set` 无法进入 no-echo prompt。
2. 若用户尝试输入 `/secret set openai/api-key sk-...`，CLI 虽然会因多余位置参数报错，但 raw secret 已经有机会进入 slash/composer/pending preview 风险面。

因此当前缺失的不是 `secret set` 命令本身，而是 session shell 与本机 secret backend mutation 之间那条“先本地隐藏录入、再脱敏提交”的受治理通路。

## 2. 目标

本方案只 formalize 一个 promotion-safe 的 Phase A 闭环：在 session shell 中安全执行显式 `/secret set <keyName>`。

具体目标：

1. 当用户在 session shell 中提交 `/secret set <keyName>` 时，shell 进入本地安全录入，而不是走失败的非交互 nested CLI handoff。
2. raw secret 在任何时候都不得进入以下表面：
   - `composer_value`
   - `slash_query`
   - `bridgeArgv`
   - `command_preview`
   - transcript lines
   - orchestration event metadata
   - progress dock title/detail
   - localized error strings 或 thrown error metadata
3. 若用户在 slash 文本里追加 secret，shell 必须在 presenter-state commit 之前拦截并丢弃这些字节，而不是先显示、再清除。
4. session shell 仍只是 host-facing authoring surface；secret backend mutation truth 继续由既有 `secret` contract 与共享 mutation path 承接。
5. 本轮 formal scope 不发明新的 service-owned secure-input outcome，也不把 `entry.cli` 升格为 target module truth。

## 3. 非目标

1. 不支持“把 secret 发给模型，再由系统代保存”。
2. 不把 `remoteApi.endpoint`、`base url`、workspace mode、theme、default model 等普通配置混入 secret backend。
3. 不在本轮 formalize skill / `session.main` 触发的 `local_secure_input_request`。
4. 不在本轮 formalize desktop / VS Code 的 secure input dialog。
5. 不要求首轮重做 `secret list/status/delete/import` 的既有 discoverability 路径；本轮只锁定 `/secret set <keyName>`。

## 4. 当前实现为何不满足“无痕设置 secret”

### 4.1 `secret set` command family 本身的安全边界是正确的

当前 `apps/cli/src/commands/secret-command.ts` 已明确：

1. `secret set` 只接受 `--stdin` 或 no-echo prompt。
2. 非交互式模式下必须使用 `--stdin`。
3. 不允许把 secret 当作第二个位置参数传入。

因此问题不在 command family 自身，而在 session shell 如何 author 这个动作。

### 4.2 session shell 当前把 `/secret` 当作普通 bridge command

当前 slash registry 会把 `/secret ...` 解析成普通 `bridgeArgv`，随后 `CliSessionShellRunner` 进入普通 pending handoff 流程，并生成：

1. `slashQuery`
2. `commandPreview`
3. `PendingCommandExecution.steps[].argv`

这条路径适合普通命令，但不适合录入真实 secret。

### 4.3 nested CLI executor 把它进一步固定为非交互 JSON 命令

`CliSessionShellEntrypointRuntime.createNestedCommandExecutor()` 当前固定使用：

1. `--output json`
2. `--no-interactive`
3. `isStdinTty=false`

即使 `/secret set <keyName>` 没带 raw secret，也无法进入安全 no-echo prompt。

### 4.4 “先让用户把 secret 输进 slash 文本，再报错”不满足安全目标

如果产品允许用户把 secret 明文打在：

```text
/secret set openai/api-key sk-...
```

那么即使后续命令失败，raw secret 也已经暴露给了 slash/composer/presenter 路径。这个路径必须在本方案中被明确拒绝，而不是被视为“只是 UX 不佳”。

## 5. 方案对比

### 5.1 方案 A：保持 bridge 不变，只提示用户改用 shell 外 `--stdin`

优点：

1. 改动最小。

问题：

1. session shell 内仍无法直接完成任务。
2. 依然鼓励用户尝试把 secret 输进 slash 文本。

结论：

1. 不推荐。

### 5.2 方案 B：允许 `/secret set <keyName> <secretValue>`

优点：

1. 表面交互最直接。

问题：

1. 与既有 `secret` contract 冲突。
2. raw secret 必然进入 slash/composer/preview 风险面。

结论：

1. 明确拒绝。

### 5.3 方案 C：显式 secure local capture + redacted local mutation handoff

做法：

1. `/secret set <keyName>` 不再走普通 `bridgeArgv` handoff。
2. shell 对该命令建立专用 secure-local 路径。
3. secret 只在本地隐藏输入 buffer 中短暂存在。
4. 提交后走本地 mutation seam 写入 secret backend。
5. transcript 只允许 redacted metadata。

结论：

1. 推荐，并作为本方案的唯一 formal scope。

## 6. 推荐架构（Phase A Only）

### 6.1 `/secret set <keyName>` 只解析为 shell-local secure action

slash registry 对 `/secret set <keyName>` 的精确命中不再生成 `bridgeArgv`，而生成一份不含 secret 的本地动作描述，例如：

```ts
{
  kind: 'secure_local_secret_capture',
  action: 'set',
  keyName: 'openai/api-key',
  displayCommand: '/secret set openai/api-key'
}
```

要求：

1. `displayCommand` 只允许包含 `keyName`，不得包含 secret value。
2. `entry.cli` 只作为实现落点，不再作为 formal target module truth。
3. formal producer / consumer 边界固定为：
   - `runtime.cli-interactive-shell`：secure local capture、前台状态机、redaction presenter
   - `runtime.governance-clients`：host-facing secret authoring UX contract 与共享 mutation seam

### 6.2 必须显式定义“提交后进入 secure capture”和“额外 suffix 预提交拦截”两条路径

本方案的核心不是“发现多余 token 后清空输入框”，而是把输入所有权切换点定义清楚。

#### 6.2.1 安全主路径

当用户提交精确命令：

```text
/secret set <keyName>
```

shell 必须按以下顺序执行：

1. 完成 slash parse，只保留 `keyName`。
2. 在同一状态迁移中清空 `composer_value`、`slash_query`、suggestion/highlight state。
3. 立即切换到 `secure_local_capture` 前台模式。
4. 从这一刻开始，后续键入或粘贴的字节只进入独立 `secureCaptureBuffer`，不再经过普通 composer/slash presenter。

也就是说，raw secret 只能发生在“已进入 secure capture 之后”的本地 buffer 中，而不能发生在 slash composer 中。

#### 6.2.2 非法 suffix 路径

当用户在 slash composer 中继续输入或粘贴：

```text
/secret set <keyName> <anything-after-key>
```

controller 必须在字符进入 presenter state 之前完成拦截：

1. `/secret set <keyName>` 一旦被识别为 secure route，后续输入事件进入 command-specific pre-commit classifier。
2. classifier 发现 `<keyName>` 后仍有额外 token 时，必须：
   - 把这次事件携带的 suffix 视为仅存在于 controller 内部的瞬时拒绝输入
   - 不把 suffix commit 到 `composer_value`
   - 不把 suffix commit 到 `slash_query`
   - 不把 suffix 写入 suggestion/highlight/preview state
3. controller 随后清空当前 slash authoring state，只保留 redacted warning，例如：
   - `Do not enter secret in slash text. Re-run /secret set <keyName> and continue in secure local capture.`

这里的关键约束是：suffix 允许被 controller 瞬时检查，但不允许进入任何 presenter-safe / audit-visible state。

### 6.3 session shell 需要一个专用 secure-local 前台状态

当前 session shell 已有：

1. `session_shell`
2. `command_palette`
3. `command_handoff_preview`
4. `command_running`

本方案补充：

1. `secure_local_capture`

同时补充输入 / 焦点语义：

1. `input_mode=secure_local`
2. `foreground_focus_target=secure_capture`

secure capture 的实现原则：

1. secret 只进入 `secureCaptureBuffer`，不得反射到 `composer_value`。
2. UI 不显示字符本身，也不显示固定长度 mask，避免长度侧信道。
3. transcript 最多只允许 redacted system notice。
4. `Esc`、取消、失败、成功都必须清理 `secureCaptureBuffer`。

### 6.4 通过本地 mutation seam 写入 secret backend，而不是复用 nested JSON CLI

`/secret set <keyName>` 不再复用：

1. `createNestedCommandExecutor()`
2. `bridgeArgv`
3. `--output json`
4. `--no-interactive`

推荐新增一条只在本地前台与共享 secret mutation path 之间存在的 seam，例如：

1. `CliSessionShellSecureSecretMutationRuntime`

职责：

1. 接收 `{ action: 'set', keyName, secretValue }`
2. 复用既有 secret backend mutation core
3. 只返回 redacted result

这样可显式守住两条边界：

1. raw secret 不进入 argv、stdout JSON、event payload
2. session shell 不复制第二套 secret backend 逻辑

### 6.5 transcript / preview / error 统一脱敏

必须写成显式约束，而不是“实现时注意”：

1. raw secret 不得写入 `composer_value`
2. raw secret 不得写入 `slash_query`
3. raw secret 不得写入 `command_preview`
4. raw secret 不得写入 `PendingCommandExecution`
5. raw secret 不得写入 transcript items
6. raw secret 不得写入 orchestration metadata
7. raw secret 不得写入 user-facing error strings 或 thrown error metadata

允许的用户可见结果只包含 redacted metadata，例如：

1. `Stored secret for secret://openai/api-key using backend os-keychain.`
2. `Cancelled secure secret input for secret://openai/api-key.`
3. `Failed to store secret for secret://openai/api-key because backend is unavailable.`

不允许出现：

1. secret 原文
2. secret 前后缀
3. secret 长度
4. 含 secret 的 command recap

## 7. Contract 影响

### 7.1 对 `contract.cli.session-shell.v1` 的影响

需要补充：

1. `shell_mode=secure_local_capture`
2. `input_mode=secure_local`
3. `foreground_focus_target=secure_capture`
4. `/secret set <keyName>` 的 pre-commit suffix interception 约束
5. secure local capture 不得产生 `bridgeArgv` / preview payload 的约束

### 7.2 对 `contract.runtime.governance-local-config-and-secret-command.v1` 的影响

本方案不改变 `secret set` 的核心安全语义，反而把它落实到 session shell：

1. raw secret 仍只能通过本地隐藏输入进入 mutation seam
2. `secret set` 仍不允许位置参数明文 secret
3. session shell 仍只是 discoverability / authoring UX，不成为 canonical truth owner

### 7.3 Formal landing 边界

本方案当前只 formalize：

1. explicit `/secret set <keyName>` secure local capture
2. redacted local mutation handoff
3. transcript / preview / error redaction baseline

本方案当前不 formalize：

1. `session.main` / skill-triggered `local_secure_input_request`
2. desktop secure dialog
3. VS Code secure prompt

这些都必须进入后续独立 follow-up，而不是在 promotion 时临时塞回当前 solution。

## 8. Deferred Follow-Up

### 8.1 Follow-Up A：service-owned secure input request

未来若要支持 “skill 触发用户本地录入 secret”，应由新的 solution 明确 formalize：

1. producer module
2. outcome contract
3. CLI / desktop / VS Code consumer boundary

当前 solution 不承担这部分 formal truth。

### 8.2 Follow-Up B：desktop / VS Code 复用 secure-local contract

未来若要扩展到 desktop / VS Code，也应由后续 solution 明确：

1. 哪个 surface 提供 secure prompt
2. 哪些 host-native affordance 可复用
3. redaction contract 如何跨表面保持一致

当前 solution 只为这些 follow-up 保留 vocabulary，不把它们并入本轮 scope。

## 9. 风险与缓解

### 9.1 风险：额外 suffix 仍先进入 presenter state 再被清空

缓解：

1. 把 suffix rejection 明确固定为 pre-commit interception。
2. secure route 一旦识别，就不允许额外 token 落到 `composer_value` / `slash_query`。

### 9.2 风险：secure capture 重新退化成 nested CLI JSON handoff

缓解：

1. formal contract 明确禁止 raw secret 经由 `bridgeArgv`、stdout JSON 或 preview payload。
2. 用独立 local mutation seam 复用共享 secret backend mutation core。

### 9.3 风险：实现时复制出第二套 secret backend 逻辑

缓解：

1. session shell 只拥有 capture + redaction，不拥有 backend-specific mutation rule。
2. 真正 mutation core 继续共享。

## 10. 验收标准

满足以下条件时，本方案可视为成立：

1. 输入 `/secret set openai/api-key` 后，shell 进入本地隐藏输入模式。
2. 后续 secret 输入只进入本地 `secureCaptureBuffer`，不进入 `composer_value` / `slash_query` / transcript。
3. 成功、失败、取消都只输出 redacted metadata。
4. 若用户在 slash 文本里输入或粘贴 `/secret set openai/api-key sk-...`，系统必须在 presenter-state commit 之前阻断 suffix，并给出 redacted warning。
5. `secret set --stdin`、standalone no-echo prompt 与 `secret import --from-env` 的既有语义保持不变。

## 11. 推荐的用户安全路径

安全路径：

```text
/secret set openai/api-key
-> shell 清空 slash/composer state
-> shell 进入 secure_local_capture
-> 用户在本地隐藏输入中录入 secret
-> local secret mutation seam 写入 backend
-> transcript 仅追加 redacted summary
```

明确拒绝的路径：

```text
/secret set openai/api-key sk-...
```

该路径必须在进入 presenter-safe state 之前被阻断并丢弃 suffix。
