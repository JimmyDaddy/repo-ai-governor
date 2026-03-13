# TK-101 配置目录结构与文件命名规范

- Status: done
- Date: 2026-03-13
- Project: `mvp`
- Sprint: `sprint-001`
- Related Task: [tasks/TK-101.md](./tasks/TK-101.md)

## Goal

固定仓库治理配置、项目/sprint 产物和 CR 文件的默认目录结构与命名规则，作为 `TK-102`、`TK-103`、`TK-104`、`TK-105`、`TK-106` 的共同前置约束。

## Default Layout

```text
.repo-ai-governor/
  governor.yaml
  slots/
    security-review.yaml
    doc-output.yaml
  adapters/
    codex.yaml
    copilot.yaml
    claude-code.yaml
  reports/
  templates/
AGENTS.md
docs/
  <project>/
    sprint-xxx/
      index.md
      plan.md
      tasks/
        checklist.md
        tasks.csv
        TK-xxx.md
      code-review/
        review_<slug>.md
        verified_review_<slug>.md
        resolved_review_<slug>.md
```

## Naming Rules

1. 项目目录使用小写 kebab-case，例如 `mvp`、`platform-core`。
2. sprint 目录固定使用 `sprint-xxx`，编号使用三位数字，例如 `sprint-001`。
3. 主配置文件固定为 `.repo-ai-governor/governor.yaml`。
4. 插槽文件写入 `.repo-ai-governor/slots/*.yaml`。
5. 适配器文件写入 `.repo-ai-governor/adapters/*.yaml`。
6. 仓库级 AI 入口固定为仓库根目录 `AGENTS.md`。
7. 单任务文件固定为 `docs/<project>/sprint-xxx/tasks/TK-xxx.md`。
8. checklist 固定为 `docs/<project>/sprint-xxx/tasks/checklist.md`。
9. CSV 执行台账固定为 `docs/<project>/sprint-xxx/tasks/tasks.csv`。
10. CR 文件写入 `docs/<project>/sprint-xxx/code-review/`，并使用状态前缀。
11. `<slug>` 使用小写 kebab-case，且应包含任务编号或变更主题，例如 `tk-101-design-config-layout`。

## File Responsibilities

1. `governor.yaml` 保存仓库治理主配置。
2. `slots/` 保存项目自定义规则插槽。
3. `adapters/` 保存不同模型、IDE 和工具的局部适配配置。
4. `reports/` 作为默认报告输出目录。
5. `templates/` 预留给模板覆盖和扩展能力。
6. `plan.md` 保存当前 sprint 的方案和任务拆解。
7. `tasks/checklist.md` 保存单列表任务清单，并在条目下追加执行记录。
8. `tasks/tasks.csv` 保存追加式执行台账，每条执行记录一行。
9. `code-review/` 保存带状态流转的 CR 文档。

## Reference Implementation

1. 代码侧参考实现位于 `src/config/repository-layout.js`。
2. 当前 CLI 已通过 `src/cli/index.js` 复用这套路径与命名规则输出占位信息。
3. 后续 `TK-102`、`TK-103`、`TK-104`、`TK-105`、`TK-106` 应直接复用该模块，避免重复定义路径常量。
