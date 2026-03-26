# project-015-memory-provider-pluginization 计划

- Status: completed
- Date: 2026-03-26
- Stage Mapping: Post-Stage-9 runtime packaging modularization
- Phase Mapping: Runtime Modularity / Optional Plugin Resolution

## 1. 目标

1. 将 memory provider 从 CLI 全量内置依赖改造成 `built-in registry + optional plugin` 模式。
2. 冻结 registry、plugin resolution、distribution 与安全治理边界，避免 memory provider 继续硬耦合在默认 bundle 中。
3. 为后续 CLI、desktop 与 service-backed runtime 共享 memory seam 提供稳定的模块化落点。

## 2. Sprint 细化

## 2.1 sprint-001-registry-and-plugin-resolution-baseline

- Status: completed
- Sprint Goal: 建立 `project-015` 主执行流，完成 memory provider pluginization 的 bootstrap、边界重排与后续拆解输入冻结。
- 任务包：`TK-159`、`TK-160`（completed）。
- Exit Criteria:
  1. `current-context.md` 已从 completed 的 `project-014 / sprint-003` 切换到 `project-015 / sprint-001`。
  2. `project-015` 的 project/sprint/task skeleton 已建立并通过治理同步 gate。
  3. `TK-159` 已完成 project-015 bootstrap；`TK-160` 已补齐 LangGraph full productization 残余 gap register 和 `project-016` planned follow-up skeleton。

## 2.2 sprint-002-built-in-registry-and-loader-foundation

- Status: completed
- Sprint Goal: 落下 memory provider built-in registry 与 loader 基线，把 CLI 当前的 provider 选择逻辑从入口文件中抽离，并冻结 release/distribution 的最小模块化边界。
- 任务包：`TK-167`、`TK-168`、`TK-169`、`TK-170`。
- Exit Criteria:
  1. `memory provider registry + built-in descriptor` 已形成正式 package-local 或 package 级基线。
  2. CLI 不再在入口层直接硬编码 `fs-csv/sqlite-fs` 选择逻辑，legacy `storeEngine` 的 parser/selection 兼容仍保持成立，但默认发行包对 `sqlite-fs` optional built-in runtime 必须显式 fail-closed。
3. release/build/distribution 对 built-in provider 与 optional provider 的边界已冻结。

## 2.3 sprint-003-optional-plugin-mode-and-policy-hardening

- Status: completed
- Sprint Goal: 在受控 allowlist / prefix / path / module policy 下打开 optional plugin mode，建立 plugin-enabled distribution 与 clean-room/examples/release gate 基线，并冻结 sprint-004 service reuse 输入约束。
- 任务包：`TK-171`、`TK-172`、`TK-173`、`TK-174`（completed）。
- Exit Criteria:
  1. `provider.module / exportName / options` 的可控解析契约已形成正式基线。
  2. optional plugin mode 不允许任意模块执行，allowlist / prefix / path policy 已收敛为正式门禁。
  3. plugin-enabled distribution、clean-room、examples/runtime smoke 与 release gate 已与 default distribution 区分验证。
  4. sprint-003 的验收与 sprint-004 service reuse 输入约束已形成正式基线。

## 2.4 sprint-004-shared-loader-and-service-reuse

- Status: completed
- Sprint Goal: 让 CLI、desktop host 与 service-backed runtime 共用同一条 memory provider shared loader seam，补齐 service-host packaging / clean-room / release gate，并完成 `project-015` 的闭项判断。
- 任务包：`TK-175`、`TK-176`、`TK-177`、`TK-178`。
- Exit Criteria:
  1. `memory-provider-registry` 已成为 CLI、desktop host 与 service-backed runtime 共用的唯一 loader / registry seam。
  2. `hostSurface` 与 `runtimeMode` 已形成正式 contract，不再由各 host 复制 provider resolution 逻辑。
  3. service-host / desktop 的 packaging、clean-room 与 release gate 已与 CLI distribution 分离验证。
  4. `project-015` 已形成 completion audit 或明确的残余 blocker 判断。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-159 | sprint-001 | project-015 启动与 memory provider pluginization 重排 | bootstrap/plan | project-014 completion | completed |
| TK-160 | sprint-001 | LangGraph runtime productization gap register 与 project-016 planned follow-up 拆解 | baseline/plan | project-014 completion,TK-159 | completed |
| TK-167 | sprint-002 | memory provider registry package 与 built-in descriptor 契约基线 | implementation/runtime | TK-159,DA-159,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-168 | sprint-002 | CLI memory provider loader cutover 与 legacy config 兼容 | implementation/cli | TK-167,DA-159,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-169 | sprint-002 | distribution 与 release 对 optional built-in provider 的边界收口 | implementation/release | TK-167,TK-168,DA-159,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-170 | sprint-002 | sprint-002 出口验收与 sprint-003 optional plugin 输入约束 | acceptance/baseline | TK-167,TK-168,TK-169,DA-159 | completed |
| TK-171 | sprint-003 | memory provider plugin allowlist 与 registry resolution contract baseline | implementation/runtime | TK-170,DA-170,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-172 | sprint-003 | CLI memory provider plugin loader cutover 与 dual-input compatibility | implementation/cli | TK-171,DA-170,DA-168,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-173 | sprint-003 | plugin-enabled distribution、clean-room、examples 与 release gate expansion | implementation/release | TK-171,TK-172,DA-170,DA-169,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-174 | sprint-003 | sprint-003 出口验收与 sprint-004 service reuse 输入约束 | acceptance/baseline | TK-171,TK-172,TK-173,DA-170 | completed |
| TK-175 | sprint-004 | memory provider shared loader contract 与 host surface baseline | implementation/runtime | TK-174,DA-174,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-176 | sprint-004 | CLI、desktop host 与 service-backed runtime 的 memory provider loader reuse cutover | implementation/host | TK-175,DA-174,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-177 | sprint-004 | service-host packaging、clean-room 与 release gate expansion for memory providers | implementation/release | TK-175,TK-176,DA-173,DA-174,.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md | completed |
| TK-178 | sprint-004 | sprint-004 出口验收与 project-015 completion assessment | acceptance/baseline | TK-175,TK-176,TK-177,DA-174 | completed |

## 4. 依赖产物策略

1. `project-015` 启动默认消费：
   - `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
   - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
   - `DA-159`
   - `DA-160`
2. 后续 `DA-*` 仅在形成可复用基线、约束或正式方案后进入 artifact registry。

## 5. DoD（project-015）

1. memory provider 的 registry、plugin resolution 与发布边界具备正式基线。
2. CLI 默认 bundle 与 optional plugin 的责任边界清晰，且不引入新的 canonical source。
3. 项目级执行流、台账与后续 rollout 输入约束保持同步。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-015`，将 `project-014 / sprint-003` 从 active surface 迁入 completed history，并切换到 memory provider pluginization follow-up 主线。
2. 2026-03-26：通过 `TK-160 / DA-160` 正式登记 “project-014 仅完成 first-phase” 的残余 gap，并拆解 planned `project-016-langgraph-runtime-productization` 作为后续收口项目。
3. 2026-03-26：通过 `TK-159 / DA-159` 收口 bootstrap sprint，并切换到 `sprint-002-built-in-registry-and-loader-foundation`。
4. 2026-03-26：通过 `TK-167 / DA-167` 建立 `@repo-ai-governor/memory-provider-registry` 与 built-in descriptor / loader 基线，并把 CLI 入口切到 registry loader。
5. 2026-03-26：通过 `TK-168 / DA-168` 完成 CLI memory provider loader cutover，冻结 legacy `storeEngine` 与 `memory.provider.id` 的 parser/selection 兼容契约，并保留 `provider.module` 的 fail-closed 扩展位。
6. 2026-03-26：通过 `TK-169 / DA-169` 收口 default distribution 与 optional built-in provider 的 release/build 边界，默认发行包不再包含 `sqlite-fs` 的运行时载荷。
7. 2026-03-26：通过 `TK-170 / DA-170` 完成 sprint-002 出口验收，判定 built-in registry / loader foundation 达到 `accept`，并明确默认发行包对 `sqlite-fs` optional built-in provider 只保证 parser/selection compatibility 与 fail-closed truthfulness，而非运行时可用性。
8. 2026-03-26：创建 `sprint-003-optional-plugin-mode-and-policy-hardening`，将 `project-015` 主执行流切换到受控 optional plugin mode 的正式拆解阶段，并新增 `TK-171`~`TK-174` 任务骨架。
9. 2026-03-26：正式激活 `sprint-003-optional-plugin-mode-and-policy-hardening`，将主执行流切到 optional plugin mode，并启动 `TK-171` 收敛 allowlist / prefix / path / module policy baseline。
10. 2026-03-26：通过 `TK-171 / DA-171` 冻结 optional plugin baseline 的 allowlist / prefix / path / module policy，建立 plugin factory / resolution contract，并将其下沉到 `memory-provider-registry` 与 `config schema`。
11. 2026-03-26：通过 `TK-172 / DA-172` 将 CLI 正式切到统一 registry loader，打开 `provider.module` 受控解析路径，并为 dual-input compatibility 补齐 plugin source diagnostics 与 fail-closed integration coverage。
12. 2026-03-26：通过 `TK-173 / DA-173` 建立 plugin-enabled distribution、examples/runtime smoke、local distribution verify 与 clean-room plugin scenario 的独立验证路径，不再复用 default distribution 结果代替。
13. 2026-03-26：通过 `TK-174 / DA-174` 完成 sprint-003 出口验收，判定 optional plugin mode 达到 `accept`，并冻结 sprint-004 对 shared loader / host surface / packaging 的输入约束。
14. 2026-03-26：拆解 `sprint-004-shared-loader-and-service-reuse`，将 shared loader / host surface / service-host packaging 作为 planned follow-up，暂不切换 active stream。
15. 2026-03-26：正式激活 `sprint-004-shared-loader-and-service-reuse`，将主执行流切到 shared loader / service reuse，并启动 `TK-175` 收敛 shared loader / host surface 契约。
16. 2026-03-26：通过 `TK-175 / DA-175` 冻结 memory provider shared loader、`hostSurface`、`runtimeMode` 与 service-owned `memoryProvider` composition summary contract。
17. 2026-03-26：通过 `TK-176 / DA-176` 完成 CLI、desktop host 与 service-backed runtime 的 loader reuse cutover，embedded shell、sidecar client 与 CLI diagnostics 已统一消费 shared loader seam。
18. 2026-03-26：通过 `TK-177 / DA-177` 建立 service-host / desktop 维度的 packaging、local distribution、clean-room 与 release gate baseline，不再复用 CLI-only 结果代替。
19. 2026-03-26：通过 `TK-178 / DA-178` 完成 sprint-004 出口验收，判定 `project-015-memory-provider-pluginization` 达到 `completed`。
20. 2026-03-26：产出 `project-015-memory-provider-pluginization-completion-audit-summary.md`，正式收口 project-015；在下一条主执行流显式激活前，该 stream 继续保留为 active closeout surface。
