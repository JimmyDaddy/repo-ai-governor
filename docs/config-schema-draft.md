# AI 开发治理工具配置 Schema 草案

- 文档版本：v0.1
- 状态：草案
- 日期：2026-03-13
- 关联文档：[product-requirements.md](./product-requirements.md)、[mvp-execution-plan.md](./mvp-execution-plan.md)

## 1. 设计目标

配置系统需要同时满足以下目标：

1. 对人类作者足够易读易写。
2. 对工具运行时足够结构化、可校验、可迁移。
3. 支持官方默认、仓库自定义、CLI 参数覆盖的分层模型。
4. 支持标准规范、插槽、适配器、国际化和 CI 配置。

## 2. 配置格式选择

当前建议采用以下策略：

1. 主配置文件使用 `YAML` 作为作者面格式。
2. 运行时使用 `JSON Schema` 做结构校验。
3. 报告输出和内部中间结果可使用 `JSON`。

这样选择的原因：

1. YAML 更适合手写和加注释。
2. JSON Schema 更适合做程序校验和版本迁移。
3. 可以兼顾人类可维护性和工具可执行性。

## 3. 目录结构草案

建议在仓库根目录生成如下结构：

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

目录职责如下：

1. `.repo-ai-governor/governor.yaml`
   - 仓库主配置文件
2. `.repo-ai-governor/slots/*.yaml`
   - 项目本地插槽定义
3. `.repo-ai-governor/adapters/*.yaml`
   - 工具适配器覆盖配置
4. `.repo-ai-governor/reports/`
   - 默认报告输出目录
5. `.repo-ai-governor/templates/`
   - 预留给模板覆盖或扩展使用
6. `AGENTS.md`
   - 仓库级 AI 执行入口文件
7. `docs/<project>/sprint-xxx/`
   - 当前项目和当前 sprint 的任务产物目录
8. `docs/<project>/sprint-xxx/tasks/`
   - 单任务明细文档目录
9. `docs/<project>/sprint-xxx/code-review/`
   - 状态化 CR 文档目录，文件名应包含任务编号或变更主题 slug

### 3.1 命名规则

默认命名约定如下：

1. `<project>` 使用小写 kebab-case，例如 `mvp`、`platform-core`
2. `sprint` 目录固定使用 `sprint-xxx`，编号使用三位数字，例如 `sprint-001`
3. 单任务文件固定使用 `TK-xxx.md`
4. 插槽文件固定使用 `.repo-ai-governor/slots/*.yaml`
5. 适配器文件固定使用 `.repo-ai-governor/adapters/*.yaml`
6. CR 文件状态流转固定为 `review_<slug>.md` -> `verified_review_<slug>.md` -> `resolved_review_<slug>.md`
7. `<slug>` 使用小写 kebab-case，且应包含任务编号或变更主题，例如 `tk-101-design-config-layout`

当前 sprint 内的落地样例见 [docs/mvp/sprint-001/repository-layout-conventions.md](./mvp/sprint-001/repository-layout-conventions.md)。

## 4. 配置分层模型

运行时配置按以下优先级合并，越靠后优先级越高：

1. 内置官方默认配置
2. 语言模板默认配置
3. 仓库主配置
4. 本地插槽配置
5. 适配器局部配置
6. 环境变量覆盖
7. CLI 参数覆盖

冲突规则：

1. 标量值以后者覆盖前者。
2. 对象按键合并。
3. 列表默认整体替换，必要时支持显式合并策略。
4. 冲突且无法自动决策时，直接报错并提示来源。

## 5. 主配置结构

主配置文件建议包含以下顶层字段：

```yaml
schemaVersion: "1"
project:
  name: repo-ai-governor
  language: typescript
  framework: node
workflow:
  template: standard
  stages: []
standards:
  preset: official/base
  locales:
    default: zh-CN
    supported:
      - zh-CN
      - en-US
slots:
  enabled:
    - security-review
    - doc-output
adapters:
  enabled:
    - codex
    - github-copilot
    - claude-code
execution:
  currentProject: mvp
  currentSprint: sprint-001
automation:
  mode: assisted
  permissions:
    allowCommit: true
    allowPush: true
    allowPullRequest: true
    allowSecretsEdit: false
    allowInfraEdit: false
    allowDangerousCommands: false
ci:
  enabled: true
  failOn:
    - errors
reporting:
  outputDir: .repo-ai-governor/reports
  formats:
    - summary
    - markdown
    - json
artifacts:
  baseDir: docs
  structure: project-sprint
  files:
    index: index.md
    plan: plan.md
  directories:
    tasks: tasks
    codeReview: code-review
  taskFiles:
    checklist: checklist.md
    csv: tasks.csv
    csvColumns:
      - execution_id
      - task_id
      - title
      - owner
      - priority
      - due_date
      - status
      - project
      - sprint
      - plan
      - result
      - verify
      - review_delta
      - recorded_at
  reviewFiles:
    pending: review_<slug>.md
    verified: verified_review_<slug>.md
    resolved: resolved_review_<slug>.md
agentEntry:
  target: AGENTS.md
  mode: generated-from-structured-config
```

## 6. 顶层字段定义

### 6.1 `schemaVersion`

用途：

1. 标识当前配置 schema 版本。
2. 用于兼容性检查和迁移。

规则：

1. 必填。
2. MVP 固定为 `"1"`。

### 6.2 `project`

用途：

1. 描述当前仓库基础信息。
2. 用于选择默认模板和规范包。

建议字段：

1. `name`
2. `language`
3. `framework`
4. `packageManager`
5. `rootDir`

### 6.3 `workflow`

用途：

1. 指定治理流程模板。
2. 定义阶段启用情况和门禁策略。

建议字段：

1. `template`
2. `stages`
3. `allowSkipStages`
4. `stopOnFailure`
5. `requireHumanApprovalFor`

### 6.4 `standards`

用途：

1. 指定标准规范来源和渲染策略。
2. 配置双语输出能力。

建议字段：

1. `preset`
2. `overrides`
3. `locales.default`
4. `locales.supported`
5. `render.aiView`
6. `render.humanView`

### 6.5 `slots`

用途：

1. 启用或禁用插槽。
2. 控制项目本地插槽的覆盖行为。

建议字段：

1. `enabled`
2. `disabled`
3. `directory`
4. `conflictPolicy`

### 6.6 `adapters`

用途：

1. 控制各类工具入口的适配器启用情况。
2. 为不同工具提供单独覆盖项。

建议字段：

1. `enabled`
2. `directory`
3. `defaults`
4. `strictMode`

### 6.7 `automation`

用途：

1. 描述自动化模式和权限边界。
2. 为 MVP+1 的自动模式预留统一入口。

建议字段：

1. `mode`
2. `permissions`
3. `gates`
4. `audit`

注意：

1. MVP 阶段只要求字段存在并可校验。
2. 完整自动模式不属于 MVP 范围。

### 6.8 `execution`

用途：

1. 标识当前执行的项目和 sprint。
2. 为任务拆解和报告输出提供稳定目录上下文。

建议字段：

1. `currentProject`
2. `currentSprint`
3. `taskPrefix`
4. `defaultOwner`

### 6.9 `ci`

用途：

1. 控制 CI 运行行为。
2. 定义失败条件和输出模式。

建议字段：

1. `enabled`
2. `commandProfile`
3. `failOn`
4. `writeJsonReport`
5. `writeMarkdownReport`

### 6.10 `reporting`

用途：

1. 控制报告输出目录和格式。
2. 指定默认终端展示风格。

建议字段：

1. `outputDir`
2. `formats`
3. `overwrite`
4. `includeSummary`

### 6.11 `artifacts`

用途：

1. 定义项目/sprint 产物的输出目录。
2. 约束 checklist、CSV 字段和状态化 CR 文档的文件名。

建议字段：

1. `baseDir`
2. `structure`
3. `files`
4. `directories`
5. `taskFiles`
6. `reviewFiles`

### 6.12 `agentEntry`

用途：

1. 定义仓库级 AI 入口文件的输出方式。
2. 约束 `AGENTS.md` 与结构化配置之间的关系。

建议字段：

1. `target`
2. `mode`
3. `includeSections`

## 7. 阶段配置结构

`workflow.stages` 建议采用如下结构：

```yaml
workflow:
  template: standard
  stages:
    - id: plan
      enabled: true
      required: true
      onFailure: stop
    - id: breakdown
      enabled: true
      required: true
      onFailure: stop
    - id: implement
      enabled: true
      required: true
      onFailure: continue
    - id: self-check
      enabled: true
      required: true
      onFailure: stop
    - id: review
      enabled: true
      required: true
      onFailure: stop
    - id: review-verify
      enabled: true
      required: true
      onFailure: stop
```

阶段字段说明：

1. `id`
   - 阶段标识
2. `enabled`
   - 是否启用
3. `required`
   - 是否为必须阶段
4. `onFailure`
   - 失败后的处理方式
5. `requiresApproval`
   - 是否要求人工确认

## 8. 规范覆盖结构

`standards.overrides` 可用于局部覆盖官方规范：

```yaml
standards:
  preset: official/base
  overrides:
    code:
      naming: required
      comments: recommended
    quality:
      tests: required
      coverage:
        min: 80
```

建议规则：

1. 覆盖只允许改配置值，不允许直接破坏数据结构。
2. 强约束降低为建议项时，应给出明确警告。

## 9. 插槽配置结构

单个插槽文件建议如下：

```yaml
id: security-review
version: "1"
kind: governance-slot
meta:
  name:
    zh-CN: 安全审查
    en-US: Security Review
  owner: platform
trigger:
  when:
    paths:
      - src/**
    stages:
      - review
scope:
  languages:
    - typescript
behavior:
  blockOnFailure: true
  priority: 100
  inject:
    ai:
      promptKey: security-review
    human:
      docSection: security-review
checks:
  before: []
  after: []
```

字段说明：

1. `id`
   - 插槽唯一标识
2. `version`
   - 插槽自身版本
3. `meta`
   - 名称、负责人、说明
4. `trigger`
   - 触发条件
5. `scope`
   - 适用范围
6. `behavior`
   - 优先级、阻断、注入方式
7. `checks`
   - 前置或后置检查

## 10. 适配器配置结构

单个适配器文件建议如下：

```yaml
id: codex
version: "1"
type: ide-or-cli
enabled: true
capabilities:
  promptInjection: true
  structuredOutput: true
  toolCalling: true
injection:
  mode: file-and-template
  sources:
    - standards
    - workflow
    - slots
render:
  locale: zh-CN
  views:
    - ai
policy:
  strictWorkflow: true
```

关键字段：

1. `capabilities`
   - 描述工具能力差异
2. `injection`
   - 规定如何注入规则
3. `render`
   - 指定渲染语言和视图
4. `policy`
   - 定义是否严格执行流程约束

## 11. 自动化权限结构

`automation.permissions` 建议如下：

```yaml
automation:
  mode: assisted
  permissions:
    allowRead: true
    allowEditCode: true
    allowEditDocs: true
    allowRunChecks: true
    allowCommit: true
    allowPush: true
    allowPullRequest: true
    allowSecretsEdit: false
    allowInfraEdit: false
    allowProductionConfigEdit: false
    allowDangerousCommands: false
```

`automation.gates` 建议如下：

```yaml
automation:
  gates:
    requireApprovalFor:
      - dependency-upgrade
      - lockfile-large-change
      - database-migration
      - ci-workflow-change
      - release-script-change
      - large-refactor
```

## 12. 任务产物配置结构

```yaml
execution:
  currentProject: mvp
  currentSprint: sprint-001
artifacts:
  baseDir: docs
  structure: project-sprint
  files:
    index: index.md
    plan: plan.md
  directories:
    tasks: tasks
    codeReview: code-review
  taskFiles:
    checklist: checklist.md
    csv: tasks.csv
    csvColumns:
      - execution_id
      - task_id
      - title
      - owner
      - priority
      - due_date
      - status
      - project
      - sprint
      - plan
      - result
      - verify
      - review_delta
      - recorded_at
  reviewFiles:
    pending: review_<slug>.md
    verified: verified_review_<slug>.md
    resolved: resolved_review_<slug>.md
```

默认输出目录约定：

1. 任务拆解结果写入 `docs/<project>/sprint-xxx/`
2. 单任务文件写入 `docs/<project>/sprint-xxx/tasks/`
3. 评审文档写入 `docs/<project>/sprint-xxx/code-review/`
4. `tasks/checklist.md` 使用单列表记录任务，不按状态分组
5. checklist 中每个任务条目至少包含任务编号、标题、负责人、优先级、截止日期、状态，并支持追加多条 `执行记录`
6. `tasks/tasks.csv` 采用追加式执行台账，每条执行记录一行，字段至少包含 `execution_id`、`task_id`、`title`、`owner`、`priority`、`due_date`、`status`、`project`、`sprint`、`plan`、`result`、`verify`、`review_delta`、`recorded_at`
7. 复核结果直接追加到同一个 CR 文件中
8. CR 文件状态流转为 `review_<slug>.md` -> `verified_review_<slug>.md` -> `resolved_review_<slug>.md`

## 13. 报告配置结构

```yaml
reporting:
  outputDir: .repo-ai-governor/reports
  formats:
    - summary
    - markdown
    - json
  fileNames:
    summary: latest.txt
    markdown: latest.md
    json: latest.json
```

MVP 约束：

1. 终端摘要始终可用。
2. JSON 报告优先保证稳定性，便于 CI 消费。
3. Markdown 报告用于人类阅读和归档。

## 14. 校验与迁移策略

MVP 建议支持三类校验：

1. schema 校验
2. 语义校验
3. 路径校验

具体示例：

1. `schemaVersion` 缺失时直接失败
2. 启用未知适配器时失败
3. 启用的插槽文件不存在时失败
4. 输出目录不可写时告警或失败

迁移策略建议：

1. 配置中必须包含 `schemaVersion`
2. `upgrade` 命令负责迁移模板和配置结构
3. 破坏性迁移需先生成备份或预览结果

## 15. MVP 明确不做的配置能力

1. 远程配置源拉取
2. 组织级权限继承
3. 脚本型插槽正式执行配置
4. 多仓库集中式配置联动

## 16. 建议的下一步

如果要进入实现，建议下一步先产出：

1. `governor.yaml` 的 JSON Schema 文件草案
2. 插槽 schema 文件草案
3. 适配器 schema 文件草案
