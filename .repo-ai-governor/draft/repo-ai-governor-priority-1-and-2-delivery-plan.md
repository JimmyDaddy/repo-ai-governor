# Repo AI Governor 第一优先级与第二优先级交付规划

- Status: draft
- Date: 2026-03-26
- Scope:
  - 第一优先级：打包分发真值
  - 第二优先级：upgrade/workspace lifecycle adopter UX
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`

## 1. 规划目标

把当前最关键的两条 adoption/productization gap 从“高层建议”收敛成一个可以直接执行的 delivery plan。

这里的目标不是继续深化内部治理层，而是解决真正阻碍外部 adopter 的两件事：

1. 工具能不能稳定被打包、分发、安装和 clean-room 验证。
2. adopter 能不能清晰完成 upgrade、workspace migration、rollback 与诊断。

## 2. 规划原则

1. `先真值，后体验`
   - 如果 tarball/npm 分发本身不稳定，先做再多 upgrade UX 都会建立在不可靠基础上。
2. `先目标仓库 adopter，后自举治理深化`
   - 后续项目应优先服务目标仓库接入，而不是继续优先扩张 triad/module/lifecycle 这类内部治理子系统。
3. `先收紧支持矩阵，再扩展能力面`
   - 先把正式支持的安装模式、入口和升级路径做实，再决定要不要扩张新的 surface。
4. `每个 sprint 都必须带 clean-room 或 adopter rehearsal`
   - 否则很容易再次回到“仓库内正确、外部使用不稳”的状态。

## 3. 推荐执行项目

建议将这两条优先级合并到一个新的实现型项目中执行：

`project-020-adoption-productization-and-upgrade-ux`

这样做的原因：

1. 第一优先级和第二优先级都属于“外部 adopter 产品化”而不是“内部治理补件”。
2. 它们有明显依赖顺序，但也属于同一产品面。
3. 用一个 project 承接，可以避免再次把分发真值和 adopter UX 拆成两个各自不完整的小流。

## 4. 范围边界

### 4.1 In Scope

1. `tgz/npm clean-room` 安装真值
2. packaged runtime resolvability
3. root package export / files / dist / runtime asset 边界
4. release gate 与 clean-room matrix 对齐
5. `upgrade` 命令用户路径
6. workspace migration / rollback / dry-run UX
7. adopter docs / playbook / troubleshooting
8. 至少 1 到 2 个真实目标仓库试点演练

### 4.2 Out of Scope

1. 新的 runtime modernization 主线
2. 新的技术方案治理机制
3. desktop 正式产品实现
4. P2 平台化能力（dashboard / cloud sync / marketplace）
5. 大规模多语言模板扩张

## 5. 两条优先级的依赖关系

### 5.1 第一优先级必须先完成到什么程度

第二优先级不要求等第一优先级全部结束才启动，但至少要等第一优先级完成这三件事：

1. tarball/package 安装在 clean-room 里可稳定跑通
2. packaged runtime 的 `--help -> init -> doctor -> check` 基线可通过
3. release gate 对 packaged distribution 有正式阻断语义

只有到这一步之后，upgrade/workspace UX 才有稳定基础。

### 5.2 第二优先级可以并行做什么

在第一优先级进行中时，第二优先级可以先做：

1. UX contract 设计
2. command/result schema 设计
3. adopter docs 草案
4. workspace migration rehearsal case 设计

但不建议先做：

1. 大规模文案 polishing
2. 复杂的 interactive flow
3. 大量 adopter onboarding 示例

因为底层分发面如果还在变，这些都很容易重写。

## 6. 推荐 Sprint 切分

## 6.1 Sprint 1：Packaging Truthfulness Failure Baseline

### 目标

把当前 `tgz` clean-room 失败变成可稳定复现、可定位、可回归的 failure baseline。

### 主要工作

1. 固化 `path / link / tgz / npm pack` 安装矩阵
2. 复现并定位 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` 一类 packaged runtime 问题
3. 梳理根包 `files / exports / dist / asset copy` 真正需要的最小集合
4. 把 clean-room 失败类型归类成有限集合并形成诊断 contract

### Exit Criteria

1. 失败可稳定复现，且有 deterministic diagnosis
2. 失败原因被收敛成有限 fault classes
3. release gate 中已有针对 packaged install 的明确 baseline

### 风险

1. 真正问题可能不只在 `exports`，也可能在 workspace build topology 或 runtime asset copy
2. 如果直接修而不先固化 failure baseline，后续回归会很脆弱

## 6.2 Sprint 2：Packaged Runtime Cutover And Release Gate Block

### 目标

真正修复 packaged distribution 真值，并把 release gate 切到 blocking。

### 主要工作

1. 修复 root package 打包内容、runtime asset copy、published surface resolvability
2. 确保 `pnpm pack` / clean-room `tgz` 安装后的 CLI 入口可直接工作
3. 收紧 support matrix：哪些安装模式正式支持，哪些仍是限制
4. 将 clean-room `tgz` 验证接到 release/GA gate

### Exit Criteria

1. `--help -> init -> doctor -> check` 在 `tgz` clean-room 连续通过
2. packaged runtime 不再依赖仓库内 workspace 解析偶然成功
3. `README / local adoption playbook / release gate` 口径一致

### 风险

1. 可能暴露更多“本地 workspace 可用、发布包不可用”的隐性依赖
2. 一旦 support matrix 不收紧，文档会再次失真

## 6.3 Sprint 3：Upgrade And Workspace Lifecycle UX Baseline

### 目标

把已有的 `UpgradeSchemaDiffService`、`WorkspaceMigrationService`、`StandardsUpgradePlanner` 变成 adopter 可操作的 CLI 用户路径。

### 主要工作

1. 明确 `upgrade` 命令最小语义：
   - schema diff
   - migration suggestions
   - confirmation items
   - rollback reference
2. 明确 workspace migration UX：
   - dry-run
   - execute
   - rollback
   - failure summary
3. 对齐 `json/plain/pretty` 输出契约
4. 增加最小 playbook 和 troubleshooting map

### Exit Criteria

1. adopter 能清晰知道“升级会改什么、为什么阻断、怎么回滚”
2. workspace migration 具备可回放的 dry-run 与 rollback 路径
3. upgrade/workspace UX 不再只是服务层能力，而是正式 CLI 用户路径

### 风险

1. 如果交互设计过重，容易把问题复杂化
2. 这一步应该优先做 deterministic UX，而不是追求花哨体验

## 6.4 Sprint 4：Adopter Pilot And Documentation Closure

### 目标

用真实目标仓库试点验证“分发真值 + upgrade/workspace UX”是否真能支撑 adopter。

### 主要工作

1. 选择 1 到 2 个目标仓库做真实试点
2. 跑接入、升级、workspace 切换、rollback、review/release rehearsal
3. 产出 support matrix 与 troubleshooting 结论
4. 将 pilot 发现回灌到 docs/gates

### Exit Criteria

1. 至少 1 个目标仓库可以稳定完成接入与升级 rehearsal
2. 已形成正式 adopter playbook
3. 已形成 support matrix 与 known limitations 清单

### 风险

1. 试点仓库如果选得过于接近本仓库，验证价值会下降
2. 如果没有真实 adopter rehearsal，前面三轮工作仍可能停留在仓库内正确

## 7. 推荐任务分层

### 7.1 第一优先级 Workstream

建议拆成以下任务群：

1. packaging failure baseline
2. published surface inventory and export boundary audit
3. packaged runtime asset copy / resolution fix
4. clean-room matrix hardening
5. release gate cutover
6. docs truthfulness alignment

### 7.2 第二优先级 Workstream

建议拆成以下任务群：

1. upgrade command semantics baseline
2. workspace migration dry-run / execute / rollback contract
3. output schema and UX alignment
4. adopter docs/playbook
5. pilot rehearsal and feedback closure

## 8. 建议验证矩阵

## 8.1 Packaging / Install

至少覆盖：

1. `path`
2. `link`
3. `tgz`
4. 若准备正式 npm 发布，再覆盖一次 registry install

每种模式至少跑：

1. `--help`
2. `init --output json`
3. `doctor --output json`
4. `check --output json`

## 8.2 Upgrade / Workspace

至少覆盖：

1. `tool_managed -> repo_local`
2. `repo_local -> tool_managed`
3. dry-run
4. failed switch -> rollback
5. schema upgrade with confirmation items

## 8.3 Adopter Pilot

至少覆盖：

1. 全新目标仓库接入
2. 已存在 `.repo-ai-governor` 状态的升级仓库
3. 有 review/review-verify 链路的仓库

## 9. 关键决策建议

1. 不要先做新的 dashboard 或 desktop 产品面。
2. 不要先扩大语言模板覆盖面。
3. 不要继续优先加深 triad/module/lifecycle 机制。
4. 先把分发真值和 adopter UX 变成可靠产品面，再谈下一轮扩张。

## 10. 建议的激活方式

如果你要把这份计划转成正式执行，我建议下一步直接激活：

`project-020-adoption-productization-and-upgrade-ux`

建议按 4 个 sprint 执行：

1. Packaging failure baseline
2. Packaged runtime cutover and release gate block
3. Upgrade/workspace lifecycle UX baseline
4. Adopter pilot and documentation closure

## 11. 最终判断

这两条优先级不适合拆成彼此独立、完全并行的两个项目。

更合理的方式是：

1. 用一个 adoption/productization 项目统一承接。
2. 先把分发真值做实。
3. 再把 upgrade/workspace UX 做成 adopter 能真的使用的路径。
4. 最后用真实目标仓库试点来验证，而不是继续只在本仓库里自证。
