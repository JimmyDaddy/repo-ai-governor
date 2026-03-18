# Repo AI Governor 执行简版 PRD

- 文档版本：brief-v1
- 状态：active
- 日期：2026-03-18
- 对齐来源：`docs/product-requirements.md`（完整版）
- 实施总纲：`docs/repo-ai-governor-overall-technical-solution.md`
- 工程蓝图：`docs/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 用途

本文件是 AI 执行任务时的默认目标约束，目的只有一个：避免实现偏离产品主线。

完整版 PRD 用于新迭代规划、能力对齐和范围变更，不作为日常执行的首选入口。

工具级架构与实施方针以 `docs/repo-ai-governor-overall-technical-solution.md` 为准。

## 2. 产品主线（一句话）

构建一个“流程化多 Agent 开发治理编排”工具，让用户在自己的仓库中接入任意 AI 工具（如 Codex、GitHub Copilot、Claude Code），按自定义流程自动化开发，并只在关键节点引入人工审批。

## 3. 治理对象与边界

1. 主治理对象是“接入本工具的目标仓库”。
2. 本仓库流程用于自举验证，不是产品主目标。
3. 若“本仓库开发便利性”与“目标仓库治理正确性”冲突，优先后者。

## 4. AI 实现不得偏离的核心能力

1. 多 Agent 编排：
   - 支持角色分工（如 Planner/Architect/Coder/Tester/Reviewer/Verifier）。
   - 支持流程节点：`Sequential`、`Parallel`、`Loop`、`Condition/Policy Route`。
   - `Loop` 节点必须同时声明 `maxCycles` 与 `maxWallTimeSeconds`。
2. 工具无关适配：
   - 允许不同角色由不同 AI 工具实现。
   - 所有工具必须服从同一流程和权限策略。
3. 策略化人工闸口（Human-in-the-Loop）：
   - 编码前必须完成方案评审通过。
   - Review Verify 连续失败达到阈值时，自动升级人工评审。
   - 高权限/高风险变更必须人工批准。
4. 审计与追踪：
   - 记录做了什么、为什么、触发了哪些规则、检查结果如何。
5. 角色与资源治理：
   - 支持用户自定义角色注册与 `role_profile_id` 生命周期管理。
   - Agent 契约必须声明时间/Token/成本预算约束。
6. Slot 脚本安全基线：
   - 脚本扩展必须受限沙箱执行，并采用权限白名单、资源配额、副作用声明与审计追踪。
7. 受限网络场景边界：
   - MVP 不承诺完全离线自动开发；受限网络下至少可运行本地治理检查与流程台账。
8. Workspace 持久化策略：
   - 每个仓库绑定独立 workspace。
   - 默认 `tool_managed`（工具侧目录）；用户可配置 `repo_local`（仓库 `.repo-ai-governor`）。

## 5. 必须人工确认的高风险场景

1. 依赖升级和锁文件大变更。
2. 数据库迁移。
3. CI 工作流修改。
4. 发布脚本/部署配置修改。
5. 密钥、基础设施、生产配置相关改动。
6. 跨目录大规模重构或不可逆操作。

## 6. 执行产物与流程约束（本仓库）

1. 任务执行必须跟随 `<workspace_root>/context/current-context.md` 的 active stream 路径。
   - 未配置时，`<workspace_root>` 默认由工具侧 `tool_managed workspace` 解析。
   - 配置 `workspace.mode=repo_local` 时，`<workspace_root>=.repo-ai-governor`。
2. 任务分解与记录必须同步到：
   - `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md`
3. Code review 文件生命周期：
   - `review_<slug>.md`
   - `verified_review_<slug>.md`
   - `resolved_review_<slug>.md`

## 7. 完成定义（执行层）

1. 实现目标没有偏离“目标仓库治理”主线。
2. 多 Agent 编排、工具适配、人工闸口三条主线至少覆盖其一且可验证。
3. 产物与记录路径符合 AGENTS 与上下文规则。
4. 验证命令遵循 `code_standards.md`。

## 8. 同步规则（强制）

1. `docs/product-requirements.md` 是完整需求源。
2. 任何对完整版 PRD 的变更，必须在同一变更集中同步更新本简版。
3. 若简版与完整版冲突，以“先修复冲突并同步”为第一优先级，再继续实现。
