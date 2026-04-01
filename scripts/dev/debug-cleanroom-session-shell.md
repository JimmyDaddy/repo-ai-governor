# Debug Cleanroom Session Shell

这个脚本用于把 `repo-ai-governor` 安装到一个临时 cleanroom 项目里，并直接拉起真实的交互式 session shell。

对应脚本：
- [debug-cleanroom-session-shell.js](/Users/jimmydaddy/study/ai-governor/scripts/dev/debug-cleanroom-session-shell.js)

对应 package scripts：
- `pnpm run debug:cleanroom-session-shell`
- `pnpm run debug:cleanroom-session-shell:path`

## 适用场景

这个脚本适合验证这些“只有交互模式里才容易暴露”的问题：

- 自由对话是否能正常派发
- slash command 与 `/confirm` 流程
- 实时活动和流式输出
- 输入框、快捷键、历史记录
- session 自动恢复
- 在真实 adopter 项目上的前台交互行为

它和现有的 `release:verify-cleanroom-local-install` 不同：

- `release` cleanroom 主要验证非交互 CLI 命令链
- `debug` cleanroom 会继承当前 TTY，真正启动 `--output pretty` 的交互式会话壳层

## 默认行为

直接运行：

```bash
pnpm run debug:cleanroom-session-shell
```

脚本会自动：

1. 在系统临时目录下创建一个 cleanroom 目标项目
2. 写入 `repo_local` 模式的 `.repo-ai-governor/governor.yaml`
3. 将当前工作区里的 `repo-ai-governor` 以 `link:` 方式安装进 cleanroom
4. 启动真实的 `repo-ai-governor --output pretty`

这样做的目的：

- 保留你当前机器上已经存在的 `codex / claude-code / github-copilot` 登录态
- 把治理产物隔离到临时目录，不污染主工作区或真实 adopter 项目

## 常用用法

### 1. 直接进入交互式 shell

```bash
pnpm run debug:cleanroom-session-shell
```

### 2. 启动后立即发送一条首消息

```bash
pnpm run debug:cleanroom-session-shell -- --message "你好"
```

### 3. 用 `path` 安装当前仓库，而不是 `link`

```bash
pnpm run debug:cleanroom-session-shell:path -- --message "帮我 review 代码"
```

### 4. 把真实 adopter 项目复制到 cleanroom 再启动

```bash
pnpm run debug:cleanroom-session-shell -- --seed-from /Users/jimmydaddy/study/playground --message "帮我 cr 代码"
```

这条命令特别适合复现“只在真实项目里出现”的问题。

## `--seed-from <path>`

`--seed-from` 会先把一个真实项目目录复制到 cleanroom 目标目录，然后再安装当前工作区里的 governor 包。

### 语义

- 复制源项目文件到临时 cleanroom 目录
- 保留源项目本身不变，不会在源目录里执行安装或写入
- 复制完成后，cleanroom 内会被强制写入 `repo_local` 的 `.repo-ai-governor/governor.yaml`
- 然后再执行：

```bash
pnpm add --save-exact link:/path/to/current/repo-ai-governor
```

或 `path` 安装模式对应的本地路径安装

### 默认跳过的目录

为了减少调试准备时间，脚本不会复制这些高成本临时目录：

- `.git`
- `node_modules`
- `dist`
- `coverage`
- `.turbo`
- `.next`
- `.DS_Store`

这意味着：

- 你可以复现真实项目源码、配置、`.repo-ai-governor` 状态
- 但不会把大体积依赖缓存和构建产物也一并拷过去

## 重要选项

### `--mode <link|path>`

- `link`：默认值，调试当前 worktree 最方便
- `path`：更接近“从本地构建产物安装”的行为

### `--message <text>`

将一条首消息直接交给 session shell，适合快速复现：

```bash
--message "你好"
--message "帮我 review 代码"
```

### `--skip-build`

跳过脚本内的 `pnpm run build`，直接复用当前仓库现有的 `dist/`。

适合你已经手动 build 过、想更快迭代的时候。

### `--keep-temp`

保留临时 cleanroom 目录，便于失败后继续进去查看：

- `package.json`
- `.repo-ai-governor`
- 安装后的依赖状态
- 运行时产物

### `--cleanup`

退出后自动删除临时目录。

## 调试建议

如果你在排查真实 adopter 项目问题，推荐这条流程：

1. 先本地构建当前 governor
2. 用 `--seed-from` 指向真实项目
3. 用 `--message` 直接打到要复现的输入
4. 如果问题复现，改用 `--keep-temp` 保留现场

推荐命令：

```bash
pnpm run debug:cleanroom-session-shell -- --seed-from /Users/jimmydaddy/study/playground --message "你好"
```

或：

```bash
pnpm run debug:cleanroom-session-shell -- --seed-from /Users/jimmydaddy/study/playground --message "帮我 review 代码"
```

## 输出说明

脚本启动前会打印几条调试信息：

- `repository_root=...`
- `workspace_root=...`
- `seed_from=...`（如果传了 `--seed-from`）
- `keep_temp=true|false`
- `launch=pnpm exec repo-ai-governor ...`

这些信息主要用于：

- 快速进入 cleanroom 目录继续手查
- 区分这次调试到底跑的是哪个临时项目
- 确认是否真的走到了 seeded 项目路径

## 当前限制

- 这是开发调试脚本，不是 release gate
- 当前没有自动断言“交互行为是否正确”，它更偏向快速复现和人工观察
- 如果上游 CLI 本身响应很慢，cleanroom 也只会如实反映这个慢路径，不会绕过它

## 建议配合使用

- [verify-cleanroom-local-install.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-cleanroom-local-install.js)
  用于非交互 cleanroom 命令链验证
- [verify-local-distribution.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js)
  用于本地分发产物验证

推荐组合：

1. 非交互 smoke：`release:verify-cleanroom-local-install`
2. 本地分发 smoke：`release:verify-local`
3. 真实交互调试：`debug:cleanroom-session-shell`
