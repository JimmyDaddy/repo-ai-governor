# AI Repository Setup Guide

- Date: 2026-03-18
- Audience: repository maintainers, tech leads, AI-assisted developers

## Goal

给一个代码仓库建立可执行、可复核、可持续的 AI 开发流程，而不是只靠聊天指令和人工约定。

## What You Get

1. 固定的会话启动基线（AI 每次进仓库都读同一组文件）。
2. 固定的开发闭环（`plan -> implement -> check -> review -> verify`）。
3. 可落地的单 AI 与多 AI 编排入口。
4. 可以接入 CI 的质量门禁和发布门禁。

## 0. Prerequisites

1. Node.js `>=18`
2. 可用的 `npm` 与 `npx`
3. 仓库根目录可写

## 1. Bootstrap Governance In A Repository

在目标仓库根目录执行：

```bash
CLI="npx @cjhdev/repo-ai-governor"
ROOT="$PWD"

$CLI init \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --adapter github-copilot \
  --adapter claude-code \
  --language typescript \
  --locale zh-CN \
  --format json
```

初始化后至少应出现：

1. 治理配置与执行上下文文件（自动生成）
2. `AGENTS.md`
3. `docs/<project>/<sprint>/`

说明：workspace 数据由工具自动管理，通常不需要手动处理路径。

## 2. Install And Validate Skills By Surface

按你实际使用的 AI 工具安装：

```bash
# Codex
$CLI skills install --cwd "$ROOT" --surface codex --format json
$CLI skills doctor  --cwd "$ROOT" --surface codex --strict --format json

# GitHub Copilot
$CLI skills install --cwd "$ROOT" --surface github-copilot --format json
$CLI skills doctor  --cwd "$ROOT" --surface github-copilot --strict --format json

# Claude Code
$CLI skills install --cwd "$ROOT" --surface claude-code --format json
$CLI skills doctor  --cwd "$ROOT" --surface claude-code --strict --format json
```

## 3. Standard Session Startup Contract

让 AI 在每次会话开始时先读取：

1. `AGENTS.md`
2. `code_standards.md`
3. `docs/governance/long-term-maintenance-guide.md`
4. `init` 生成的当前上下文文件（current-context）

建议在团队内部固定一段启动语句：

```text
请先读取 AGENTS.md、code_standards.md、docs/governance/long-term-maintenance-guide.md、
当前上下文文件（current-context），然后按当前 sprint 的任务台账执行。
```

## 4. Standard Daily Flow

### 4.1 Baseline Check

```bash
$CLI doctor \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json
```

### 4.2 Plan And Task Artifacts

```bash
$CLI plan \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --input request.md \
  --title "Implement feature X" \
  --format json
```

### 4.3 Governance Check

```bash
$CLI check \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --write-report \
  --format json
```

### 4.4 Review And Verify

```bash
$CLI review \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --path src \
  --format json
```

```bash
REVIEW_FILE="$(ls "$ROOT"/docs/demo/sprint-001/code-review/review_*.md | head -n 1)"

$CLI review-verify \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --source "$REVIEW_FILE" \
  --format json
```

## 5. Single-AI And Multi-AI Orchestration

### 5.1 Explain/Validate Process First

```bash
$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --explain-process \
  --format json
```

```bash
$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --validate-process \
  --format json
```

### 5.2 Single-AI Dry Run

```bash
$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --routing-profile single-codex \
  --input request.md \
  --dry-run \
  --format json
```

### 5.3 Multi-AI Dry Run

```bash
$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --routing-profile multi-ai-dev-review \
  --input request.md \
  --dry-run \
  --format json
```

### 5.4 Stage-Level Route Override

```bash
$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --routing-profile multi-ai-dev-review \
  --route implementation=codex \
  --route review=claude-code \
  --input request.md \
  --dry-run \
  --format json
```

### 5.5 Resume From Checkpoint

```bash
AUDIT_PATH="<latest_audit_path_from_previous_run_output>"

$CLI run \
  --cwd "$ROOT" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --resume-from "$AUDIT_PATH" \
  --resume-stage review \
  --format json
```

## 6. CI And Release Gates

建议在 CI 固定这组门禁：

```bash
npm run typecheck
npm run test -- --maxWorkers=1 --maxConcurrency=1
npm run check
npm run ci:quality
npm run release:ga-check
```

## 7. Governance Rules For Team Adoption

1. 所有任务必须有 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 对应记录。
2. 所有评审必须按 `review_ -> verified_review_ -> resolved_review_` 流转。
3. 新增规范必须同时提交“规则文本 + 可执行命令 + 回归测试”。
4. AI 会话开始前必须读取上下文与规范入口文件。
5. 无法通过门禁的改动不进入交付分支。

## 8. Common Failure Patterns

1. 只让 AI 改代码，不让它更新任务/评审台账。
2. 每个开发者使用不同提示词，导致执行方式漂移。
3. 把 `run` 当黑盒直接执行，不先 `--explain-process` 或 `--validate-process`。
4. 只跑单元测试，不跑 `check`/`ci:quality`/`release:ga-check`。
5. 规范更新后没有同步 README 与 Quick Start。

## 9. Suggested Rollout Plan

1. 第 1 周：先完成单 AI 流程固化（Codex 或 Copilot 任一）。
2. 第 2 周：接入 `review-verify` 与 CR 生命周期文件流转。
3. 第 3 周：启用多 AI 路由与 dry-run 验证。
4. 第 4 周：把质量门禁接入 CI，并执行一次发布链路演练。
