# Report Command Runtime

- Date: 2026-03-14
- Task: `TK-502`
- Status: done

## Goal

基于统一报告模型实现 `report` 命令，把已有执行结果渲染成 `summary`、`markdown`、`json` 三类输出，并支持默认落盘到 `.repo-ai-governor/reports/`。

## Delivered

1. 新增 `src/commands/report-command.js`，完成：
   - `--source` 指向已有结果文件
   - `--format` 切换 `summary`、`markdown`、`json`
   - `--out` 覆盖输出路径
   - 默认输出到 `reporting.outputDir + fileNames[format]`
   - `--dry-run` 只渲染不落盘
2. 新增 `src/reporting/report-source.js`，支持来源解析：
   - 统一报告 JSON 文件
   - 原始命令 JSON payload
   - `review*.md` / `verified_review*.md` / `resolved_review*.md` 评审记录
3. 更新 `src/cli/index.js`，把 `report` 命令从注册占位切到真实执行逻辑。
4. 新增 `test/commands/report-command.test.js`，覆盖：
   - `check` JSON 结果渲染为 Markdown 并默认落盘
   - `review` Markdown 记录渲染为统一 JSON
   - `review-verify` Markdown 记录渲染为 summary

## Runtime Flow

1. 读取 `governor.yaml` 和当前 CLI 覆盖项。
2. 解析 source file：
   - 若为 `governance-report` JSON，直接使用
   - 若为命令 JSON payload，通过统一报告模型归一
   - 若为 review lifecycle Markdown，通过 source parser 归一
3. 使用统一报告模型渲染目标格式。
4. 按 `--out` 或默认 reporting 配置落盘；`--dry-run` 时只输出不写文件。

## Validation Scope

当前 MVP 最小报告能力重点覆盖：

1. `check` JSON 结果可被转成 Markdown 报告
2. `review` / `review-verify` 的 CR 文件可被转成 summary 或 JSON 报告
3. 默认输出路径与 reporting 配置保持一致
4. `report` 与统一报告模型共用同一套结构

## Validation

1. `test/commands/report-command.test.js`
2. `npm run check`
3. 当前仓库 61 个测试全部通过

## Follow-up

1. `TK-503` 可基于当前 `report` 输出补齐 CI 使用方式与退出码约定。
2. 后续若需要消费 Markdown report 本身，可在 `report-source` 中继续补 parser。
