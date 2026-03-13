# AI 开发治理工具 CLI 命令设计

- 文档版本：v0.1
- 状态：草案
- 日期：2026-03-12
- 关联文档：[product-requirements.md](./product-requirements.md)、[mvp-execution-plan.md](./mvp-execution-plan.md)、[config-schema-draft.md](./config-schema-draft.md)

## 1. 设计目标

CLI 需要同时服务三类场景：

1. 本地开发者交互式使用
2. AI/Agent 工具的非交互式调用
3. CI 流水线中的稳定执行

因此命令设计应满足：

1. 命令语义清晰
2. 输出格式稳定
3. 支持机器消费
4. 支持最小学习成本

## 2. MVP 命令范围

MVP 仅承诺以下命令：

1. `init`
2. `doctor`
3. `plan`
4. `check`
5. `review`
6. `review-verify`
7. `report`
8. `upgrade`

说明：

1. `run` 作为完整流程编排命令保留到 MVP+1 或自动模式阶段。
2. MVP 先通过 `plan`、`check`、`review`、`review-verify` 组合跑通最小闭环。

## 3. 命令设计原则

1. 一个命令只负责一个核心动作。
2. 默认输出面向人类，使用 `--format json` 切换为机器输出。
3. 所有命令都支持 `--non-interactive`，便于 CI 和 Agent 调用。
4. 所有会写文件的命令都支持 `--dry-run`。
5. 所有命令默认在当前仓库根目录执行。

## 4. 全局参数

所有命令建议支持以下全局参数：

1. `--config <path>`
   - 指定主配置文件路径
2. `--cwd <path>`
   - 指定执行目录
3. `--project <slug>`
   - 指定当前执行项目，如 `mvp`
4. `--sprint <id>`
   - 指定当前执行 sprint，如 `sprint-001`
5. `--locale <locale>`
   - 指定输出语言，如 `zh-CN`、`en-US`
6. `--format <summary|markdown|json>`
   - 指定输出格式
7. `--non-interactive`
   - 禁止交互提示
8. `--verbose`
   - 输出更多调试信息
9. `--quiet`
   - 仅输出关键结果
10. `--dry-run`
   - 只预览不落盘

## 5. 命令定义

### 5.1 `init`

用途：

1. 初始化仓库治理能力
2. 生成默认配置和目录结构
3. 生成或更新仓库根目录 `AGENTS.md`

语法：

```bash
repo-ai-governor init [options]
```

建议参数：

1. `--preset <name>`
   - 指定默认规范模板，如 `official/base`
2. `--language <name>`
   - 指定编程语言模板
3. `--adapter <name>`
   - 预启用一个或多个适配器
4. `--force`
   - 允许覆盖可覆盖文件

输出：

1. 创建 `.repo-ai-governor/` 目录
2. 创建 `governor.yaml`
3. 生成或更新仓库根目录 `AGENTS.md`
4. 初始化 `docs/<project>/sprint-xxx/` 下的基础任务与 `code-review/` 目录
5. 输出初始化摘要

退出条件：

1. 成功初始化返回 `0`
2. 文件冲突返回非零

### 5.2 `doctor`

用途：

1. 检查仓库是否满足运行条件
2. 检查配置、目录、环境是否完整

语法：

```bash
repo-ai-governor doctor [options]
```

建议参数：

1. `--strict`
   - 把警告视为失败
2. `--fix`
   - 仅对安全问题执行自动修复，MVP 中只自动补齐缺失目录，不重写文件

输出：

1. 环境检查结果
2. 配置校验结果
3. 修复建议

退出条件：

1. 无 error 且无 strict warning 时返回 `0`
2. 存在 error，或 `--strict` 下存在 warning 时返回 `1`

### 5.3 `plan`

用途：

1. 根据治理模板生成技术方案和任务拆解
2. 为后续开发、检查和总结提供结构化输入

语法：

```bash
repo-ai-governor plan [options]
```

建议参数：

1. `--input <path>`
   - 需求输入文件
2. `--title <text>`
   - 任务标题
3. `--out <path>`
   - 输出文件路径
4. `--template <name>`
   - 指定流程模板
5. `--bundle-dir <path>`
   - 指定项目/sprint 任务产物目录

输出：

1. 技术方案摘要
2. 任务拆解列表
3. 风险和待确认项
4. 项目/sprint 目录下的 `plan.md`
5. 项目/sprint 目录下的 `tasks/checklist.md`
6. 项目/sprint 目录下的 `tasks/tasks.csv`
7. 项目/sprint 目录下的 `tasks/*.md`

### 5.4 `check`

用途：

1. 执行治理检查
2. 汇总流程、规范、插槽命中结果

语法：

```bash
repo-ai-governor check [options]
```

建议参数：

1. `--stage <name>`
   - 只检查某个阶段
2. `--changed-only`
   - 仅检查变更内容
3. `--write-report`
   - 强制写报告文件

输出：

1. 阶段状态
2. 规则命中情况
3. 失败原因与建议动作

### 5.5 `review`

用途：

1. 按治理规则执行代码评审检查
2. 输出评审摘要或发现

语法：

```bash
repo-ai-governor review [options]
```

建议参数：

1. `--path <file-or-dir>`
   - 只评审指定文件或目录
2. `--base <ref>`
   - 指定对比基线
3. `--head <ref>`
   - 指定对比头部

输出：

1. 评审结论
2. 风险列表
3. 缺失项提示
4. `code-review/review_<slug>.md`

### 5.6 `review-verify`

用途：

1. 对 `review` 结果执行复核
2. 将复核结论追加回原 CR 文件并更新状态命名

语法：

```bash
repo-ai-governor review-verify [options]
```

建议参数：

1. `--source <path>`
   - 指定待复核的 `review` 结果文件
2. `--path <file-or-dir>`
   - 只复核指定文件或目录
3. `--base <ref>`
   - 指定对比基线
4. `--head <ref>`
   - 指定对比头部

输出：

1. 复核结论
2. 争议项列表
3. 追加后的同一 CR 文件
4. 复核后文件重命名为 `code-review/verified_review_<slug>.md`

### 5.7 `report`

用途：

1. 将执行结果渲染为人类或机器可读报告
2. 供本地查看和 CI 归档

语法：

```bash
repo-ai-governor report [options]
```

建议参数：

1. `--source <path>`
   - 指定已有结果文件
2. `--format <summary|markdown|json>`
   - 指定输出格式
3. `--out <path>`
   - 指定输出路径

输出：

1. 终端摘要
2. Markdown 报告
3. JSON 报告

### 5.8 `upgrade`

用途：

1. 升级默认模板和配置结构
2. 执行配置迁移

语法：

```bash
repo-ai-governor upgrade [options]
```

建议参数：

1. `--to-version <version>`
   - 目标 schema 或模板版本
2. `--preview`
   - 只展示升级结果
3. `--backup`
   - 升级前备份原配置

输出：

1. 升级计划
2. 迁移结果
3. 风险提示

## 6. 任务产物目录约定

当配置或参数中指定了当前项目和当前 sprint 时，`plan`、`review`、`review-verify` 默认按以下结构落盘；`report` 默认输出到 `reporting.outputDir`，也可用 `--out` 覆盖：

```text
docs/
  mvp/
    sprint-001/
      index.md
      plan.md
      tasks/
        checklist.md
        tasks.csv
        TK-001.md
      code-review/
        review_tk-001-initialize-sprint-templates.md
```

规则如下：

1. `project` 使用小写 slug，如 `mvp`
2. `sprint` 使用稳定编号，如 `sprint-001`
3. `tasks/checklist.md` 使用单列表记录任务，不按状态分组
4. 每个 checklist 任务条目至少包含任务编号、标题、负责人、优先级、截止日期、状态，并在条目下追加多条 `执行记录`
5. `tasks/tasks.csv` 采用追加式执行台账，每条执行记录一行，至少包含 `execution_id`、`task_id`、`title`、`owner`、`priority`、`due_date`、`status`、`project`、`sprint`、`plan`、`result`、`verify`、`review_delta`、`recorded_at`
6. 单任务文档写入 `tasks/`
7. 评审文档写入 `code-review/`
8. CR 文件命名采用状态前缀：`review_<slug>.md`、`verified_review_<slug>.md`、`resolved_review_<slug>.md`
9. `<slug>` 应包含任务编号或变更主题，避免同一 sprint 下文件冲突
10. 复核结果直接追加到同一个 CR 文件，不生成单独的 `review-verify.md`

## 7. 输出格式规范

### 7.1 `summary`

适用场景：

1. 本地终端默认输出
2. 快速阅读

特点：

1. 面向人类
2. 信息密度高
3. 不保证强结构化

### 7.2 `markdown`

适用场景：

1. 文档归档
2. 审查沉淀

特点：

1. 人类可读
2. 适合协作和留档

### 7.3 `json`

适用场景：

1. CI
2. 其他工具消费
3. 自动化链路

特点：

1. 字段稳定
2. 便于程序解析

## 8. 退出码设计

建议统一使用以下退出码：

1. `0`
   - 成功
2. `1`
   - 业务检查失败
3. `2`
   - 配置错误
4. `3`
   - 环境错误
5. `4`
   - 输入参数错误
6. `5`
   - 内部执行错误

## 9. 典型调用示例

### 初始化仓库

```bash
repo-ai-governor init --language typescript --adapter codex --adapter claude-code
```

### 检查运行环境

```bash
repo-ai-governor doctor --strict
```

### 生成方案和任务拆解

```bash
repo-ai-governor plan --input docs/requirement.md --project mvp --sprint sprint-001
```

### 复核评审结果

```bash
repo-ai-governor review-verify --project mvp --sprint sprint-001 --source docs/mvp/sprint-001/code-review/review_tk-001-initialize-sprint-templates.md
```

### 在 CI 中执行检查

```bash
repo-ai-governor check --non-interactive --format json --write-report
```

### 输出 Markdown 报告

```bash
repo-ai-governor report --project mvp --sprint sprint-001 --format markdown --out .repo-ai-governor/reports/mvp-sprint-001.md
```

## 10. 命令间工作流关系

MVP 推荐工作流如下：

1. `init`
   - 初始化仓库治理结构
2. `doctor`
   - 检查环境和配置
3. `plan`
   - 生成方案、任务拆解、checklist 和 CSV
4. `check`
   - 执行治理检查
5. `review`
   - 输出评审结论
6. `review-verify`
   - 对评审结论执行复核
7. `report`
   - 渲染和归档结果

## 11. 非交互式与交互式模式

交互式模式：

1. 面向开发者本地使用
2. 可以提示确认和补全默认值

非交互式模式：

1. 面向 CI、Agent、自动化调用
2. 不允许等待输入
3. 所有缺失参数必须通过默认值或显式参数解决

## 12. MVP 暂不承诺的 CLI 能力

1. `run` 全流程编排命令
2. 多任务并行调度
3. 远程配置同步
4. 完整自动开发闭环控制台

## 13. 建议的下一步

这份命令设计确定后，建议继续产出：

1. CLI 帮助文本草案
2. JSON 输出字段定义
3. 错误码和错误消息规范
