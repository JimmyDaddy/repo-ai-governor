# TK-029 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-001-standards-pack-and-spec-sync`

## 1. 任务目标

形成 sprint-001 验收基线并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-024`
2. `TK-025`
3. `TK-026`
4. `DA-032`
5. `DA-033`
6. `DA-034`

## 3. 预期产物

1. `DA-035` sprint-001 standards/spec-sync exit acceptance baseline 文档。
2. `DA-036` sprint-002 slot/upgrade 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-024-standards-pack-registry-and-rule-renderer-baseline.md` (`DA-032`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-025-agents-projector-and-projection-parity-baseline.md` (`DA-033`)
3. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-026-spec-sync-guard-gate-integration-baseline.md` (`DA-034`)
4. `.repo-ai-governor/context/dev/project-003-standards-and-slots/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.5`、`§4.2.6`、`§4.2.7`）
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`、`§6`）
7. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-015`、`CS-021`、`CS-023`）

## 5. sprint-001 出口验收基线

1. Standards Pack Registry + Rule Renderer
   - 验收结果：通过
   - 证据：`DA-032`、`verified_review_tk-024-standards-pack-registry-and-rule-renderer-baseline.md`
2. Agents Projector + Projection Parity
   - 验收结果：通过
   - 证据：`DA-033`、`verified_review_tk-025-agents-projector-and-projection-parity-baseline.md`
3. Spec Sync Guard Gate Integration
   - 验收结果：通过
   - 证据：`DA-034`、`verified_review_tk-026-spec-sync-guard-gate-integration-baseline.md`
4. Artifact 依赖回填与生命周期约束
   - 验收结果：通过
   - 证据：`node ./scripts/governance/reconcile-artifact-dependencies.js` 与 `pnpm run check` 通过

## 6. sprint-002 输入约束总览

1. 已输出 `DA-036` 作为 slot/upgrade 启动前统一输入约束清单。
2. `TK-027` 已在任务卡 `Depends On` 中显式回链 `DA-035` 与 `DA-036`。
3. 生命周期治理约束：后续任务仅消费 `active/frozen` 状态产物，`dependent_tasks` 必须通过脚本自动回填。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始汇总 sprint-001 验收证据并生成 sprint-002 输入约束清单。
2. 2026-03-20：产出 `DA-036`（slot/upgrade 输入约束清单）并完成 `DA-035/DA-036` 在 artifact registry 与索引台账的登记。
3. 2026-03-20：完成依赖回填与门禁复核，状态切换为 `completed`。

## 9. 产出

1. `DA-035` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `DA-036` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-002-slot-upgrade-input-constraints-checklist.md`
3. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
5. `.repo-ai-governor/context/dev/index.md`
6. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/code-review/verified_review_tk-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
