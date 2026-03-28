# Repo AI Governor 多 AI 工具便捷接入技术方案（Draft）

- Status: draft
- Date: 2026-03-23
- Scope: local adoption / project-009 stage-9 follow-up
- Related:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 1. 背景与问题

当前多 AI 工具接入路径偏手工：

1. 用户需要手写 `governor.yaml` 的 `roles`。
2. 用户需要手动判断本机工具是否可用（命令、登录态、权限）。
3. 用户需要自行从 `run --trace` 结果判断是否接线成功。

结果是首日接入成本高、误配率高、排障路径不统一。

## 2. 目标

1. 提供“一条命令可起步”的便捷接入能力。
2. 提供“可探测、可修复、可验证”的标准链路。
3. 保持与现有 `Role Registry + Adapter SDK + routeKey` 契约兼容。
4. 首版直接引入结构化 `adapters/routing` 契约，支持“单工具多角色”与“多工具分角色”两种模式。

## 3. 非目标

1. 本方案不在本阶段实现完整可视化控制台。
2. 本方案不改变核心治理策略（`allow/confirm/block/escalate`）。
3. 本方案不为旧配置兼容引入复杂迁移逻辑（当前无历史包袱）。

## 4. 总体方案（Fast Onboarding Chain）

新增三段式接入链路：

1. `connect`：生成/更新角色与推荐路由基线。
2. `doctor --adapters [--fix]`：探测工具可用性并自动修复可修复项。
3. `verify --adapters`：执行最小联调并输出统一可用性矩阵。

建议用户体验：

```bash
pnpm exec repo-ai-governor connect --tools codex,claude-code,github-copilot --preset multi-tool-default
pnpm exec repo-ai-governor doctor --adapters --fix --output pretty
pnpm exec repo-ai-governor verify --adapters --output json
```

单工具覆盖全部角色（例如全流程只使用 Codex）：

```bash
pnpm exec repo-ai-governor connect --tools codex --preset single-tool-all-roles
pnpm exec repo-ai-governor verify --adapters --output json
```

## 5. 功能设计

## 5.1 `connect` 命令

命令目标：把“从 0 到可运行配置”的动作收敛为一次写入。

输入参数（Draft）：

1. `--tools <csv>`：`codex|claude-code|github-copilot`。
2. `--preset <id>`：默认 `multi-tool-default`。
3. `--dry-run`：仅输出变更预览，不落盘。
4. `--overwrite`：允许覆盖冲突片段。
5. `--single-tool-all-roles <tool>`：快捷把全部启用角色绑定到同一工具。
6. `--role-binding <roleProfileId=tool[,fallbackTool...]>`：可重复传入，显式覆盖模板绑定。

行为：

1. 读取并校验现有 `governor.yaml`。
2. 生成缺失的 `roles[]` 行，并生成 `routing.roleBindings`（支持同一工具映射多个角色）。
3. 在 workspace context 写入接入快照：
   - `context/onboarding/connect/<timestamp>.json`
4. 输出变更摘要（新增角色、跳过角色、冲突项）。

## 5.2 `doctor --adapters [--fix]`

命令目标：把“环境探测 + 常见修复建议”结构化。

探测维度：

1. 可执行探测：工具命令是否可调用。
2. 认证探测：登录态是否满足最小运行要求。
3. 能力探测：是否支持本仓库基线能力（由 adapter probe 统一返回）。
4. 风险探测：受限网络模式下的降级可行性。

`--fix` 策略：

1. 仅执行安全修复（例如创建缺失目录、修复本地可写缓存目录）。
2. 对需要人工行为的项仅给可执行指令（例如登录）。
3. 所有修复动作写审计：
   - `context/diagnostics/adapters/doctor-<timestamp>.json`

## 5.3 `verify --adapters`

命令目标：用最小成本给出“是否可用”的最终结论。

行为：

1. 基于当前角色/路由配置，对已启用工具执行 `probe` + 最小 `invokeStage` dry-run。
2. 汇总输出统一矩阵字段：
   - `tool`, `surface`, `roleProfileId`, `availability`, `capabilitySupport`, `routeCoverage`, `nextAction`
3. 产出标准化验证报告：
   - `context/diagnostics/adapters/verify-<timestamp>.json`

通过标准（Draft）：

1. 所有“必需角色绑定”均存在至少 1 个 `available` 的 primary 工具。
2. 任一必需角色若 primary 不可用，必须存在可用 fallback，否则判定 `fail`。
3. 不可用项均有可执行 `nextAction`。
4. 结果可回链到 `execution_id` 与 trace 产物。

## 5.4 预置模板（Preset）

首批模板：

1. `single-tool-minimal`
2. `multi-tool-default`
3. `single-tool-all-roles`
4. `restricted-network-safe`

模板作用：

1. 生成推荐角色集（Planner/Coder/Reviewer 最小闭环）。
2. 生成推荐路由策略（主备 surface 与降级策略，支持 1 个工具绑定多个角色）。
3. 输出风险提示（例如某工具只建议用于低风险 route）。

## 6. 配置与契约策略（阶段 A 直接引入）

项目尚未上线，阶段 A 直接引入 `adapters/routing`，不保留兼容层。

1. `governor.yaml` 新增必需配置段：
   - `adapters.tools`
   - `routing.roleBindings`
2. `roles[]` 继续负责角色语义与生命周期。
3. `routing.roleBindings` 负责“角色 -> 工具主备绑定”，允许同一工具绑定多个角色。
4. `connect` 默认生成完整 `roles + adapters + routing` 三段配置。

示例（Codex 覆盖所有角色）：

```yaml
schemaVersion: "1.2"
adapters:
  tools:
    codex:
      enabled: true
routing:
  roleBindings:
    planner-default:
      primary: codex
      fallbacks: []
    architect-default:
      primary: codex
      fallbacks: []
    coder-default:
      primary: codex
      fallbacks: []
    tester-default:
      primary: codex
      fallbacks: []
    reviewer-default:
      primary: codex
      fallbacks: []
    verifier-default:
      primary: codex
      fallbacks: []
```

## 7. 模块落点（Monorepo）

1. `apps/cli`
   - 新增命令入口：`connect`、`verify --adapters`、`doctor --adapters` 扩展。
2. `packages/adapter-sdk`
   - 新增/增强探测聚合器（probe runner）与能力矩阵归一化。
3. `packages/config`
   - 新增 `adapters/routing` schema 与校验逻辑（阶段 A mandatory）。
4. `packages/reporting`
   - 适配 adapter 验证矩阵报告构建。
5. `packages/shared`
   - 统一错误码、i18n 文案键、常量枚举。

## 8. 输出契约（Draft）

`verify --adapters --output json` 最小字段：

1. `schema_version`
2. `execution_id`
3. `summary`：`passed/failed/warn`
4. `tool_matrix[]`
   - `tool`
   - `surface`
   - `role_profile_id`
   - `availability_status`
   - `capability_gap[]`
   - `route_coverage[]`
   - `next_action`
5. `role_binding_matrix[]`
   - `role_profile_id`
   - `primary_tool`
   - `fallback_tools[]`
   - `binding_status`
6. `artifacts[]`
   - `diagnostics_trace`
   - `doctor_report`
   - `verify_report`

## 9. 失败与降级策略

1. 任一工具不可用不应直接阻断整体接入，只要存在可用主链路。
2. 若全部工具不可用，返回阻断并给出按优先级排序的修复步骤。
3. 受限网络下优先走本地 fallback 路径，并在结果中显式标注 `degraded`。

## 10. 验证与门禁

测试建议（Vitest）：

1. `apps/cli/test`
   - `connect` 配置写入/合并测试。
   - `doctor --adapters --fix` 可修复项测试。
   - `verify --adapters` 输出契约测试。
2. `packages/adapter-sdk/test`
   - probe 结果归一化与 capability gap 判定测试。
3. 根级 `test/`
   - 多工具接入 smoke/integration（含 restricted network 情况）。

门禁接线建议：

1. 将 adapter onboarding smoke 纳入 `pnpm run test:packages` / `pnpm run test:integration`。
2. 复用现有 `check` 链路，不新增绕过门禁路径。

## 11. 实施阶段建议

1. Phase 1（快速收益）
   - `connect` + `doctor --adapters` 探测输出。
2. Phase 2（可验证闭环）
   - `verify --adapters` + 标准矩阵报告。
3. Phase 3（策略优化）
   - 补齐模板生态、角色绑定可视化与更细粒度路由策略优化。

## 12. 评审结论（已采纳）

1. 阶段 A 是否引入 `adapters/routing`
   - 结论：阶段 A 直接引入，并作为 schema 必需段。
2. `doctor --fix` 自动修复边界（已采纳）
   - 决议：默认仅允许 `safe_local` 修复：创建目录、补齐模板配置、修复本地文件格式与可写权限。
   - 禁止自动执行高风险动作：登录/鉴权、网络代理改写、权限上限提升、发布/部署相关改动。
   - 需要高风险修复时，只输出 `nextAction`，由用户手工执行。
3. `verify --adapters` 通过阈值（已采纳）
   - `pass`：所有必需角色绑定都存在可用 primary；若 primary 不可用，至少 1 个 fallback 可用。
   - `warn`：全部可用但存在 capability `degraded`，且不影响必需流程闭环。
   - `fail`：任一必需角色无可用工具，或必需能力缺口导致流程不可闭环。
4. `connect` 回写台账 vs 仅写 diagnostics artifact（已采纳）
   - 区别：diagnostics 是高频运行事实；任务台账是项目管理事实，粒度更粗。
   - 决议：默认只写 diagnostics artifact；当显式传入 `--record-ledger --task-id <TK-xxx>` 时再回写任务台账，避免台账噪音。

## 13. 结论（Draft）

本方案采用“阶段 A 直接结构化收敛”：

1. 先把接入体验标准化（connect/doctor/verify）。
2. 同步引入 `adapters/routing` 必需配置并明确单工具多角色能力。
3. 全程复用现有治理链路与审计契约，避免出现第二套旁路流程。

## 14. 当前能力现状判断与缺口对照

从现状看，这个仓库已经不是“能不能让多个 AI 工具一起工作”的起步阶段，而是“技术底座基本到位，产品入口还没完全产品化”的阶段。

更具体地说，现有代码已经具备以下事实：

1. 多工具适配已经成立，`Codex / Claude Code / GitHub Copilot / Local Model` 都可以进入统一的 adapter 路由与能力探测链路。
2. 多角色编排已经成立，`planner / architect / coder / tester / reviewer / verifier` 的默认角色关系已经在 CLI 侧落地。
3. 治理运行时已经成立，`connect / doctor / verify / run / review / review-verify / HITL` 这条链路不是空白，而是实装中的治理闭环。
4. 还没有完全成立的是“用户一眼就能用”的协同编程产品入口，也就是让用户不用理解太多底层概念，就能快速完成多工具协作接入、角色分配、状态查看与失败回退。

因此，这份方案更适合被表述为：

1. 不是从零搭建多 AI 工具协同能力。
2. 而是在已有多工具治理底座上，补一个更顺手、更统一、更可验证的接入层。

### 14.1 当前已支持 vs 还缺什么

| 维度 | 当前已支持 | 还缺什么 |
|---|---|---|
| 技术底座 | 统一 adapter 路由已存在，支持 Codex / Claude Code / GitHub Copilot / 本地模型；角色绑定和 fallback 规则已在 CLI 默认配置中体现；治理运行时、审计、HITL、report、artifact 这些基础能力已经实装。 | 还缺一层面向用户的“协同编程产品骨架”，把底层 adapter、角色、路由、策略和输出整合成更稳定的上层能力声明，而不是主要依赖内部约定。 |
| 工作流 | `connect -> doctor -> verify -> run -> review -> review-verify` 的治理链路已经存在；任务驱动编排、风险判定、回灌与审计也已经可以承载多角色协作。 | 还缺一个更明确的“多工具协作模板”与“角色分配向导”，让用户能快速选定哪些角色由哪些工具承担，并且把失败回退、降级策略、人工接管点前置表达出来。 |
| UI 入口 | CLI 已经支持结构化输出、TTY 判定、命令级执行，以及部分交互式 bootstrap；`connect`/`doctor`/`verify` 这类动作已经具备可操作的命令入口。 | 还缺统一的交互式入口壳层，最好能把“选工具、配角色、看状态、处理异常”放进同一条可视流程，而不是分散在多个命令和输出里。 |
| 外部可用性 | 产品主线已经明确“接入任意 AI 工具，在目标仓库中按统一流程协同开发”；文档和 gap 分析也明确当前是 `mostly_complete` 而非空白阶段。 | 还缺外部 adopter 视角的成熟度证明，包括更顺滑的首次接入体验、稳定的 clean-room 验证、清晰的最小支持矩阵，以及能直接指导团队上手的产品化说明。 |

### 14.2 结论

如果只看底层能力，当前仓库已经具备“多 AI 工具在同一仓库里协同编程”的核心技术条件。

如果看成品形态，当前还不是完全成熟的协同编程产品入口，主要短板不在“能不能做”，而在“能不能让用户不费力地用起来”。

所以这条路线的正确表述应该是：

1. 底层协同能力已经有。
2. 接下来要补的是统一接入体验和可验证的产品化入口。
3. 这个 fast onboarding 方案就是把“可协同”进一步变成“可快速接入、可持续使用、可稳定扩展”。
