# Review Command Runtime

- Date: 2026-03-13
- Task: `TK-207`
- Status: done

## Goal

把 `review` 命令从占位输出推进为真实可执行的最小治理评审入口，复用 Governance Engine 和标准规范包，对指定路径或 git 工作区变更生成结构化结论与状态化 CR 文件。

## Delivered

1. 新增 `src/commands/review-command.js`，完成：
   - 当前项目与 sprint 上下文解析
   - `review` 单阶段治理执行流程
   - 指定 `--path` 与默认 git working tree 目标发现
   - TODO / FIXME / HACK 风险提示
   - `src/` 到 `test/` 的镜像测试检查
   - `tasks/checklist.md`、`tasks.csv`、任务卡同步检查
   - `review_<slug>.md` 状态化 CR 落盘
2. 更新 `src/cli/index.js`，把 `review` 命令从注册占位切到真实执行逻辑。
3. 新增 `test/commands/review-command.test.js`，覆盖：
   - 警告型评审发现与 CR 落盘
   - 任务台账不同步时的阻断失败
   - 镜像测试存在时的通过场景
   - 默认从 git working tree 推断评审目标

## Runtime Flow

1. 读取 `governor.yaml` 和当前 CLI 覆盖项。
2. 解析 `official/base` 的 review-facing 规范内容。
3. 发现评审范围：
   - 优先使用 `--path`
   - 否则回退到 git diff / git status 结果
4. 通过 Governance Engine 执行 `review` 阶段：
   - 生成 findings
   - 汇总 matched rules
   - 计算 pass / warn / fail 状态
5. 写入 `code-review/review_<slug>.md`，并同步输出终端或 JSON 结果。

## Validation Scope

当前 MVP 最小评审重点覆盖：

1. 源码文件是否存在镜像测试文件
2. 文件内是否残留 TODO / FIXME / HACK 等未显式关闭的风险标记
3. 当前 sprint 的 checklist、CSV 与任务卡是否保持同步
4. 是否能为指定范围生成可复核的 CR 文件

## Validation

1. `test/commands/review-command.test.js`
2. `npm run check`
3. 当前仓库 53 个测试全部通过

## Follow-up

1. `TK-208` 可以直接复用当前 CR 文件和 findings 模型实现复核追加与状态流转。
2. `TK-501` 可以把当前 `check` 与 `review` 的结构化输出统一到一套报告模型中。
