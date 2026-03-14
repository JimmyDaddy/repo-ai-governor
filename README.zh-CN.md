# Repo AI Governor

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Repo AI Governor` 是一个仓库内 AI 治理 CLI，适合希望让 AI 编码工具在同一个仓库里遵守统一流程、质量门禁和交付规则的团队。

它当前可以帮助仓库稳定执行：

1. 先规划再编码
2. 基于 sprint 产物的任务拆解
3. `check / review / review-verify` 治理闭环
4. 标准规范包与 slot 规则注入
5. 在 `Codex`、`GitHub Copilot`、`Claude Code` 之间保持一致行为

## 当前状态

MVP 主线已经完成。

当前已提供：

1. `init`、`doctor`、`plan`、`check`、`review`、`review-verify`、`report`、`upgrade`
2. 仓库初始化脚手架与治理配置
3. 标准规范包、workflow engine、slot runtime 和统一报告
4. CI 调用脚本与验收套件
5. `Codex`、`GitHub Copilot`、`Claude Code` 三类适配示例

尚未完全交付：

1. 自动化模式 `v1`
2. `Cursor`、`Cline` 等第二批适配器真实实现
3. 超出当前 MVP 基线的更广泛多语言治理模板

## 安装

### `npx`

```bash
npx repo-ai-governor --help
```

### `npm`

```bash
npm install --save-dev repo-ai-governor
npx repo-ai-governor --help
```

### `pnpm`

```bash
pnpm add -D repo-ai-governor
pnpm exec repo-ai-governor --help
```

需要 Node.js `>=18`。

## 快速开始

最短路径是：

1. 初始化治理目录
2. 校验仓库健康度
3. 生成计划与任务
4. 执行治理检查
5. 评审改动
6. 渲染报告

示例：

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-demo.XXXXXX)"

npx repo-ai-governor init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --format json

npx repo-ai-governor doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json
```

然后准备需求文件并生成 sprint 产物：

```bash
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement

Build a repository governance MVP validation flow.
EOF

npx repo-ai-governor plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance MVP validation" \
  --format json
```

接着执行检查、评审和报告：

```bash
npx repo-ai-governor check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --format json

npx repo-ai-governor review \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --path src \
  --format json

npx repo-ai-governor report \
  --cwd "$TMP_DIR" \
  --source .repo-ai-governor/reports/latest.json \
  --format markdown \
  --dry-run
```

更完整的路径见：

1. [Quick Start](/Users/jimmydaddy/study/repo-ai-governor/docs/quick-start.md)
2. [Getting Started Example](/Users/jimmydaddy/study/repo-ai-governor/docs/getting-started-example.md)
3. [Ten-Minute Getting Started](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/ten-minute-getting-started.md)

## 命令

### `init`

生成治理配置、`AGENTS.md`、context 文件、adapter 配置和 sprint 目录骨架。

### `doctor`

校验环境、配置和仓库结构，支持 `--strict` 和 `--fix`。

### `plan`

生成 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 和 `TK-xxx.md` 任务卡。

### `check`

按当前治理规范执行检查，可输出统一报告。

### `review`

执行仓库感知的 code review 检查，并生成带状态前缀的 CR 文件。

### `review-verify`

复核 review 记录，并推动其沿 CR 生命周期流转。

### `report`

把治理 payload 或 CR 文件渲染成 summary、markdown 或 JSON 报告。

### `upgrade`

预览并执行配置 / 模板升级，支持备份。

## 示例

适配器示例：

1. [Codex](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/codex/README.md)
2. [GitHub Copilot](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/github-copilot/README.md)
3. [Claude Code](/Users/jimmydaddy/study/repo-ai-governor/examples/adapters/claude-code/README.md)

验收资产：

1. [MVP Acceptance Kit](/Users/jimmydaddy/study/repo-ai-governor/examples/mvp-acceptance/README.md)
2. [Official Example Slots](/Users/jimmydaddy/study/repo-ai-governor/examples/slot-packages/official/README.md)
3. [CI Example](/Users/jimmydaddy/study/repo-ai-governor/examples/ci/github-actions-governance.yml)

## 仓库文档

MVP 和后续项目的规划执行记录位于：

1. [mvp](/Users/jimmydaddy/study/repo-ai-governor/docs/mvp)
2. [post-mvp project recommendation](/Users/jimmydaddy/study/repo-ai-governor/docs/post-mvp-project-recommendation.md)
3. [release-ga sprint-001](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/index.md)

## 发布准备

当前发布门禁命令：

```bash
npm run check
npm run release:check
npm run release:verify-local
npm run release:ga-check
```

发布策略与 GA 标准见：

1. [GA Release Flow](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/ga-release-flow.md)
2. [CHANGELOG.md](/Users/jimmydaddy/study/repo-ai-governor/CHANGELOG.md)
3. [CHANGELOG.zh-CN.md](/Users/jimmydaddy/study/repo-ai-governor/CHANGELOG.zh-CN.md)
4. [Remote Release Automation](/Users/jimmydaddy/study/repo-ai-governor/docs/release-ga/sprint-001/remote-release-automation.md)
