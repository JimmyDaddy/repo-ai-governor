# CLI UX 技术方案

- Status: draft
- Date: 2026-03-13
- Scope: `mvp / sprint-001`
- Related Task: `TK-003`

## 1. 背景

当前仓库已经有一个最小可运行的 CLI 骨架，但命令体验仍然偏“工程内部可用”：

1. 参数解析和帮助输出是自维护实现，可控但不够优雅。
2. 错误提示、交互体验、进度展示、彩色输出还没有统一抽象。
3. 后续 `init`、`doctor`、`plan`、`check`、`review` 会快速增加复杂度，如果继续手写 CLI 基础设施，维护成本会明显上升。

因此，MVP 更合适的方向不是继续自己造轮子，而是基于成熟 CLI 工具做二次封装。

## 2. 目标

希望新的命令行层同时满足以下要求：

1. 帮助信息更美观，默认就能生成高质量 `--help`。
2. 错误提示更友好，最好支持拼写建议和错误后补充帮助。
3. 交互式命令更自然，适合 `init` / `doctor --fix` 这类场景。
4. 非交互模式仍然稳定，适合 AI Agent 和 CI。
5. 可以平滑接入当前仓库，不要求一次性重构成大型 CLI 框架。
6. 后续支持中英文、本地文件输出、JSON 输出和状态化任务记录。

## 3. 候选工具列表

### 3.1 Commander.js

定位：最成熟、最稳妥的 Node.js CLI 基础库。

优点：

1. 官方 README 明确支持自动帮助、子命令、`addHelpText()`、`showHelpAfterError()`、`showSuggestionAfterError()`、`Help Groups`、`configureHelp()`、`configureOutput()`，非常适合做“更优雅友好”的命令体验。
2. API 直观，和当前仓库已经写出来的“命令注册表”模型非常接近，迁移成本最低。
3. 社区规模很大，生态稳定，适合做本项目的长期基础层。

注意点：

1. npm 当前 `commander` 14.x 官方页面要求 Node `>=20`。
2. 当前仓库本地约束是 Node `>=18`，所以如果不升 Node 基线，建议先使用 `Commander 13.x` 线；如果后面统一升到 Node 20，再切到 14.x。

适配结论：

1. 这是当前项目的首选。

### 3.2 oclif

定位：更完整的 CLI 框架，不只是参数解析。

优点：

1. 官方站点强调它是一个完整的 Open CLI Framework，支持脚手架、自动文档、插件扩展。
2. `@oclif/core` 4.x 已发布，官方 guides 中直接提供 themes、user experience、JSON、flag inheritance、plugin、testing 等能力。
3. 如果未来要做“插件生态”“自动补全”“独立命令包”“大型 CLI 产品”，它的上限更高。

注意点：

1. 对当前仓库来说偏重，需要按它的工程结构组织命令。
2. 迁移不是“替换解析器”，而是“换一套 CLI 应用框架”，重构成本更高。

适配结论：

1. 适合作为中长期备选，不适合现在立刻切。

### 3.3 Clipanion

定位：类型安全、状态机化的 CLI 框架。

优点：

1. 官方文档强调类型安全、无运行时依赖、嵌套命令、透明 option proxying、自动生成好看的 help。
2. 比 Commander 更“框架化”，比 oclif 更轻。
3. 对 TypeScript 友好，命令类模型也比较清晰。

注意点：

1. npm 当前可见版本仍然偏 RC / 过渡态，稳定性心智不如 Commander 和 oclif。
2. 生态规模和社区心智不如 Commander。

适配结论：

1. 技术上可行，但不建议作为 MVP 主选型。

## 4. 配套 UX 工具推荐

### 4.1 `@inquirer/prompts`

用途：

1. 做 `init`、`doctor --fix`、后续风险确认点的交互式提问。

理由：

1. 官方页面提供 `input`、`select`、`checkbox`、`confirm`、`password`、`editor` 等现成 prompt。
2. 已经是现代 Inquirer 拆分后的轻量形态，适合按需引入。

注意点：

1. 官方文档明确说明非交互 shell 下不能直接运行，需要 TTY 检测或回退逻辑。

### 4.2 `listr2`

用途：

1. 做 `init`、`doctor`、`check` 这类多步骤执行时的进度界面。

理由：

1. 官方包描述就是“Create beautiful CLI interfaces via easy and logical to-implement task lists that feel alive and interactive.”
2. 很适合把“读取配置 -> 校验环境 -> 写文件 -> 输出摘要”这类流程变得更清楚。

### 4.3 `yoctocolors`

用途：

1. 给帮助、错误、警告、成功状态加统一色彩层。

理由：

1. 官方页面强调 tiny、fast、zero dependencies、actively maintained。
2. 比较适合本项目这种“想要好看，但不想引入太重颜色层”的场景。

### 4.4 `terminal-link`

用途：

1. 在支持的终端里把文档、报告、产物路径渲染成可点击链接。

理由：

1. 官方页面支持 fallback，在不支持的终端中也会优雅降级成纯文本 URL。

### 4.5 `cli-table3`（可选）

用途：

1. 在 `doctor`、`check`、`report` 里做对齐良好的表格输出。

理由：

1. 功能成熟，支持 Unicode 表格、对齐、换行、颜色处理。

注意点：

1. 可以晚一点引入，不是 MVP CLI 美化的第一优先级。

## 5. 推荐方案

### 5.1 当前推荐

推荐采用这组组合：

1. `Commander 13.x` 作为命令注册与解析主框架
2. `@inquirer/prompts` 作为交互层
3. `listr2` 作为任务进度层
4. `yoctocolors` 作为轻量颜色层
5. `terminal-link` 作为终端链接层
6. `cli-table3` 作为可选表格层

版本策略：

1. 以当前仓库的 Node `>=18` 为前提选择兼容版本线。
2. `Commander` 明确锁定 `13.x` 线，等 Node 基线升级到 20 后再考虑切到 `14.x`。
3. 其余依赖优先选择“当前仍在维护且兼容 Node 18”的稳定版本线，不追求无必要的最新大版本。

### 5.2 不推荐当前就上的方案

1. 不建议现在直接切 `oclif`
原因：收益主要在插件体系和大型 CLI 产品化，但当前项目仍处于 MVP 底座阶段，重构成本过高。
2. 不建议现在主选 `Clipanion`
原因：思路很好，但对当前项目来说收益不如 Commander 明显，稳定性心智也稍弱。

### 5.3 一句话结论

如果目标是“这周就把 CLI 做得更好看、更友好，并且不打断当前开发节奏”，最佳选择是：

`Commander 13.x + @inquirer/prompts + listr2 + yoctocolors + terminal-link`

## 6. 对当前仓库的落地方案

### 6.1 代码结构建议

建议把当前 `src/cli/` 继续演进为以下结构：

```text
src/
  cli/
    app.js
    index.js
    command-registry.js
    commands/
      init.js
      doctor.js
      plan.js
      check.js
      review.js
      review-verify.js
      report.js
      upgrade.js
    runtime/
      context.js
      exit-codes.js
      errors.js
    ui/
      help.js
      logger.js
      theme.js
      prompts.js
      progress.js
      tables.js
```

### 6.2 分层职责

1. `Commander`
   - 负责命令树、参数、帮助、suggestion、help groups
2. `runtime/*`
   - 负责命令上下文、错误对象、退出码、TTY 检测
3. `ui/logger.js`
   - 负责 success / info / warn / error 语义输出
4. `ui/prompts.js`
   - 只在交互模式下调用 `@inquirer/prompts`
5. `ui/progress.js`
   - 基于 `listr2` 包装多步骤执行
6. `ui/theme.js`
   - 基于 `yoctocolors` 统一颜色
7. `ui/tables.js`
   - 基于 `cli-table3` 输出 `doctor` / `check` 摘要表

### 6.3 UX 规则

1. 所有命令默认支持 `--help`、`--version`、`--format`、`--non-interactive`、`--dry-run`
2. 出错时默认显示短错误 + 建议；复杂错误场景显示 `showHelpAfterError()`
3. 拼写错误时开启 suggestion
4. `init` 在交互终端中进入 prompt 模式；CI 或 Agent 默认走非交互参数模式
5. summary 输出保持简洁；`--format json` 保证机器可消费
6. 终端支持链接时，结果页输出可点击文档路径和报告路径

## 7. 迁移路径

### Phase 1：替换命令解析层

目标：

1. 保留现有命令定义
2. 用 Commander 接管参数解析、帮助输出和错误提示

范围：

1. `src/cli/command-registry.js` 从“纯配置”升级为 Commander 命令构建器
2. `src/cli/parse-args.js` 逐步移除
3. `src/cli/render-help.js` 改为只保留少量定制文案和主题层

### Phase 2：统一输出和错误模型

目标：

1. 落地 `TK-003`

范围：

1. 统一 logger
2. 统一 exit codes
3. 统一 stderr / stdout 策略
4. 对 help、usage error、business error 分层处理

### Phase 3：增强交互体验

目标：

1. 先增强 `init` 和 `doctor`

范围：

1. 引入 `@inquirer/prompts`
2. 引入 `listr2`
3. 在非 TTY 模式自动降级

### Phase 4：增强结果展示

目标：

1. 提升 `check`、`review`、`report` 可读性

范围：

1. 引入 `yoctocolors`
2. 引入 `terminal-link`
3. 视需要引入 `cli-table3`

## 8. 风险与取舍

1. 如果现在直接上 `oclif`，长期上限更高，但会显著拖慢当前 sprint。
2. 如果继续完全手写 CLI，短期最自由，但后续帮助、错误、交互、主题和测试都会越来越散。
3. `@inquirer/prompts` 必须和 TTY 检测一起用，不能默认在 CI / Agent 下强开。
4. `Commander 14.x` 需要 Node 20，而当前仓库已经声明 Node `>=18`，所以近期更现实的选择是 `13.x` 线。

## 9. 最终建议

本项目当前阶段建议采用：

1. `Commander 13.x` 作为主 CLI 框架
2. 在 `TK-003` 中补齐 logger / exit code / theme 抽象
3. 在 `TK-104` 和 `TK-105` 中接入 `@inquirer/prompts` 与 `listr2`
4. 在 `TK-206` / `TK-207` 阶段再决定是否引入 `cli-table3`
5. `oclif` 保留为未来平台化或插件化阶段的升级路线

## 10. 参考资料

1. [Commander npm](https://www.npmjs.com/package/commander)
2. [Commander GitHub README](https://github.com/tj/commander.js)
3. [oclif 官方主页](https://oclif.io/)
4. [oclif API Reference](https://oclif.io/docs/api_reference)
5. [oclif Guides](https://oclif.io/docs/guides)
6. [Clipanion GitHub](https://github.com/arcanis/clipanion)
7. [Clipanion 文档](https://mael.dev/clipanion/)
8. [clipanion npm](https://www.npmjs.com/package/clipanion)
9. [@inquirer/prompts npm](https://npm.io/package/%40inquirer/prompts)
10. [listr2 npm](https://www.npmjs.com/package/listr2)
11. [yoctocolors npm](https://www.npmjs.com/package/yoctocolors)
12. [terminal-link npm](https://www.npmjs.com/package/terminal-link)
13. [cli-table3 npm](https://www.npmjs.com/package/cli-table3)
