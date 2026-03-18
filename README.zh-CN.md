# Repo AI Governor

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Repo AI Governor` 是一个仓库内 AI 治理 CLI，帮助团队让 AI 编码过程始终遵循统一流程和质量规则。

## 解决什么问题

1. 强制先方案后编码（`plan -> implement -> check -> review`）。
2. 让 sprint 产物保持一致（`plan.md`、checklist、CSV 台账、任务卡、CR 文件）。
3. 通过规范包与 slot 注入项目特有规则。
4. 在 `Codex`、`GitHub Copilot`、`Claude Code` 之间复用同一套治理能力。

## 安装

需要 Node.js `>=18`。

```bash
# 直接运行
npx @cjhdev/repo-ai-governor --help

# 或安装为开发依赖
npm install --save-dev @cjhdev/repo-ai-governor
npx repo-ai-governor --help
```

包名和命令名不同：

1. 包名：`@cjhdev/repo-ai-governor`
2. 命令名：`repo-ai-governor`

## 快速开始

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-demo.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"

# 1) 初始化治理目录
$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --locale zh-CN

# 2) 按当前 AI 工具安装官方 skills
$CLI skills install \
  --cwd "$TMP_DIR" \
  --surface codex

# 3) 做一次基线校验
$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict

# 4) 准备需求并生成计划
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement
Build a repository governance demo flow.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance demo flow"
```

会生成的核心产物：

1. `.repo-ai-governor/governor.yaml`
2. `AGENTS.md`
3. `.repo-ai-governor/context/current-context.md`
4. `docs/<project>/<sprint>/plan.md`
5. `docs/<project>/<sprint>/tasks/*`
6. `docs/<project>/<sprint>/code-review/*`

## 与 AI 工具结合

按工具类型安装 skills：

1. `codex` -> `.codex/skills/`
2. `github-copilot` -> `.github/skills/`
3. `claude-code` -> `.claude/skills/`

安装后建议让 AI 助手先做两件事：

1. 读取 `AGENTS.md` 与 `.repo-ai-governor/context/current-context.md`
2. 按已安装 skill 执行（例如 `$governor-plan-runner`、`$governor-task-implementer`、`$governor-delivery-finisher`）

## 核心命令

1. `init`：初始化治理配置与 sprint 结构。
2. `skills`：列出、安装、校验官方 skills。
3. `doctor`：校验环境、配置和目录结构。
4. `plan`：根据需求生成计划与任务产物。
5. `check`：执行治理检查。
6. `run`：执行带 preflight 和阶段路由的自动化编排。
7. `review`：生成 code review 记录。
8. `review-verify`：复核并推进 CR 状态流转。
9. `report`：输出 summary/markdown/json 报告。
10. `upgrade`：安全升级生成式配置与模板。

## 自定义规范与项目规则

`governor.yaml` 支持规范覆盖和 slot 配置：

```yaml
standards:
  preset: official/base
  overrides:
    quality:
      tests: required
slots:
  enabled:
    - security-review
```

项目自定义 slot 文件路径：`.repo-ai-governor/slots/*.yaml`。

如果你的团队已经有 `code_standards.md`，可以在文档里加入 `## Verification Commands` 段落，把它变成可执行门禁：

```bash
npm run check:code-standards
```

新增代码规范的推荐步骤：

1. 在 `code_standards.md` 的 `## Non-negotiable Rules` 增加带编号的规则（例如 `- [CS-005] ...`）。
2. 在 `## Verification Commands` 增加可执行命令，确保这条规则可以被自动验证。
3. 运行 `npm run check:code-standards` 本地验证，确认门禁可通过。

示例（本仓库当前已启用）：对相对路径 import/export 强制要求显式扩展名（`./foo.js`）。

当前仓库里 `npm run check` 已经接到了这个 standards 门禁。

## 当前仓库治理基线

本仓库已进入 TS-first + Vitest + Biome 的长期治理基线：

1. 源码与测试默认 TypeScript-first，任何保留 JS 必须经过 whitelist 治理并可追踪。
2. `npm run check` 串行执行 format/lint/build/standards gate。
3. `npm run ci:quality` 在默认 gate 之上增加 typecheck 与 coverage 校验。
4. `npm run release:ga-check` 作为发布前质量链路的统一入口。

迁移收官与长期维护细则见：

1. `docs/ts-vitest-v1/sprint-003/migration-closure-report.md`
2. `docs/governance/long-term-maintenance-guide.md`

## 参考文档

1. [Quick Start](./docs/quick-start.md)
2. [Getting Started Example](./docs/getting-started-example.md)
3. [Codex Adapter Example](./examples/adapters/codex/README.md)
4. [GitHub Copilot Adapter Example](./examples/adapters/github-copilot/README.md)
5. [Claude Code Adapter Example](./examples/adapters/claude-code/README.md)
6. [Official Example Slots](./examples/slot-packages/official/README.md)
7. [CHANGELOG](./CHANGELOG.zh-CN.md)
