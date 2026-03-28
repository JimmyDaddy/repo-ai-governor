# 交互式 CLI（点选 + 输入）实现方案调研总结（Draft）

- Status: draft
- Date: 2026-03-28
- Scope: CLI UX / local adoption / interactive configuration
- Related:
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
  - `.repo-ai-governor/draft/interactive-cli-l3-deep-mouse-tui-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/commands/init-command.ts`

## 1. 目标与问题定义

目标不是“把命令行做成 GUI”，而是在终端里达到以下体验：

1. 可输入（文本、密码、多行、模糊搜索）。
2. 可点选（单选、多选、列表导航，必要时支持鼠标点击）。
3. 对自动化友好（CI/脚本必须可稳定关闭交互，保持机器可读输出）。

这类能力可参考 Claude Code / OpenClaw 的交互实践，但需结合本仓库当前 Node.js + TypeScript + Commander 架构落地。

## 2. 从现有产品提炼的交互基线

## 2.1 Claude Code 可借鉴点

从官方 Interactive Mode 文档可以提炼出几条关键基线：

1. 交互入口统一：`/`（命令/技能）、`!`（bash 模式）、`@`（文件补全）。
2. 交互能力是“输入层能力”而不是“业务命令能力”：历史检索、快捷键、多行输入、背景任务等都属于输入层。
3. 终端差异是现实约束：快捷键会因平台和终端而不同。
4. 自动化场景要显式降级：例如某些建议能力在 non-interactive mode 会跳过。

这说明交互式 CLI 的核心不是“某个 prompt 组件”，而是“输入运行时 + 业务命令”的分层设计。

## 2.2 OpenClaw 可借鉴点

OpenClaw 的 exec 工具明确强调：

1. 某些 CLI 只有在 TTY 才输出，需要 `pty: true`。
2. 非交互上下文下可能“退出码 0 但没有输出”。
3. `timeout/background/approval` 这类运行时控制要和交互能力并行设计。

这对我们意味着：若未来要让本工具驱动其他仓库自动开发，交互层和执行层都必须具备“TTY/PTY 感知 + 非交互退化”能力。

## 3. 可选技术路线（按复杂度分层）

## 3.1 L1：Prompt 层交互（最小改造）

适用：初始化向导、单命令问答流、轻量选择器。

候选：

1. `@inquirer/prompts`（Node 生态最常见，输入/选择成熟）。
2. `gum`（Shell 级快速拼装：`choose/filter/input/file`）。

优点：

1. 接入快，和现有 Commander 架构兼容。
2. 对“首次配置向导”场景非常契合。

限制：

1. 主要是键盘交互，不是完整多面板 TUI。
2. 鼠标点选支持受限（取决于终端与组件库能力）。

## 3.2 L2：组件化 TUI（中等改造）

适用：命令面板、任务队列、状态区 + 输入区、分步执行看板。

候选：

1. `Ink`（React for CLI）。
2. `@inkjs/ui`（`TextInput`/`Select`/`MultiSelect`/`ConfirmInput` 等组件）。

优点：

1. 结构化 UI 能力强，适合“像 IDE 里小终端应用”的体验。
2. 与 TypeScript/React 思维一致，团队上手相对平滑。

限制：

1. 架构复杂度显著提升，需要维护渲染循环和状态边界。
2. 需要额外定义“交互会话状态机”，避免命令逻辑耦合进渲染层。

## 3.3 L3：深度鼠标事件 TUI（高复杂）

适用：明确要求“鼠标可点按钮/列表/区域”，并接受更高复杂度。

候选（跨语言参考）：

1. Node: `blessed`（表单、列表、鼠标事件）。
2. Go: `Bubble Tea`（官方强调高保真键鼠处理；有 Bubbles 组件库）。
3. Python: `Textual`（明确的 MouseMove/Click/Scroll/Capture 事件模型）。

优点：

1. 鼠标交互能力更完整。
2. 可实现更“应用化”的终端体验。

限制：

1. 终端兼容差异更明显（不同终端/系统对鼠标协议支持不同）。
2. 测试、可维护性、跨平台一致性成本最高。

## 4. 候选 TUI 工具与生态成熟度（联网更新时间：2026-03-28）

## 4.1 快速结论

1. 如果坚持 Node.js + TypeScript 单仓落地，`Ink + @inkjs/ui` 最适合 L2，“现代 React 风格 CLI” 基本就是以这种范式为代表。
2. 如果坚持 Node.js 且目标是 L3 深度鼠标事件 TUI，`blessed / neo-blessed` 与 `terminal-kit` 比 `Ink` 更贴近需求。
3. 如果允许把 UI 单独用其他语言实现，`Bubble Tea`（Go）与 `Textual`（Python）是当前最成熟、生态最完整的两条路线。
4. `Ratatui`（Rust）也很强，但更像“高性能基础设施型 TUI 库”，不是最快速的人机交互原型路线。

## 4.2 对比表（结论版）

| 技术 | 语言 | 更适合的层级 | 鼠标/深度交互 | 组件与生态 | 截至 2026-03-28 的公开信号 | 对本仓库判断 |
|---|---|---|---|---|---|---|
| `Ink` | Node / TS | L2 | 官方文档重点在 `useInput` / `useFocus` / `usePaste` 这类键盘与焦点能力 | React 组件、Flexbox、testing、examples、组件扩展 | GitHub `35.8k` stars；README 列出 Claude Code、Gemini CLI、GitHub Copilot CLI、Wrangler 等实际使用者 | 最适合“现代 React 风格 CLI”，不适合作为首选 L3 鼠标内核 |
| `@inkjs/ui` | Node / TS | L1-L2 | 以输入框、选择器、多选等高层组件为主 | `TextInput` / `PasswordInput` / `Select` / `MultiSelect` 等现成组件 | GitHub `2k` stars | 最适合作为向导壳层与表单化 CLI 组件库 |
| `blessed` | Node / JS | L3 | 支持 `mousedown` / `mouseup` / `wheel` / `mousemove` / `click` | 表单、按钮、列表、表格、进度条等部件齐全 | GitHub `11.8k` stars；README 自带丰富 widgets；FAQ 明确写出终端兼容限制 | Node 侧最贴近“深度鼠标事件 TUI”的老牌选择 |
| `neo-blessed` | Node / JS | L3 | 继承 `blessed` 模型 | 延续 blessed 生态 | 社区资料将其定位为 blessed 的带修复维护 fork | 如果选择 blessed 路线，值得优先调研 fork 状态 |
| `terminal-kit` | Node / JS | L3 | 官方明确支持 mouse，且有 document model | input field、menu、grid/table、buffer、surface 能力较强 | GitHub `3.4k` stars、`7.5k` used by | 更像“底层终端应用工具箱”，适合追求控制力，但工程抽象需要自己补 |
| `Bubble Tea + Bubbles` | Go | L3 | 官方强调 high-fidelity keyboard and mouse handling | `textinput` / `textarea` / `table` / `viewport` / `list` 等组件丰富，周边还有 `Lip Gloss` / `BubbleZone` | `Bubble Tea` GitHub `41k` stars；`Bubbles` `8.1k` stars | 如果接受跨语言，这是深度 TUI 的第一候选 |
| `Textual` | Python | L2-L3 | 官方有清晰的 `MouseMove` / `MouseScrollDown` / `MouseCapture` 事件体系 | widgets 很全，含 `Button` / `DataTable` / `Input` / `ListView` / command palette / testing / web serve | GitHub `35.1k` stars，`215` releases，latest `2026-03-27` | 如果追求“应用感”与开发效率，是最强的 app-style TUI 方案之一 |
| `Ratatui` | Rust | L3 | 官方有 mouse capture/backends 文档 | widgets、templates、recipes、ecosystem、examples 全 | 官网标注 `19.4k` GitHub stars、`3100+` crates | 性能与原生交付优秀，但对本仓库当前 TS 栈来说集成成本更高 |

## 4.3 Node / TypeScript 生态判断

1. `Ink` 最大优势不是鼠标，而是“React 风格组件化 CLI 开发体验”。
2. `@inkjs/ui` 让表单化、选择器化体验很快成型，适合 `init/connect/workspace` 这类向导。
3. `blessed` 的优势在于 widget 密度与鼠标事件模型更贴近传统 TUI。
4. `terminal-kit` 的优势在于终端控制能力更底层、更全，但应用级生态弱于 `Ink` 的现代 CLI 心智与 `blessed` 的传统 TUI 心智。
5. 因此，如果目标是“让用户更舒服地配置”，Node 生态首选仍然是 `Ink + @inkjs/ui`；如果目标是“做一个鼠标可点的全屏 TUI”，Node 生态首选应转向 `blessed / neo-blessed` 或 `terminal-kit`。

## 4.4 非 Node 生态判断

1. Go 的 `Bubble Tea` 现在已经不只是一个库，而是配套了 `Bubbles`、`Lip Gloss`、`BubbleZone` 等较完整的 Charmbracelet 生态，适合做“终端里的产品级应用”。
2. Python 的 `Textual` 不只提供 widgets，还把 testing、command palette、dev console、web serve 一并做了，整体更像“终端应用框架”。
3. Rust 的 `Ratatui` 生态也很强，但更偏系统级、原生交付和性能导向；如果团队不是 Rust 主栈，前期迭代速度一般不如 `Bubble Tea` 或 `Textual`。

## 5. 推荐给本仓库的落地路线

结合当前代码基线（Node/TS CLI + `pretty/plain/json` 输出契约），建议采用“三阶段递进”：

## 阶段 A（立即可做，低风险）

1. 保持当前“默认交互 + `--no-interactive`”策略。
2. 将 `init/connect/upgrade/workspace` 的问答统一封装成 `InteractiveSession`（而不是散落在命令内部）。
3. 约束：仅在 `isTty && output=pretty && interactive=true` 下启用；否则严格非交互。

## 阶段 B（增强体验，中风险）

1. 引入 `Ink + @inkjs/ui` 做“向导壳层”（左侧步骤、右侧表单、底部快捷键提示）。
2. 命令逻辑继续保留在现有 runtime，不把业务编排塞进 UI 组件。
3. 新增 `--ui`（实验）开关，默认仍可回退到普通 prompt，确保发布可控。

## 阶段 C（鼠标优先，高风险）

1. 如确有“必须点选”需求，再进入鼠标事件模型（Blessed/其他）。
2. 先做单命令 PoC（如 `init`），验证终端兼容矩阵后再扩展。
3. 明确“鼠标不可用时的键盘等价路径”作为硬性要求。

额外建议：

1. 如果只是在当前仓库内交付最快结果，优先走 Node 路线。
2. 如果未来 `ui` 要变成独立产品面，或者要追求更强的深度交互体验，应重新比较 `Bubble Tea` 与 `Textual`。

## 6. 如果要用其他语言的工具，好做么？

以下判断是“结合本仓库现状 + 外部框架能力”得出的工程推断，不是外部文档直接结论。

## 6.1 简短回答

1. 可以做。
2. “做一个独立 UI 子系统”不算特别难。
3. “把现有 Node CLI 整体跨语言重写”不划算。

## 6.2 哪种跨语言方式最合理

最合理的是“保留现有 Node runtime / governance / output contract，把新 UI 当成独立前端壳层”：

1. Node CLI 继续作为自动化契约入口，保持 `pretty/plain/json`、`--no-interactive`、现有命令语义不变。
2. 其他语言实现的 UI 只负责界面、事件处理、表单与焦点。
3. UI 与当前 CLI/runtime 之间用稳定协议桥接，例如 `stdin/stdout` JSON、子进程 exit code、结构化 command result。

不建议的方式：

1. 把治理 runtime 复制一份到新语言里。
2. 让 UI 直接绕过当前 CLI 规则去操作仓库。
3. 在第一阶段同时重写命令语义、输出 schema 和交互层。

## 6.3 语言选择判断

1. Go + `Bubble Tea`
   - 最适合做跨语言独立 `ui` 子命令。
   - 原因：交付形态天然是单二进制，深度 TUI 生态强，和“本仓库继续保持 Node runtime”并不冲突。
2. Python + `Textual`
   - 最适合快速验证复杂交互体验。
   - 原因：widgets、事件、调试、测试、web serve 都成熟，但对安装分发和运行时前置条件更敏感。
3. Rust + `Ratatui`
   - 最适合追求原生性能、可分发性和长期独立产品化。
   - 代价：桥接开发、迭代效率、团队上手成本都更高。

## 6.4 对本仓库的结论

1. 如果目标是 1-2 个迭代内做出可用原型，继续 Node 最顺。
2. 如果目标是把 `ui` 做成长期独立 surface，且接受单独打包，Go 是最值得认真评估的跨语言路线。
3. Python 适合验证产品体验，不一定适合成为当前仓库的第一正式交付形态。

## 7. 什么是“现代 React 风格 CLI”？

## 7.1 定义

这里的“现代 React 风格 CLI”不是指“命令行里能跑 React”，而是指：

1. 用 React 组件树来描述终端 UI。
2. 用 state / props / hooks 驱动重渲染，而不是手写大量 `stdout.write()`、cursor move 和 imperative redraw。
3. 用声明式布局来组织界面，例如 `Ink` 的 Flexbox/Yoga 模型。
4. 把输入、焦点、路由、异步任务、测试都纳入组件化心智，而不是散落在命令处理函数里。

从官方资料看，`Ink` 正是这一路线的代表：它把自己定义为 “React for CLIs”，提供 `useInput`、`useFocus`、`usePaste`、testing、React Devtools 支持和一批 examples。

## 7.2 样例

官方和官方仓库里能直接看到这些样例：

1. `Ink` README 自带最小 `Counter` 示例，展示 React state 驱动 CLI 重渲染。
2. `Ink` examples 包含 `Jest UI`、`Table`、`Router`、`Focus management`、`User input`。
3. `@inkjs/ui` 提供 `TextInput`、`PasswordInput`、`Select`、`MultiSelect` 这类可直接搭向导和表单的组件。
4. `Ink` README 的 “Who’s Using Ink?” 里列出了 Claude Code、Gemini CLI、GitHub Copilot CLI、Cloudflare Wrangler 等案例。

## 7.3 它和 TUI 的区别是什么

最核心的区别是：React 风格 CLI 是“开发范式”，TUI 是“交互形态”。

| 维度 | Prompt 式 CLI | React 风格 CLI | 深度 TUI |
|---|---|---|---|
| 关注点 | 一问一答、顺序流程 | 组件树、状态、布局、焦点、组合 | 面板、鼠标、滚动、拖拽、全屏应用感 |
| 典型技术 | `readline`、`inquirer` | `Ink`、`@inkjs/ui` | `blessed`、`terminal-kit`、`Bubble Tea`、`Textual`、`Ratatui` |
| 常见交互 | 输入、确认、单选 | 键盘导航、表单、列表、局部刷新 | 鼠标命中、滚轮、视口、多面板、复杂事件 |
| 与本仓库关系 | 适合 L1 | 适合 L2 | 适合 L3 |

进一步说：

1. 很多 React 风格 CLI 本身也是 TUI。
2. 但它们往往偏“键盘驱动、组件化、布局化”的 TUI，而不是“重鼠标、重面板命中测试”的深度 TUI。
3. 所以 `Ink` 很适合做现代交互式 CLI，不一定最适合做你想要的 L3 深度鼠标事件 TUI。

## 8. 实施时必须固化的工程约束

1. 交互与自动化双轨：
   - 交互轨：human-first（pretty + TTY）。
   - 自动化轨：machine-first（json/plain + no-interactive）。
2. 原始输入控制：
   - Prompt 库接管 stdin 时，注意 raw mode 与 TTY 检测。
3. PTY 语义：
   - 对 TTY-only 命令保留 PTY 能力预留，不可假设 stdout 恒可读。
4. 会话可中断：
   - 每步都应支持 cancel/back/timeout，避免卡死。
5. 可测试性：
   - 单元测试：状态机与选项解析。
   - 集成测试：TTY / 非 TTY、`--no-interactive`、JSON 输出稳定性。

## 9. 方案对比（结论版）

1. 如果目标是“更人性化配置”，L1 就够，成本最低、收益最快。
2. 如果目标是“像工具内置控制台一样的交互体验”，进入 L2（Ink）。
3. 如果目标是“真的可点可拖可滚动”，才进入 L3，但要接受高维护成本。

当前建议：先把 L1 做到统一、稳定、可测，再以 `--ui` 实验能力推进 L2。

## 9.1 明确推荐

如果必须在“React 风格 CLI”和“深度 TUI”之间二选一，针对本仓库当前阶段，我更推荐先做 React 风格 CLI，再把深度 TUI 作为第二阶段实验能力。

原因：

1. 当前最紧迫的问题是“让初始化和配置更人性化”，不是立刻把 CLI 变成一个全屏终端应用。
2. 本仓库当前主栈是 Node.js + TypeScript，`Ink + @inkjs/ui` 与现有命令和 runtime 的桥接成本更低。
3. 对既有自动化契约（`pretty/plain/json`、`--no-interactive`）的扰动更小，更容易维持脚本、CI 与集成稳定性。
4. 测试、维护、跨终端兼容与团队上手成本都明显低于一步到位做 L3 深度鼠标事件 TUI。

但如果产品目标被明确改成“默认入口就必须是鼠标优先、面板式、可滚轮/拖拽/点击命中的终端应用”，那就不应继续停留在 React 风格 CLI，而应直接进入深度 TUI 路线。

补充判断：

1. 如果未来确认默认入口要升级为“现代 React 风格 CLI”，`Ink + @inkjs/ui` 是最自然的下一步。
2. 如果默认入口最终要升级为“深度鼠标事件 TUI”，应优先做 L3 `init` PoC，再决定是否继续 Node，还是把 `ui` 独立到 Go/Python。

## 10. 建议的下一步任务（可直接排期）

1. 新建 `interactive-session` 抽象（统一输入、验证、取消、中断）。
2. 将 `init` 现有问答迁移到抽象层，并复用到 `connect/upgrade`。
3. 增加 `interactive` 相关契约测试：
   - TTY+pretty 默认开启。
   - `--no-interactive` 强制关闭。
   - 非 TTY 自动关闭。
4. 增加 `--ui` 实验开关并做最小 Ink PoC（仅 `init`）。
5. 并行做一个 L3 技术 spike：
   - Node 路线：`blessed/neo-blessed` 或 `terminal-kit`
   - 跨语言路线：`Bubble Tea`
6. 在 PoC 后用同一份评估表比较：
   - 鼠标命中精度
   - 终端兼容性
   - 与现有 runtime 的桥接成本
   - 自动化契约保留成本
   - 测试可写性

## 11. 参考资料（联网调研）

1. Claude Code Interactive Mode（快捷键、命令入口、non-interactive 跳过建议等）  
   https://code.claude.com/docs/en/interactive-mode
2. OpenClaw Exec Tool（PTY、TTY-only CLI、timeout/background 参数）  
   https://openclawlab.com/en/docs/tools/exec/
3. Inquirer.js（Node 交互 prompts、raw mode/TTY 注意事项）  
   https://github.com/SBoudrias/Inquirer.js
4. Ink（React CLI 渲染器，`useInput` 键盘输入处理）  
   https://github.com/vadimdemedes/ink
5. @inkjs/ui（TextInput/Select/MultiSelect 等现成组件）  
   https://github.com/vadimdemedes/ink-ui
6. Bubble Tea（Go TUI，键鼠事件能力与组件生态）  
   https://github.com/charmbracelet/bubbletea
7. Gum（Shell 级 `choose/filter/input/file` 交互组件）  
   https://github.com/charmbracelet/gum
8. Textual Input Guide（MouseMove/Click/Scroll/Capture 事件模型）  
   https://textual.textualize.io/guide/input/
9. prompt_toolkit prompts（`mouse_support=True`、自动补全/历史等）  
   https://python-prompt-toolkit.readthedocs.io/en/stable/pages/asking_for_input.html
10. Blessed（Node 终端 UI，mouse 事件与组件族）  
    https://github.com/chjj/blessed
11. Ink（官方 README：React for CLIs、Flexbox、hooks、testing、examples、Who’s Using Ink）  
    https://github.com/vadimdemedes/ink
12. Ink UI（官方 README：`TextInput` / `PasswordInput` / `Select` / `MultiSelect`）  
    https://github.com/vadimdemedes/ink-ui
13. Terminal Kit（官方 README：document model、mouse support、input/menu/grid）  
    https://github.com/cronvel/terminal-kit
14. Bubble Tea（官方 README：high-fidelity keyboard and mouse handling、Bubbles/Lip Gloss/BubbleZone 生态）  
    https://github.com/charmbracelet/bubbletea
15. Bubbles（官方 README：`list` / `table` / `textarea` / `textinput` / `viewport` 组件）  
    https://github.com/charmbracelet/bubbles
16. Textual（官方 README / docs：widgets、mouse events、command palette、testing、web serve）  
    https://github.com/Textualize/textual  
    https://textual.textualize.io/guide/input/  
    https://textual.textualize.io/widgets/
17. Ratatui（官网：rich terminal UIs、widgets、mouse capture、templates、ecosystem）  
    https://ratatui.rs/  
    https://ratatui.rs/concepts/backends/mouse-capture/
18. neo-blessed（社区维护 fork 调研入口）  
    https://github.com/Rich-Harris/neo-blessed
