# Repo AI Governor Current Improvement Priorities And Governance Remediation Refresh (Draft)

- Status: draft
- Date: 2026-04-21
- Owner: AI-Agent
- Scope: 基于 `2026-04-21` 仓库体检结论，刷新当前最值得优先完善的治理与产品化收口事项，并给出建议执行顺序
- Target Modules:
  - `runtime.governance-clients`
  - `governance.execution-gates`
- Related Inputs:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `docs/support-matrix.md`
  - `apps/vscode-extension/README.md`

## 1. 背景与问题

1. `project-114` 与 `project-116` 已完成，工作区已恢复到 `idle`，说明 VS Code primary-workbench 与 direct provider onboarding 两条近线产品化主线已在当前支持边界内收口。
2. 新一轮仓库体检显示，当前最紧急的缺口不是旧执行流未 closeout，而是仓库级治理债与产品支持边界之间的错位：
   - `artifact lifecycle` gate 因历史 backlog 未清理而直接阻塞 `pnpm run check`
   - 治理文档中仍保留“prepared/planned script”口径，但对应脚本文件并不存在
3. 除治理债外，产品支持面仍保留若干明确未扩到的边界，例如 Marketplace / published npm/tgz install、offline/self-contained tgz、live remote-provider success，以及 desktop richer command-center surface。
4. 当前需要一份 refresh draft，把“应先修什么”和“哪些属于下一阶段扩边界”重新讲清楚，避免执行面继续混杂治理修债与产品能力扩张。

## 2. 目标

1. 明确 `2026-04-21` 时点最优先的仓库级完善项与建议执行顺序。
2. 先把阻塞 gate 的治理债与脚本文档口径漂移收口，再决定下一条产品边界扩张主线。
3. 将本轮仓库体检结论沉淀到既有 roadmap solution 的 supplemental draft，而不是另起平行 solution。

## 3. 非目标

1. 本 draft 不引入新的 active technical solution，也不直接触发 promotion。
2. 本 draft 不在本轮扩大公开支持口径，不把当前未支持的 Marketplace / published install / live remote-provider / desktop packaged surface 直接改写成 supported。
3. 本 draft 不把 P2 平台化能力提前拉进当前执行窗口。

## 4. 现状与约束

1. 当前产品优先级仍然是 `P1 进行中`，重点包括多 Agent 编排、策略化 HITL、多工具适配、更细粒度门禁、workspace 生命周期和 Artifact Registry / Dependency Resolver。
2. `P2` 的插槽市场、可视化执行面板、组织级审计看板与云端同步仍处于规划中，不适合作为当前第一优先级。
3. 当前公开支持口径已对 VS Code primary-workbench 和 direct-provider-onboarding 做出 evidence-backed 保守声明，但仍明确排除 Marketplace、published npm/tgz install、offline tgz 和 live remote-provider success。
4. artifact registry 的 canonical truth 在 sqlite，rendered CSV 只是派生视图，因此 backlog 清理必须经由 canonical maintenance script，而不是手工编辑 CSV 逃过 gate。
5. monorepo naming / versioning policy / god-object boundary 在规则文本上已存在，但仓库里尚未落地对应 checker script；当前最合理的收口方式是先让文档忠实反映“规则已定义、脚本未实现/未接入”的真相。

## 5. 方案选项与对比

### 5.1 方案 A：先继续扩产品支持边界

1. 直接把下一轮重心放到 Marketplace、offline tgz、live remote-provider 或 desktop packaged surface。
2. 优点：外部 adopter 能更快看到新增 supported surface。
3. 缺点：会把当前已知的治理硬阻塞和文档真值漂移继续带进下一轮，增加后续每个执行窗口的噪音和误判成本。

### 5.2 方案 B：先清治理债，再选一条支持边界扩张主线

1. 先修 `artifact lifecycle` gate 与缺失治理脚本口径漂移，再基于最新支持矩阵选下一条对外扩边界主线。
2. 优点：能先恢复仓库自身门禁和文档的可信度，为后续每条产品化路线提供更干净的执行地面。
3. 缺点：这一轮对外可见增量较少，更像“修地基”。

### 5.3 方案 C：同时推进治理修债与多条边界扩张

1. 把治理债清理与多个 support-surface 扩张并行推进。
2. 优点：理论上吞吐最高。
3. 缺点：当前窗口会明显超出最小必要范围，且容易把“保守支持 truth”与“目标探索”混写到同一 change set。

### 5.4 对比结论

1. 推荐采用方案 B。
2. 原因是 `artifact lifecycle` 已经构成硬 gate blocker，而缺失治理脚本的文档漂移会直接削弱规范文档的可信度；这两项若不先收口，后续任何 support-boundary 扩展都要在一块不稳定地基上执行。

## 6. 推荐方案

1. 先执行一个小范围 remediation window：
   - 清理 artifact registry lifecycle backlog
   - 将治理文档对 missing gate script 的口径收口到真实状态
2. remediation 完成后，再在下一轮从以下候选中择一推进：
   - Marketplace / published npm-tgz install boundary
   - offline/self-contained tgz install boundary
   - live remote-provider success evidence window
   - desktop packaged / richer command-center surface
3. 本 refresh draft 作为 `technical-solution.adopter-productization-priority-roadmap` 的补充分析稿保存，不创建新 solution_id，也不覆盖既有正式 module docs。

## 7. 核心设计与契约影响

1. Artifact Registry 契约影响：
   - canonical sqlite 继续作为唯一真值
   - rendered main/archive CSV 必须由 canonical source 重建
   - `deprecated -> archive` 与 `active but unreferenced -> deprecated/archive` 需要由 maintenance script 执行
2. Governance gate contract 影响：
   - `code_standards.md` 与 `long-term-maintenance-guide.md` 需要区分“规则已定义”与“checker script 已存在/已接入”
   - 当前仅 `check-package-dependency-boundary.js` 已真实存在并以 warning 模式接入
   - monorepo naming、versioning policy、god-object boundary 仍应标记为后续实现项，而非已准备好的现成脚本
3. Support-truth 契约影响：
   - remediation 本身不扩大 public support claim
   - 仅为下一轮 support-boundary 选择提供更准确的优先级输入

## 8. 风险与权衡

1. 若只做治理修债而不扩任何对外边界，短期内用户可感知增量有限。
2. 若 artifact lifecycle maintenance 误判仍在使用中的 artifact，可能把本该保留的 active dependency 过早降级，因此需要先做 dry-run summary。
3. 若文档口径收口过度保守，可能让尚未实现的规则显得“被放弃”；因此需要明确写成“规则仍有效，但 checker script 尚未实现/接入”，而不是删掉规则本身。

## 9. 分阶段落地建议

1. Phase A：保存本轮仓库体检结论为 supplemental draft，并激活一个小范围 remediation stream。
2. Phase B：执行 artifact lifecycle maintenance，恢复 `pnpm run check` 的 clean baseline。
3. Phase C：收口治理脚本文档口径漂移，确保规范文档与脚本资产 truth 对齐。
4. Phase D：在治理地基恢复可信后，再从 Marketplace/offline tgz/live remote-provider/desktop 四条里选一条作为新的对外扩边界主线。

## 10. Review / Promotion Handoff

1. 建议 `solution_id`：`technical-solution.adopter-productization-priority-roadmap`
2. 建议 `target_module_ids`：`runtime.governance-clients`、`governance.execution-gates`
3. 进入后续 review 前需要重点复核的边界：
   - artifact lifecycle maintenance 是否严格经由 canonical truth 执行
   - 缺失治理脚本文档口径是否仅做 truth alignment，而非暗中放弃规则
   - remediation 是否错误扩大了 public support claim
4. 若后续需要 promotion：本稿不建议单独 promotion；如要 formalize，应作为既有 roadmap / governance-clients 方案的 supplemental analysis 输入，而不是独立 final doc。
