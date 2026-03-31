# Structured Session Output And Markdown Content Blocks

- Status: active
- Date: 2026-03-31
- Module ID: `runtime.cli-interactive-shell`
- ADR Type: presentation / transcript rendering

## 1. Context

随着 session-first shell、Ink-owned input 与 live command progress 进入正式模块边界，新的用户体验问题开始显性化：

1. transcript 仍偏向 `label + lines[]` 的纯文本日志模型
2. assistant 回答、system notice、command recap 与 running progress 在阅读语义上没有被充分分层
3. 若继续把所有内容都当作同一种 append-only 文本，会话看起来像事件流，而不是产品级对话界面
4. 若反过来把所有实时输出都粗暴地转成 streaming Markdown，又会引入闪烁、重排与 live progress 表达失真

因此，模块需要一个正式决策来说明：

1. 什么应该继续保持结构化 presenter
2. 什么适合被渲染成 Markdown 内容块
3. running progress 与历史 transcript 应如何分层

## 2. Decision

`runtime.cli-interactive-shell` 正式接受以下 presenter 方向：

1. session shell 继续作为结构化 React/Ink shell owner
2. running progress / status / heartbeat / cancel affordance 保持在独立的 dynamic running dock 中
3. transcript item 必须支持 render-kind，而不是只允许纯文本行模型
4. assistant 完成态消息、帮助文本与 command recap 可以进入 Markdown content-block presenter path
5. `stderr-only` live shell 与最终 `stdout` machine-readable contract 继续保持不变

更具体地说，推荐的 transcript render-kind 最少包括：

1. `plain_text`
2. `markdown`
3. `system_notice`
4. `command_recap`

## 3. Why

### 3.1 社区实践一致支持“结构化壳层 + 富内容块”

终端 UI 社区中，`Ink`、`Textual` 与 `Rich` 的成熟实践都指向类似分层：

1. append-only 历史区
2. 动态状态区
3. 富文本阅读区

它们并不鼓励把所有实时输出都强行塞进同一种文本流里。

### 3.2 Markdown 更适合完成态阅读，不适合高频运行态

assistant 最终回答、帮助文本与 recap 属于“阅读态”内容：

1. 需要标题、列表、代码块与引用
2. 变化频率低
3. 更适合在 turn 完成后稳定呈现

而 running progress 属于“操作态”内容：

1. 变化频率高
2. 需要 heartbeat / elapsed / cancel 语义
3. 若强行 Markdown 化，只会放大重排和闪烁问题

### 3.3 这项决策必须兼容 future desktop

CLI 与 future desktop 都消费同一份 session DTO / transcript 语义。

因此这里 formalize 的不是某个具体库，而是更高层的 presenter contract：

1. transcript item 需要 render-kind
2. live progress 需要与历史区分层
3. Markdown 是一种允许的阅读态 presenter，而不是 canonical session truth

## 4. Consequences

### 4.1 允许的事情

1. 在 transcript presenter 层为 assistant 完成态消息引入 Markdown renderer
2. 为 command recap / system notice 使用与普通消息不同的视觉组件
3. 将 running progress 固定到 transcript 外的 dock / panel
4. 在 presenter 本地从 canonical session event 派生 render-kind

### 4.2 不允许的事情

1. 把 running progress 退化成无限追加 transcript 行
2. 让 Markdown renderer 改写 `json/plain` 或 non-interactive 输出 contract
3. 让 CLI presenter 成为 canonical session owner
4. 因为需要 Markdown 就复制第二套 desktop/CLI session state

### 4.3 Rollout Truth

本 ADR 只 formalize accepted direction。

它不声明以下内容已经自动完成：

1. transcript render-kind 已在代码面全面落地
2. assistant markdown renderer 已稳定接入
3. batching / max-fps / incremental rendering 策略已完成性能验证

这些 follow-up 应由真实 implementation sprint 承接。

## 5. Follow-Up

后续实现窗口至少应覆盖：

1. transcript item contract 从 `lines[]` 升级为 render-kind 驱动
2. transcript pane 分拆为 plain / markdown / notice / recap renderer
3. assistant markdown rendering 与 relevant regression coverage
4. 必要时再增加 batching / performance tuning
