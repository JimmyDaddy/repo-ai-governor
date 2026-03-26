# Repo AI Governor 当前工具现状与 PRD 差距评估

- Status: draft
- Date: 2026-03-26
- Scope: current tool state vs `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
- Basis:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
  - `README.md`
  - `apps/cli/README.md`
  - `packages/*`
  - `integrations/*`

## 1. 一句话结论

当前工具已经明显不是“只有想法和草图”的 MVP 原型了。核心治理架构、CLI 主链、多 Agent 编排、风险/HITL、审计回放、Artifact Registry、Standards/Slots、graph-first runtime 与多工具适配主干都已经落地。

但如果问题不是“架构能力在不在”，而是“它离 PRD 里描述的可稳定采用产品还有多远”，答案仍然是：还有一段明显距离。当前最主要的剩余差距不在内部治理层，而在外部 adopter 的打包分发真值、升级迁移 UX、试点仓库产品化闭环，以及 P2 平台化能力。

## 2. 评估口径

本次评估刻意使用两套口径：

1. `架构能力完成度`
   - 看核心模块、契约、命令面、gate、运行时是否已经存在并能互相闭环。
2. `外部产品化完成度`
   - 看目标仓库用户是否能通过稳定分发、清晰接入路径、可操作升级流程和正式支持矩阵去可靠采用。

如果只看第一套口径，当前仓库会显得非常接近完成态。
如果加入第二套口径，完成度会明显下降。

## 3. 总体判断

### 3.1 粗粒度完成度估计

以下数字是能力域覆盖度的工程判断，不是正式 KPI：

1. `P0（MVP 必须具备）`：约 `85%~90%`
2. `P1（增强能力，进行中）`：约 `70%~75%`
3. `P2（平台化能力，规划中）`：约 `10%~20%`
4. `架构能力完成度`：约 `80%`
5. `外部产品化完成度`：约 `60%~65%`

### 3.2 为什么会有两个完成度

因为当前仓库最成熟的部分是“自举治理能力”和“内部工程约束”，而 PRD 的主目标是“让目标仓库用户稳定采用这个工具”。

换句话说，当前状态更像是：

1. 核心引擎和治理骨架已经很强。
2. 外部 adopter 的产品化体验还没有同样强。
3. 内部治理成熟度已经高于外部产品化成熟度。

这是当前最重要的结构性偏差。

## 4. 已经明显完成或基本完成的部分

### 4.1 CLI 与核心治理闭环

当前根包已经提供 `repo-ai-governor` 可执行入口，CLI 命令面包括：

1. `init`
2. `connect`
3. `doctor`
4. `check`
5. `run`
6. `review`
7. `review-verify`
8. `verify`
9. `plan`
10. `upgrade`

相关证据：

1. `bin/repo-ai-governor.ts`
2. `apps/cli/src/constants/cli-command.constant.ts`
3. `apps/cli/README.md`

这说明 PRD 中最关键的“可安装 CLI + 最小治理闭环”已经不是空壳。

### 4.2 多 Agent 编排、graph-first runtime 与 service-backed execution

当前仓库已经具备：

1. `core-process` 的编译与流程表达
2. `core-runtime` 的运行时门面
3. `core-runtime-langgraph` 的 graph-first backend
4. `core-orchestration-service` + `orchestration-service-client` 的 shared local orchestration service 路径
5. `run/review/review-verify/HITL/recovery` 统一走 service-backed execution 的证据链

相关证据：

1. `packages/core-process`
2. `packages/core-runtime`
3. `packages/core-runtime-langgraph`
4. `packages/core-orchestration-service`
5. `packages/orchestration-service-client`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

这部分已经基本兑现了 PRD 中对 `Sequential / Parallel / Loop / Condition`、shared runtime/service、CLI 与未来 desktop 共用执行面的主线要求。

### 4.3 风险判定、策略门禁与 HITL

当前仓库已经有：

1. `core-change-risk`
2. `core-policy`
3. `notification-dispatcher`
4. `review -> review-verify -> ledger backfill`
5. HITL escalation/recovery examples

相关证据：

1. `packages/core-change-risk`
2. `packages/core-policy`
3. `packages/notification-dispatcher`
4. `examples/hitl-escalation-flow`
5. `apps/cli/src/commands/review-command.ts`
6. `apps/cli/src/commands/review-verify-command.ts`

这说明 PRD 中“高风险动作可判定、可阻断、可升级人工、可回灌流程”已经有很扎实的实现基础。

### 4.4 Standards Pack、Slots 与三层文档同步

这一块其实已经非常成熟：

1. `packages/standards` 有 registry / renderer / agents projector / standards upgrade planner
2. `packages/slots` 有声明式 + 脚本双轨和安全约束
3. triad/brief/module-registry/lifecycle/promotion 这一整套治理已经落地

相关证据：

1. `packages/standards/README.md`
2. `packages/slots/README.md`
3. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

从“治理强度”看，这一块已经明显超过一般 MVP 水平。

### 4.5 审计、报告、Artifact Registry 与 CLI 输出契约

当前仓库已经有：

1. `packages/reporting`
2. `packages/artifact-registry`
3. `pretty/plain/json` 输出模式
4. examples/runtime smoke/IDE smoke/desktop smoke/release gate

相关证据：

1. `packages/reporting/README.md`
2. `packages/artifact-registry`
3. `apps/cli/README.md`
4. `package.json` 中的大量 `check:*`、`gate:*`、`release:*` 命令

这说明 PRD 中“可观测、可审计、可回放、CLI 双模式输出”的骨架已经真实存在。

## 5. 能力域差距矩阵

| 能力域 | PRD 目标 | 当前判断 | 主要证据 | 主要缺口 |
|---|---|---|---|---|
| 分发与安装 | npm 安装、初始化、升级、clean-room 可验证 | `mostly_complete` | `package.json`、`README.md`、`release:verify-cleanroom-local-install` | `README.md` 仍显式写明 `tgz` clean-room 安装失败，说明“可发布分发真值”没有完全收口 |
| 仓库治理激活与 workspace 生命周期 | `tool_managed/repo_local`、迁移、回滚、只读接入 | `mostly_complete` | `packages/config/README.md`、`WorkspaceMigrationService`、`README.md` | 核心服务存在，但 end-user 级 upgrade/migration UX 仍偏 baseline，不算完全产品化 |
| 多 Agent 编排与 graph-first runtime | 多阶段流程、graph-first backend、shared local service | `mostly_complete` | `core-process/core-runtime/core-runtime-langgraph/core-orchestration-service`、master plan | 桌面端仍是 contract/sample，不是完整交付的产品入口 |
| HITL / 风险治理 / review 链路 | 高风险判定、人工审批、复核升级、状态回灌 | `mostly_complete` | `core-change-risk`、`core-policy`、`review-verify`、examples | 更细粒度权限产品化与更丰富 reviewer governance 仍有继续深化空间 |
| 多工具适配 | Codex / Copilot / Claude Code / 本地模型统一治理 | `mostly_complete` | `packages/adapters/*`、`integrations/ide`、master plan | 入口契约与适配器骨架很强，但更广泛外部 adopter 的稳定支持矩阵还不够产品化 |
| Standards Pack 与 Slots | 同源规则、多视图渲染、`AGENTS.md` 投影、slot 双轨安全 | `complete` | `packages/standards`、`packages/slots`、triad/lifecycle/module registry | 这块反而比 adopter 产品面更成熟，后续不宜继续优先过度深化 |
| 审计、报告、Artifact Registry、输出契约 | 可观测、可追溯、可回放、CLI 双模式 | `mostly_complete` | `packages/reporting`、`packages/artifact-registry`、`apps/cli/README.md` | 组织级仪表盘和外部运营看板仍未进入正式产品面 |
| i18n 与多语言模板 | 中英输出、多语言技术栈治理模板 | `partial` | `packages/shared/src/i18n`、`README.zh-CN.md` | 中英基础存在，但 Python/Go/Java/Rust 等语言模板的正式产品化证据不足 |
| 升级与版本治理 | schema diff、升级冲突分级、rollback、version pin | `partial` | `UpgradeSchemaDiffService`、`StandardsUpgradePlanner` | 服务层能力已在，但完整 CLI 升级 UX、外部仓库升级演练与产品说明还不够强 |
| P2 平台化能力 | 插槽市场、可视化面板、组织级审计、云端同步 | `not_started_to_early_skeleton` | 仓库只有 `apps/cli`；未见 `apps/desktop` 或 `apps/web` 产品实现 | P2 仍远，当前更多是架构预留而不是已交付产品能力 |

## 6. 当前最核心的 5 个差距

### 6.1 打包分发真值还没有完全闭环

这是当前最现实、也最直接影响 adopter 的问题。

证据：

1. `README.md` 明确写了 `tgz` clean-room 安装仍是已知限制。
2. 这意味着“仓库内 path/link 能跑”和“真实可分发 npm/tarball 交付能跑”之间仍有缝。

影响：

1. 很难宣称 P0/P1 的外部采用面已经真正完成。
2. 会直接削弱“15 分钟接入”的可信度。

### 6.2 外部 adopter 产品化体验弱于内部治理能力

当前仓库中最成熟的是：

1. triad/module/lifecycle/promotion
2. ledger/review/gate
3. self-hosting workflow

但 PRD 的主目标是“治理目标仓库”，不是“无限深化本仓库自己的治理元机制”。

影响：

1. 容易继续把精力投入内部治理深化，而不是外部 adopter 体验。
2. 会让能力完成度看起来很高，但产品完成度并没有同步提高。

### 6.3 升级、迁移、workspace lifecycle 仍偏工程基线，不是成熟产品 UX

当前已经有：

1. `WorkspaceMigrationService`
2. `UpgradeSchemaDiffService`
3. `StandardsUpgradePlanner`

但缺口在于：

1. 用户级升级冲突处理路径还不够清晰。
2. 外部 adopter 对“怎么升级、怎么回滚、什么时候会被阻断”的体验仍偏工程化。

### 6.4 Desktop / platformization 还停留在 contract 与样例层

证据很直接：

1. 当前 `apps` 目录只有 `apps/cli`。
2. `integrations/desktop` 主要是 README + sample。
3. 未看到正式 desktop app、web panel 或组织级管理面。

这意味着：

1. PRD 里对 P2 的平台化想象还远没有真正进入产品交付面。
2. 当前 desktop 更多是“运行时消费契约”，不是“用户可直接使用的桌面产品”。

### 6.5 多语言与团队共享规范包还没有完全产品化

虽然 shared/i18n、standards/slots 基础已经存在，但：

1. 多自然语言输出的产品级覆盖还有限。
2. 团队共享规范包、官方/团队/仓库三层来源的外部分发和消费体验，还没有形成非常清晰的产品面。

## 7. 对 PRD 优先级的重新解读

### 7.1 P0

结论：`接近完成，但还不适合用“完全完成”表述`

原因：

1. CLI、初始化、检查、最小治理闭环都已存在。
2. 但打包分发真值还没有完全闭环。
3. 只要 `tgz/npm clean-room` 仍有显式限制，P0 就不能说是 100% 收口。

### 7.2 P1

结论：`主干已经大部分完成，但产品化收口明显不足`

已基本具备：

1. 多 Agent 编排
2. graph-first runtime
3. HITL
4. 多工具适配
5. Artifact Registry
6. CLI 输出契约
7. 三层文档同步门禁

仍偏弱：

1. adopter 级产品真值
2. upgrade/workspace UX
3. 更广泛语言模板与共享 pack 产品面
4. 更稳定的正式支持矩阵

### 7.3 P2

结论：`还很远`

原因：

1. 没有看到正式可视化面板。
2. 没有看到真正的云端同步或策略分发产品面。
3. 没有看到 slot marketplace 或组织级审计看板实现。

当前最多只能说：平台化扩展的架构边界已经被思考过，并留了部分骨架，但远未进入“已交付产品能力”。

## 8. 最推荐的下一阶段顺序

### 8.1 第一优先级：补齐打包与安装真值

目标：

1. 让 `tgz/npm clean-room` 真正跑通。
2. 关闭“本地 path/link 可用，但真实分发不稳”的断层。

原因：

1. 这是外部 adopter 的第一阻断。
2. 不解决它，后面很多产品化叙述都会失真。

### 8.2 第二优先级：把 upgrade/workspace lifecycle 做成真正的 adopter UX

目标：

1. 让 `init/doctor/upgrade/workspace migration/rollback` 成为外部用户能直接照着操作的闭环。
2. 从“存在服务层能力”升级到“存在稳定用户路径”。

### 8.3 第三优先级：用一个或两个真实目标仓库做产品化试点

目标：

1. 不是只在本仓库自举验证。
2. 而是在目标仓库里验证接入耗时、升级成本、风险提示、review 链路和 delivery rehearsal。

原因：

1. 这才真正对齐 PRD 的主治理对象。
2. 可以及时暴露“内部看起来完整、外部其实不好用”的问题。

### 8.4 第四优先级：收紧官方支持矩阵

目标：

1. 明确哪些安装模式、哪些适配器、哪些 IDE surface、哪些语言模板是正式支持。
2. 把“理论支持”收敛成“正式可承诺支持”。

### 8.5 第五优先级：在前四项完成前，不建议继续优先扩张 P2

原因：

1. 当前最大的缺口不在平台化，而在 adopter 产品化。
2. 如果继续优先做 dashboard / cloud / marketplace，很可能会进一步放大“内部能力强，外部采用弱”的结构性偏差。

## 9. 最终判断

如果问题是：

1. “这个工具有没有完成核心治理引擎、编排、HITL、审计和适配器骨架？”
   - 答案是：`基本完成了，而且已经比较强。`
2. “它有没有完全达到 PRD 所描述的可稳定采用产品目标？”
   - 答案是：`还没有。`

它离目标已经不算很远，但剩下的不是“再补几个内部模块”就能自然完成的距离，而是“把已有能力真正变成外部用户可靠采用的产品体验”的距离。

当前最值得警惕的不是能力不足，而是判断过早乐观。
