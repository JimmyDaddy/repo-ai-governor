# Repo AI Governor 接下来按优先级推进事项建议（基于当前端面盘点）

- Status: draft
- Date: 2026-04-06
- Scope: next-step priorities after current surface/status assessment
- Audience:
  - 产品/架构决策者
  - 当前工作区后续执行流规划者
  - 需要把“现状盘点”转成“下一步行动”的协作者
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
  - `docs/support-matrix.zh-CN.md`
  - `docs/local-adoption-playbook.zh-CN.md`
  - `docs/maintainer-validation-playbook.zh-CN.md`
  - `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`

## 1. 结论先行

如果只看“代码和治理能力在不在”，当前仓库已经具备很强的产品骨架；但如果看“接下来最值得投入的工作”，优先级不应该再放在继续深化内部治理机制，而应该放在把现有强能力真正收口成更稳定的 adopter-facing 产品。

基于当前端面盘点，最值得按顺序推进的事情是：

1. 先收口 adopter truthfulness 与 GA 级使用真值。
2. 再把多工具适配从 fixture-backed 正式支持推进到更可信的真实调用产品路径。
3. 再在 non-CLI surface 中只选一条主线收口，而不是同时把 desktop 和 VS Code extension 都做成大工程。
4. 最后再考虑 standards runtime 自动消费、GitHub.com coding agent target、更多语言模板等扩展项。

一句话说：

当前最优策略不是“再加新能力”，而是“把已经很强的主干能力变成更可采用、更可验证、更可对外宣告的产品真值”。

## 2. 排序原则

本次排序采用以下原则：

1. 优先级首先看 adopter 价值，而不是内部治理优雅度。
2. 优先解决“已经支持但口径仍偏保守/条件化”的能力，而不是继续开新的产品面。
3. 优先收口 primary surface，再决定 secondary surface。
4. 优先形成稳定支持矩阵和证据，再扩大正式承诺范围。
5. 当前窗口中已修复并验证通过的构建/`examples-runtime-smoke` 竞态问题，不再列为新的主优先级事项，除非后续再次回归。

## 3. 优先级总表

| 排名 | 优先级 | 事项 | 为什么现在做 | 主要产出 |
|---|---|---|---|---|
| 1 | `P0` | adopter truthfulness 与 GA 使用真值收口 | CLI 已是 primary surface，最大的剩余差距不在能力缺失，而在外部采用真值、升级迁移路径和支持口径 | 更稳的安装/升级/迁移/回滚路径，统一支持矩阵与维护者验证证据 |
| 2 | `P0/P1` | 多工具 adapter 真实调用产品化 | 目前正式支持大量仍偏 fixture-backed，直接限制“真实可用协同编程”可信度 | Codex / Claude Code / GitHub Copilot 更稳定的 real-invocation path 与验证链 |
| 3 | `P1` | 只选一个 non-CLI 主 secondary surface 收口 | desktop 与 VS Code extension 都已有实现，但都还不是与 CLI 同等级别的稳定主入口 | 清晰的 secondary surface 取舍、验证口径和正式支持宣告 |
| 4 | `P1` | GA 证据与真实 adopter pilot 固化 | 当前已经很接近可宣告的支持面，但证据还需要更系统化 | timing evidence、真实目标仓库 rehearsal、GA closeout 文档 |
| 5 | `P1/P2` | Standards runtime 自动消费与团队 pack 产品化 | 标准包能力已经很强，但更多停留在“库能力”，还未完全成为“自动消费产品能力” | standards runtime loader product path、team/repository pack 使用说明 |
| 6 | `P2` | GitHub.com coding agent target follow-up | host distribution 主体已完成，reserved target 是清晰的后续边界 | 新 target contract、export/apply/verify 扩展 |
| 7 | `P2` | 语言模板与生态扩张 | Python/Go 已有 minimal baseline，但不是当前最紧迫阻塞项 | 更多语言 pack、更强 adopter 示例 |
| 8 | `Deferred` | P2 平台化能力 | cloud sync / dashboard / marketplace 现在不是 ROI 最高的投入点 | 暂缓，待 primary/secondary surface 收口后再开 |

## 4. 第一优先级：Adopter Truthfulness 与 GA 使用真值收口

优先级：`P0`

### 4.1 为什么它排第一

当前最成熟的产品面是 CLI，但 CLI 当前最大的剩余问题不是“命令不工作”，而是：

1. 外部 adopter 是否能稳定理解应该用哪条路径安装、接入、升级、迁移、回滚。
2. support matrix、playbook、release gate、clean-room 证据是否已经完全形成统一真值。
3. 维护者验证结论能否自然转成 adopter-facing 正式承诺。

换句话说，最值得做的不是再扩一个新面，而是让现有最强的 CLI 面真正具备更完整的对外产品闭环。

### 4.2 这一优先级下建议做什么

建议收敛到一个统一主题：

`adopter productization and GA truthfulness closeout`

建议包含以下任务包：

1. 收紧 install mode 口径：
   - `path`
   - `link`
   - `dist-binary`
   - `tgz`
2. 把 `dist-binary`、package install、clean-room、release verify 的叙事完全对齐。
3. 补强 `upgrade / workspace migration / rollback` 的 adopter-facing 使用路径与故障说明。
4. 将 support matrix、local adoption playbook、maintainer validation playbook 的结论互相对齐。
5. 用统一证据记录“哪条路径正式支持，哪条路径仍有边界”。

### 4.3 这一优先级的完成标准

建议以以下信号判断是否达到 closeout：

1. adopter 可以从文档直接判断最推荐的接入路径。
2. `init -> doctor -> check -> verify --adapters -> run --dry-run --trace` 的路径有清晰文档与真实验证证据。
3. `workspace dry-run / execute / rollback` 的用户路径在 playbook 中足够清楚。
4. support matrix 和 maintainer gate 的结论不再出现明显语义落差。

### 4.4 为什么不是继续先做内部治理深化

因为当前仓库已经有很强的 triad/module/lifecycle/governance 深度，而 adopter-facing 清晰度仍明显弱于内部治理强度。继续在内部治理层加码，很容易进一步扩大这种偏差。

## 5. 第二优先级：多工具 Adapter 真实调用产品化

优先级：`P0/P1`

### 5.1 为什么它排第二

当前多工具协同的架构骨架已经很完整，但从产品口径看：

1. 正式支持矩阵中的多个 adapter 仍偏 `fixture-backed`。
2. 这使得“已经支持多工具协同”成立，但“已经稳定真实可用”仍带保守前提。
3. 如果不把这条线继续推进，产品外部感知会长期停留在“治理很强，但真实 provider 使用还偏演示/保守”。

### 5.2 这一优先级下建议做什么

建议以“从最稳的一条真实路径开始”推进，而不是同时把所有 adapter 一次做满。

建议顺序：

1. 先收口 `Claude Code`
2. 再推进 `Codex`
3. 再推进 `GitHub Copilot`
4. `local-model` 继续作为 fallback / restricted-network path 收口

建议任务包：

1. 明确 execution mode 的正式配置路径与文档口径。
2. 固化 real-invocation 健康检查、超时、错误处理、降级策略。
3. 固化真实调用模式下的输出解析与结构化结果收敛。
4. 为 `verify --adapters` 与 `run --dry-run --trace` 增加更强的真实调用证据链。
5. 将真实调用与 fixture-backed 的支持边界写进正式文档，而不是只在代码里体现。

### 5.3 这一优先级的完成标准

建议目标不是“一步做到所有工具默认真实调用”，而是：

1. 至少 1 到 2 个主 adapter 拥有稳定的真实调用产品路径。
2. support matrix 对这些路径的表述从“fixture-backed + degrade”前进到更明确的“正式支持真实调用”。
3. 有真实目标仓库或 clean-room 级证据支撑。

## 6. 第三优先级：只选一个 Non-CLI 主 Secondary Surface 收口

优先级：`P1`

### 6.1 为什么要先做“选择”，再做“全做”

当前 non-CLI surface 至少有两条线：

1. `apps/desktop`
2. `apps/vscode-extension`

它们都已经不是空壳：

1. desktop 已有 sidecar + IPC + governance console foundation。
2. VS Code extension 已有真实 MVP app 与视图/聊天参与者。

真正的问题不是“有没有实现”，而是：

1. 哪条是接下来要向 CLI 级稳定支持面靠近的主 secondary surface。
2. 哪条继续保持 MVP/foundation 状态即可。

### 6.2 推荐策略

建议先做产品决策，而不是同时推进两条大线。

可选策略：

1. `VS Code first`
   - 适合把 editor companion 作为近期 secondary surface
   - 优势是 adopter 场景更直接、安装和日常使用叙事更容易建立
2. `Desktop first`
   - 适合把 governance command center 作为更长期差异化主线
   - 优势是与 orchestration service、artifact pane、queue overview 的契合度更高

### 6.3 当前更推荐的方向

基于当前成熟度，我更推荐：

1. 短期先把 `VS Code extension` 作为更容易形成 adopter narrative 的 secondary surface
2. desktop 继续保持 foundation，并只补关键 service seam，而不急着追求完整产品壳

原因：

1. VS Code extension 已经是 active app，而且“Execution Board / HITL Inbox / Review Detail / @governor”对 adopter 更容易理解。
2. desktop 当前更像 command center foundation，适合继续积累，但不适合马上成为第二主入口的对外承诺。

### 6.4 这一优先级下建议做什么

如果走 `VS Code first`：

1. 补 installer / packaging / release evidence narrative。
2. 增强 support matrix 中对 VS Code surface 的正式声明。
3. 固化 MVP 视图与 command contract 的端到端验证。

如果保持 desktop foundation：

1. 继续补 `artifact pane / review / evidence backlinks` 的 service seam。
2. 不做大规模 UI 扩张。
3. 不提前承诺“完整桌面产品已完成”。

## 7. 第四优先级：GA 证据与真实 Adopter Pilot 固化

优先级：`P1`

### 7.1 为什么它排在这里

在 CLI truthfulness 和 adapter 真实路径进一步收口之后，最具价值的不是立刻开新能力，而是把“差不多可以宣告”的状态变成有证据可回溯的状态。

### 7.2 建议任务包

1. 固化 1 到 2 个真实目标仓库的 adopter rehearsal。
2. 固化 `install -> init -> doctor -> check -> verify -> run --dry-run` 的 timing evidence。
3. 固化 workspace migration / rollback 的真实演练记录。
4. 把 support matrix、GA readiness evidence、maintainer validation playbook 串成同一叙事。

### 7.3 这一优先级的完成标准

1. 至少 1 个真实目标仓库可以稳定完成 adopter path rehearsal。
2. 形成统一的 timing/evidence 输出，而不是分散在多个文档。
3. 能清晰区分“正式支持”“保守支持”“未来 target”。

## 8. 第五优先级：Standards Runtime 自动消费与团队 Pack 产品化

优先级：`P1/P2`

### 8.1 为什么它很重要，但不该排到前四

`@repo-ai-governor/standards` 当前已经很强，但其主要强项仍偏向：

1. 库能力
2. 治理能力
3. 架构能力

而不是 adopter 日常“必须先解决”的问题。

### 8.2 建议任务包

1. 收口 `StandardsRuntimeLoader` 的产品化消费路径。
2. 明确 `official / team / repository` pack 的文档与示例。
3. 决定 root `AGENTS.md` 是否以及何时真正接入 projector 产物链。
4. 为 team pack 外部消费增加最小示例项目。

### 8.3 为什么不是更后

因为这条线一旦收口，会把当前很强的治理库能力提升为更真实的产品能力，并显著增强“团队共享规范包”的对外价值。

## 9. 第六优先级：GitHub.com Coding Agent Target Follow-Up

优先级：`P2`

### 9.1 为什么它现在不是前五

原因很简单：

1. 当前 host distribution 主体已经完成。
2. `github_com_agent` 是明确的 reserved/non-MVP target。
3. 它不是当前产品主线最紧迫的 adoption blocker。

### 9.2 什么时候该启动

只有在以下前提同时满足时才建议启动：

1. CLI adopter truthfulness 已基本收口。
2. 至少一条真实 adapter path 已更可信。
3. host distribution 当前 target 没有新的主缺口。

## 10. 第七优先级：语言模板与生态扩张

优先级：`P2`

当前 Python/Go minimal pack 已经存在，所以这条线不是“必须补零”。

后续可做的事情包括：

1. 扩更多语言 pack。
2. 补更完整的 adopter 示例仓库。
3. 收口更多团队 pack 使用范式。

但这些事情的 ROI 目前仍低于前面几项 productization closeout。

## 11. 明确建议暂缓的事情

当前不建议优先做：

1. 继续扩张新的内部治理机制。
2. desktop 全量产品壳重构。
3. cloud sync / org dashboard / marketplace 等 P2 平台化能力。
4. 大规模新语言铺面。
5. 同时把 VS Code extension 和 desktop 都推成同等级主入口。

原因：

1. 这些事情会分散资源。
2. 但当前最值得解决的问题仍然是 adopter truthfulness、real adapter path、secondary surface 取舍和 GA evidence。

## 12. 推荐执行顺序

### 12.1 推荐顺序

建议按下面顺序推进：

1. `Stream A`
   - adopter truthfulness
   - install / upgrade / workspace / rollback narrative closeout
   - support matrix 与 playbook 对齐
2. `Stream B`
   - adapter real-invocation productization
   - 先收口 1 到 2 个主 adapter
3. `Stream C`
   - 决策并收口一个 primary secondary surface
   - 推荐 `VS Code first`
4. `Stream D`
   - GA evidence consolidation
   - real adopter pilot
5. `Stream E`
   - standards runtime productization
   - team pack/product path
6. `Stream F`
   - reserved target 和语言生态扩展

### 12.2 如果只能做 3 件事

如果接下来只能投入 3 件事，我建议是：

1. adopter truthfulness closeout
2. adapter real-invocation closeout
3. 选定并收口一个 primary secondary surface

这三件事能最大化提高“当前产品是否真的可被采用”的真实完成度。

## 13. 最终建议

基于当前盘点，我对下一阶段的建议可以压缩成三句话：

1. 不要再把主要精力放在内部治理深化上，当前更缺的是 adopter-facing 收口。
2. 不要同时推所有 surface，而要先把 CLI 之外只选一个主次入口做实。
3. 不要急着扩新能力，先把“已经很强”的 CLI、多工具接入、host distribution 和验证证据变成更清晰、更可信的正式产品真值。

如果要把这份建议再进一步转成执行流，我建议下一步不是直接开很多并行项目，而是先选一条新的 primary stream，围绕 `Stream A -> Stream B -> Stream C` 顺序推进。
