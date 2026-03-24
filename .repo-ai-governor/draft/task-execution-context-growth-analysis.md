# 当前任务执行上下文增长分析（Draft）

- Status: draft
- Date: 2026-03-24
- Owner: AI-Agent
- Scope: repo-local task execution workflow / context loading / task ledger maintenance
- Related Task: n/a

## 1. 目的

将“本项目现在执行一个任务所占的上下文越来越长”的现状梳理为一份可落地分析，明确：

1. 当前实际执行流程是什么。
2. 上下文长度主要增长在哪些环节。
3. 后续应优先优化哪些点。

## 2. 当前执行流程梳理

当前仓库里实际上并行存在两条执行链。

### 2.1 仓库级 AI 执行链

1. 启动时读取 `AGENTS.md`、`current-context.md`、规范文档与治理文档。
2. 根据 `current-context.md` 锁定当前主执行流与任务路径。
3. 进入对应 `project/sprint/tasks/review` 目录维护：
   - `plan.md`
   - `tasks/TK-xxx.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `review/`
4. 任务完成后继续经历 review 生命周期与台账回填。

### 2.2 产品 CLI 治理链

1. bootstrap：`init -> doctor -> check`
2. 任务主链：`plan -> run -> review -> review-verify`
3. `run` 内部固定为：
   - `compiler`
   - `runtime`
   - `policy`
   - `audit/report`
4. `review` 目前只负责写 queued artifact。
5. `review-verify` 负责消费 queued artifact，并继续写 `ledger-backfill` artifact。

### 2.3 当前链路的关键特点

1. 文档治理链和 CLI 产物链是叠加的，不是二选一。
2. 对一个任务来说，既要读执行规范，又要读当前 project/sprint/task 文档，还要理解 CLI 当前主链与审计/台账产物。
3. 因此“执行一个任务”的上下文长度，实际上由“规范加载 + 任务文档加载 + 历史执行流残留 + 门禁要求”共同决定。

## 3. 当前上下文增长信号

### 3.1 启动必读集合偏大

本次按当前仓库规则实际查看到的启动相关文档体量如下：

1. `AGENTS.md`：`5057` bytes
2. `current-context.md`：`10179` bytes
3. `product-requirements-brief.md`：`6421` bytes
4. `repo-ai-governor-overall-technical-solution.md`：`33516` bytes
5. `repo-ai-governor-architecture-and-repo-layering.md`：`21687` bytes
6. `code_standards.md`：`13095` bytes
7. `long-term-maintenance-guide.md`：`7348` bytes
8. `normative-loading-manifest.yaml`：`7050` bytes

合计约 `104353` bytes。

这说明当前“默认启动上下文”即使还没进入具体任务，本身已经不轻。

### 3.2 `current-context.md` 持续携带历史流

当前 `current-context.md` 中共有 `11` 条 stream 记录：

1. `1` 条 `planned`
2. `10` 条 `completed`

同时每条 stream 描述行平均长度约 `843` 个字符，最长一行约 `907` 个字符。

也就是说，虽然这些历史流已经完成，但当前上下文文件仍长期携带它们的路径、计划、台账和 review 入口。

### 3.3 单任务文档包本身已经成组膨胀

以当前主流 `project-010 / sprint-002 / TK-099` 为例，仅常见执行入口文件就有：

1. `project plan`：`11511` bytes
2. `sprint plan`：`1467` bytes
3. `TK-099`：`3486` bytes
4. `checklist.md`：`497` bytes
5. `tasks.csv`：`1405` bytes

合计约 `18366` bytes。

这还没有把依赖任务卡、handoff 文档、triad 文档和 review 文档算进去。

## 4. 当前主要问题

### 4.1 启动契约不一致

`AGENTS.md` 要求在规划或执行前直接读取 solution / architecture / brief / standards / maintenance；但 `normative-loading-manifest.yaml` 明确把 triad 中的 solution 与 architecture 放在 `L1`，默认应按触发条件补载，而不是对所有任务默认加载。

结果是：

1. manifest 已经定义了“分层 + 按需加载”。
2. 实际 agent 启动规则仍偏向“重加载”。
3. 规范层已经设计了优化，但执行入口没有完全跟上。

### 4.2 `current-context.md` 语义上是“活动流”，实现上像“活动流 + 历史目录索引”

这个文件原本应该提供当前可变执行状态，但现在还保留了大量 completed stream。

问题在于：

1. 它会放大 agent 启动阅读量。
2. `check-task-ledger-sync.js` 会把这些行全部当作 active streams 解析。
3. 历史流越多，后续每次任务启动成本越高。

### 4.3 `TK` 单写源原则没有真正收敛成单写源

规范里已经声明：

1. `TK` 是 canonical source。
2. `checklist` 与 `tasks.csv` 是派生台账。

但当前实际使用中，同一批任务信息仍会同时分布在：

1. project plan 的任务矩阵
2. sprint plan 的 in-scope tasks
3. `TK-xxx.md`
4. `checklist.md`
5. `tasks.csv`

这会带来两个直接后果：

1. AI 在执行前往往会“保险起见多读几份”。
2. 状态同步要求越强，上下文越容易膨胀成“读完所有台账再动手”。

### 4.4 TK 输入引用过多，容易诱发全量阅读

例如 `TK-099` 的 `Input References` 一次列了 `10` 条输入，其中包含：

1. project plan
2. sprint plan
3. 上一 sprint task
4. master execution plan
5. triad 文档
6. project-011 handoff 文档与 completion audit

这类写法的好处是可追溯，但坏处也很明显：

1. agent 很容易把“可追溯输入”误读成“执行前必须全部读完”。
2. 任务越复杂，输入引用越多，默认上下文就越容易失控。

### 4.5 Review 子链仍靠串命令和串工件推进

当前主链虽然已经在 README 和 E2E 中固定为：

1. `plan`
2. `run`
3. `review`
4. `review-verify`
5. `replay`

但实现上：

1. `plan` 只是写一个 snapshot
2. `review` 只是写 queued request
3. `review-verify` 继续写 verify artifact 和 `ledger-backfill`
4. ledger 仍等待下游人工或外部流程消费

这意味着：

1. 一个任务除了读规范和任务文档，还要理解多段 artifact 语义。
2. 主链被拆成多个显式命令，也会推高执行所需的上下文切换成本。

### 4.6 门禁分层已定义，但任务执行语义还不够收敛

仓库已经有 `Fast Gate` 和 `Release Gate` 的分层规范。

但在具体任务里，仍然容易出现：

1. 开发中阶段和交付前阶段的验证边界不够清晰。
2. 任务卡把大量重门禁命令作为默认验证项。
3. AI 倾向把完整 gate 理解成“当前就应该全部关注”。

结果是上下文不仅变长，还会把“当前最需要看的信息”和“交付时才需要看的信息”混在一起。

## 5. 结论

当前上下文变长，不是某一个文档单独过长，而是以下 3 类问题叠加：

1. 默认加载规则没有完全按 manifest 落地。
2. 任务台账仍然多点并存，`TK` 单写源尚未真正收敛。
3. 历史执行流、review 工件链和门禁信息持续混入当前任务入口。

换句话说，问题本质不是“某份文档太长”，而是“当前任务入口承载了太多默认必须知道的信息”。

## 6. 优化建议与优先级

### 6.1 P0：统一启动基线

目标：

1. 让 agent 启动默认只读真正的 `L0`。
2. 把 solution / architecture 改为按需补载。

建议动作：

1. 对齐 `AGENTS.md` 与 `normative-loading-manifest.yaml`
2. 默认启动集合收敛为：
   - `current-context.md`
   - `product-requirements-brief.md`
   - `code_standards.md`
   - `long-term-maintenance-guide.md`
3. 仅在架构变更、运行时契约变更、分层变更时再补载：
   - `repo-ai-governor-overall-technical-solution.md`
   - `repo-ai-governor-architecture-and-repo-layering.md`

### 6.2 P0：瘦身 `current-context.md`

目标：

1. 保持它只服务“当前可执行流”。
2. 把历史完成流从默认上下文中移除。

建议动作：

1. `current-context.md` 只保留：
   - `primary`
   - 仍未完成的并行 stream
2. 新增一个单独的历史索引文件保存 completed streams。
3. 调整 `check-task-ledger-sync.js`，默认只扫描非 completed streams。

### 6.3 P0：真正落实 TK 单写源

目标：

1. 让 `TK` 真正成为 canonical execution source。
2. 让 checklist 和 CSV 退化为派生视图。

建议动作：

1. project/sprint plan 中不再维护 task 级重复状态矩阵。
2. `checklist.md` 只保留任务可视状态与少量执行记录摘要。
3. `tasks.csv` 只保留机器审计必需字段。
4. 建立从 `TK` 自动同步 `checklist/tasks.csv` 的脚本或生成器。

### 6.4 P0：收紧 TK 输入引用

目标：

1. 把“执行必需输入”和“追溯可选输入”分开。

建议动作：

1. 将 `Input References` 拆成：
   - `Required Inputs`
   - `Traceback References`
2. `Required Inputs` 建议控制在 `3-5` 个。
3. handoff、completion audit、历史规划类文档默认进入 `Traceback References`，而不是默认执行入口。

### 6.5 P1：把 review 子链从“串命令”向“受控子链”收口

目标：

1. 降低任务执行时对多段 artifact 语义的心智负担。

建议动作：

1. 将 `review -> review-verify -> ledger-backfill` 设计为 `run` 可内联受控子链。
2. 保留 artifact 审计价值，但不要求执行者手动串每一步。
3. 对外暴露更高层级的状态，而不是让当前任务处理一堆队列工件。

### 6.6 P1：让 gate 分层真正进入任务模板

目标：

1. 开发时只关注 Fast Gate。
2. 交付时再关注 Release Gate。

建议动作：

1. 在 TK 模板中明确区分：
   - `Development Verification`
   - `Delivery Verification`
2. 任务进行中默认只要求 Fast Gate。
3. 只有状态切换到 `completed` 或进入交付窗口时才要求 Release Gate。

### 6.7 P2：为运行时内存快照提前做选择性加载准备

目标：

1. 避免 sprint-002 后真正接入任务驱动 DAG、artifact dependency、session memory 时，内存层再次扩大默认上下文。

建议动作：

1. 不再默认全量拉取所有 `normative/execution/session` entries。
2. 改为基于：
   - `executionId`
   - `taskId`
   - `active stream`
   - `artifact dependency`
   做定向查询与注入。

## 7. 推荐执行顺序

1. 先做启动基线对齐。
2. 再做 `current-context` 瘦身。
3. 随后推进 `TK` 单写源与任务模板收敛。
4. 最后把 review 子链和运行时 memory 注入改成选择性装配。

## 8. 一句话总结

当前任务上下文越来越长，并不是因为仓库“文档多”本身，而是因为“默认入口读太多 + 活跃上下文混入历史流 + 任务事实源没有真正单点收敛”。

只要先把默认加载、活跃流边界和 `TK` 单写源这三件事收紧，单任务上下文长度就会明显下降。
