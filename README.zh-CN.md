# Repo AI Governor

[English](./README.md) | [简体中文](./README.zh-CN.md)

`Repo AI Governor` 是一个仓库内 AI 治理 CLI。
它把“先方案后执行”的流程、评审流转和质量门禁统一为可执行能力，而不是只停留在文档约定。

## 解决什么问题

1. 强制先方案后编码（`plan -> implement -> check -> review -> verify`）。
2. 让 sprint 产物保持一致（`plan.md`、checklist、CSV 台账、任务卡、CR 文件）。
3. 让治理规则可执行（脚本门禁 + 报告输出），而不是仅人工口头约束。
4. 支持自动化编排（阶段路由、流程校验、检查点恢复）。
5. 在 `Codex`、`GitHub Copilot`、`Claude Code` 之间复用同一套治理能力。

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

## 10 分钟上手

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-demo.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"

# 1) 初始化治理目录
$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --locale zh-CN \
  --format json

# 2) 做一次基线校验
$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json

# 3) 准备需求并生成计划 + 任务拆解
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement
Build a repository governance demo flow.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance demo flow" \
  --format json

# 4) 执行当前 sprint 治理检查
$CLI check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --write-report \
  --format json
```

会生成的核心产物：

1. 治理配置与执行上下文文件（由工具自动管理）
2. `AGENTS.md`
3. `docs/<project>/<sprint>/plan.md`
4. `docs/<project>/<sprint>/tasks/*`
5. `docs/<project>/<sprint>/code-review/*`

完整流程见：[Quick Start](./docs/quick-start.md)

## 与 AI 工具结合

按工具类型安装 skills：

1. `codex` -> `.codex/skills/`
2. `github-copilot` -> `.github/skills/`
3. `claude-code` -> `.claude/skills/`

```bash
npx @cjhdev/repo-ai-governor skills list --surface codex --format json
npx @cjhdev/repo-ai-governor skills install --surface codex --format json
npx @cjhdev/repo-ai-governor skills doctor --surface codex --strict --format json
```

安装后建议让 AI 助手先做两件事：

1. 读取 `AGENTS.md` 与 `init` 生成的当前上下文文件
2. 按已安装 skill 执行（例如 `$governor-plan-runner`、`$governor-task-implementer`、`$governor-delivery-finisher`）

## 核心命令

1. `init`：初始化治理配置与 sprint 结构。
2. `skills`：列出、安装、体检官方 skills。
3. `doctor`：校验环境、配置和目录结构。
4. `plan`：根据需求生成计划与任务产物。
5. `check`：按阶段或按变更执行治理检查。
6. `run`：执行带 preflight、阶段路由和恢复能力的自动化编排。
7. `review`：生成 code review 记录。
8. `review-verify`：复核并推进 CR 状态流转。
9. `report`：输出 summary/markdown/json 报告。
10. `upgrade`：安全升级生成式配置与模板。

### `run` 能力要点

1. `--routing-profile` 与 `--route <stage=surface>` 支持阶段级路由。
2. `--explain-process` 用于流程编译结果预览。
3. `--validate-process` 仅校验流程，不触发阶段派发。
4. `--resume-from` 与 `--resume-stage` 支持 assisted 模式从检查点恢复。
5. `--approve-risk <tag>` 支持显式确认高风险标签。

## 评审文件生命周期

默认 CR 文件流转：

1. `review_<slug>.md`：已生成，待复核
2. `verified_review_<slug>.md`：复核完成
3. `resolved_review_<slug>.md`：接受项已修复

## 质量门禁基线

日常开发基线：

1. `npm run typecheck`
2. `npm run test -- --maxWorkers=1 --maxConcurrency=1`
3. `npm run check`

发布前基线：

1. `npm run ci:quality`
2. `npm run release:ga-check`

## 当前仓库治理基线

本仓库已进入 TS-first + Vitest + Biome 的长期治理基线：

1. 源码与测试默认 TypeScript-first，任何保留 JS 必须经过 whitelist 治理并可追踪。
2. `npm run check` 串行执行 format/lint/build/standards gate。
3. `npm run ci:quality` 在默认 gate 之上增加 typecheck 与覆盖率阈值校验。
4. `npm run release:ga-check` 作为发布前质量链路统一入口。
5. `code_standards.md` 当前生效规则为 `CS-001` 到 `CS-014`。
6. Monorepo 命名门禁脚本已预置在 `scripts/governance/check-monorepo-naming.js`，当前轮次有意不接入 `Verification Commands`。

迁移收官与长期维护细则见：

1. `docs/ts-vitest-v1/sprint-003/migration-closure-report.md`
2. `docs/governance/long-term-maintenance-guide.md`

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

项目自定义 slot 文件由工具治理流程自动生成和管理。

如果你的团队已经有 `code_standards.md`，可以在文档里加入 `## Verification Commands` 段落，把它变成可执行门禁：

```bash
npm run check:code-standards
```

新增代码规范的推荐步骤：

1. 在 `code_standards.md` 的 `## Non-negotiable Rules` 增加带编号的规则（例如 `- [CS-005] ...`）。
2. 在 `## Verification Commands` 增加可执行命令，确保规则可自动验证。
3. 运行 `npm run check:code-standards` 本地验证，确认门禁可通过。

## 参考文档

1. [Quick Start](./docs/quick-start.md)
2. [AI 仓库配置指南](./docs/ai-repo-setup.md)
3. [Getting Started Example](./docs/getting-started-example.md)
4. [Repository Long-Term Maintenance Guide](./docs/governance/long-term-maintenance-guide.md)
5. [Codex Adapter Example](./examples/adapters/codex/README.md)
6. [GitHub Copilot Adapter Example](./examples/adapters/github-copilot/README.md)
7. [Claude Code Adapter Example](./examples/adapters/claude-code/README.md)
8. [Official Example Slots](./examples/slot-packages/official/README.md)
9. [CHANGELOG](./CHANGELOG.zh-CN.md)
