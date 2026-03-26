# project-017-technical-solution-modularization 计划

- Status: completed
- Date: 2026-03-26
- Stage Mapping: Cross-stage normative modularization follow-up
- Phase Mapping: Normative Loading / Module Graph / Spec Sync Hardening

## 1. 目标

1. 将总技术方案从“单文件全文容器”收敛为“北极星索引 + 全局约束”。
2. 建立 `technical-solution-module-registry` 与 `contract-first` 的模块依赖表达方式，让技术方案按 bounded context 按需加载。
3. 扩展 `manifest / Spec Sync Guard / gate`，使模块化方案拆分后仍具备结构化校验、影响面分析与执行一致性保障。

## 2. Sprint 细化

## 2.1 sprint-001-module-registry-and-loading-contract-baseline

- Status: completed
- Sprint Goal: 建立 `project-017` 主执行流，冻结 module registry、loading contract、总纲瘦身边界与 gate 改造任务面。
- 任务包：`TK-179`、`TK-180`、`TK-181`、`TK-182`、`TK-183`。
- Exit Criteria:
  1. `project-017` 的 project/sprint/task skeleton 已建立并切换为 active primary stream。
  2. `technical-solution-module-registry.yaml`、`module-overview`、`contract`、`ADR` 的职责边界已经冻结为正式任务输入。
  3. 总技术方案、模块方案与 gate 改造之间的任务边界已拆清，不再混在一份总纲里推进。

## 2.2 sprint-002-module-migration-and-gate-cutover

- Status: completed
- Sprint Goal: 迁移首批复杂模块到 `module-overview + contracts` 结构，并把 module graph gate 与 Spec Sync impact 规则接入正式执行链路。
- Exit Criteria:
  1. 至少 2 到 3 个复杂模块已完成首轮文档迁移。
  2. module graph gate 已具备 pass/fail 基线。
  3. 总纲、模块方案与 gate 的协同策略已具备可回归验证的正式入口。

## 2.3 sprint-003-lifecycle-registry-and-promotion-governance

- Status: completed
- Sprint Goal: 为技术方案补齐 `draft -> final` 生命周期注册表、promotion blocking gate 与 manifest/module-registry 接线，确保草稿态按需保留、最终态可执行且不跑偏。
- Exit Criteria:
  1. `technical-solution-lifecycle-registry.yaml` 已成为技术方案生命周期的单一事实源。
  2. lifecycle/promotion gate 已接入正式验证链路并稳定通过。
  3. `project-017` 已在 reopen 后完成再次 closeout，并保留新的完成态审计摘要。

## 2.4 sprint-004-skillized-promotion-workflow

- Status: completed
- Sprint Goal: 将技术方案 promotion workflow 固化为 repo-local skill，降低后续从 draft 提升到正式方案时的遗漏风险。
- Exit Criteria:
  1. `.codex/skills/technical-solution-promotion/` 已包含可触发的 `SKILL.md` 与 `agents/openai.yaml`。
  2. skill 已明确约束 `prepare-promotion`、`promote-approved-solution` 与 `supersede-active-solution` 三类路径。
  3. `project-017` 已在 reopen 后完成再次 closeout，并保留新的完成态审计摘要。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-179 | sprint-001 | project-017 启动与技术方案模块化治理重排 | bootstrap/plan | project-015 completion,project-016 completion,.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md | completed |
| TK-180 | sprint-001 | technical solution module registry 与 loading contract baseline | architecture/governance | TK-179,DA-179,.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md | completed |
| TK-181 | sprint-001 | 总技术方案北极星瘦身与 module overview 抽取基线 | architecture/docs | TK-180,DA-179,.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md | completed |
| TK-182 | sprint-001 | module graph gate 与 Spec Sync impact classification 基线 | implementation/governance | TK-180,TK-181,DA-179,.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md | completed |
| TK-183 | sprint-001 | sprint-001 出口验收与 sprint-002 模块迁移输入约束 | acceptance/baseline | TK-180,TK-181,TK-182,DA-179 | completed |
| TK-184 | sprint-002 | sprint-002 激活与 artifact registry handoff | bootstrap/governance | DA-180,DA-181,DA-182,DA-183 | completed |
| TK-185 | sprint-002 | governance.spec-sync 模块深迁移与 ADR 切口收敛 | governance/docs | TK-184,DA-180,DA-181,DA-182 | completed |
| TK-186 | sprint-002 | runtime.memory-provider-loading 模块深迁移与 host surface cutover 文档化 | runtime/docs | TK-184,DA-180,DA-181,DA-182 | completed |
| TK-187 | sprint-002 | runtime.orchestration 模块深迁移与 typed detail-doc gate cutover | runtime/governance | TK-184,TK-185,TK-186,DA-180,DA-181,DA-182 | completed |
| TK-188 | sprint-002 | sprint-002 出口验收与 project-017 后续输入约束 | acceptance/baseline | TK-184,TK-185,TK-186,TK-187,DA-183 | completed |
| TK-189 | sprint-003 | sprint-003 激活与 project-017 reopen handoff | bootstrap/governance | DA-188,project-017 completion audit | completed |
| TK-190 | sprint-003 | lifecycle registry schema 与 seed catalog baseline | governance/docs | TK-189,DA-188 | completed |
| TK-191 | sprint-003 | lifecycle promotion gate 与 integration test wiring | governance/implementation | TK-190,DA-189 | completed |
| TK-192 | sprint-003 | lifecycle contract、manifest 与 module-registry cutover | governance/docs | TK-190,TK-191,DA-190 | completed |
| TK-193 | sprint-003 | sprint-003 出口验收与 project-017 re-closeout | acceptance/baseline | TK-189,TK-190,TK-191,TK-192,DA-191,DA-192 | completed |
| TK-194 | sprint-004 | sprint-004 激活与 project-017 reopen handoff | bootstrap/governance | DA-193,project-017 lifecycle governance audit | completed |
| TK-195 | sprint-004 | technical-solution-promotion skill workflow 与 trigger mapping | governance/skill | TK-194,DA-193 | completed |
| TK-196 | sprint-004 | promotion guardrails、portable prompt 与 repo alignment | governance/skill | TK-195,DA-194 | completed |
| TK-197 | sprint-004 | sprint-004 出口验收与 project-017 re-closeout | acceptance/baseline | TK-194,TK-195,TK-196,DA-195,DA-196 | completed |

## 4. 依赖产物策略

1. `project-017` 启动默认消费：
   - `.repo-ai-governor/draft/modular-technical-solution-loading-and-dependency-governance.md`
   - `project-015-memory-provider-pluginization-completion-audit-summary.md`
   - `project-016-langgraph-runtime-productization-completion-audit-summary.md`
   - `DA-179`
2. `DA-180` ~ `DA-183` 已形成 sprint-001 的正式治理基线；后续 `sprint-002` 启动时应优先消费这些完成态产物，而不是重新回读零散变更集。
3. `sprint-003` reopen 时应优先消费 `DA-188` 与上一轮 completion audit，而不是覆盖既有 completed 结论。
4. `sprint-004` reopen 时应优先消费 `DA-193` 与 lifecycle governance audit，并把 skill 视作 promotion workflow 的操作投影，而不是新的事实源。

## 5. DoD（project-017）

1. 技术方案模块化治理拥有独立 project/sprint/task skeleton，并被明确切换为当前主执行流。
2. module registry、总纲瘦身边界、contract-first loading 与 gate impact classification 形成正式任务面，不再停留在 draft 口头约定。
3. `current-context / completed history / projects overview / master execution plan / dev index` 与实际 active stream 完全同步。
4. 技术方案 `draft -> final` promotion 具备 registry + blocking gate + manifest 接线，不再依赖人工约定。
5. repo-local skill 能把 promotion workflow 稳定投影到可复用操作入口，降低重复执行时的遗漏风险。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-017-technical-solution-modularization`，将 `project-015 / sprint-004` 从 active closeout surface 迁入 completed history，并切换到 `sprint-001-module-registry-and-loading-contract-baseline`。
2. 2026-03-26：完成 `sprint-001-module-registry-and-loading-contract-baseline`，形成 `DA-180` ~ `DA-183`、resolved review 与 `sprint-002` 模块迁移输入约束。
3. 2026-03-26：完成 `sprint-002-module-migration-and-gate-cutover`，形成 `DA-184` ~ `DA-188`、typed detail-doc gate cutover 与 project completion audit。
4. 2026-03-26：reopen `project-017` 执行 `sprint-003-lifecycle-registry-and-promotion-governance`，形成 `DA-189` ~ `DA-193`、`technical-solution-lifecycle-registry.yaml` 与新的项目完成态审计摘要 `project-017-technical-solution-modularization-completion-audit-summary-sprint-003-lifecycle-governance.md`。
5. 2026-03-26：reopen `project-017` 执行 `sprint-004-skillized-promotion-workflow`，形成 `DA-194` ~ `DA-197`、repo-local `technical-solution-promotion` skill 与新的项目完成态审计摘要 `project-017-technical-solution-modularization-completion-audit-summary-sprint-004-skillized-promotion.md`。
