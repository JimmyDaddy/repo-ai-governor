# TK-030 project-003 出口验收与 project-004 输入约束

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-003-standards-and-slots`
- Sprint: `sprint-002-slot-security-and-upgrade-ux`

## 1. 任务目标

形成 project-003 统一验收基线并沉淀 project-004 输入约束清单。

## 2. Depends On

1. `TK-027`
2. `TK-028`
3. `DA-037`
4. `DA-038`
5. `DA-035`
6. `DA-036`

## 3. 预期产物

1. `DA-039` project-003 exit acceptance baseline 文档。
2. `DA-040` project-004 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-027-slot-engine-dual-track-and-script-security-baseline.md` (`DA-037`)
2. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-028-standards-upgrade-ux-and-version-pin-baseline.md` (`DA-038`)
3. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md` (`DA-035`)
4. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-001-standards-pack-and-spec-sync/tasks/TK-029-sprint-002-slot-upgrade-input-constraints-checklist.md` (`DA-036`)
5. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§6`、`§8`、`§9.3`）
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2`、`§4`、`§6`）
8. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`）

## 5. project-003 出口验收基线

1. Slot 双轨与脚本安全六项
   - 验收结果：通过
   - 证据：`DA-037`、`verified_review_tk-027-slot-engine-dual-track-and-script-security-baseline.md`
2. Standards 升级 UX 与版本 pin
   - 验收结果：通过
   - 证据：`DA-038`、`verified_review_tk-028-standards-upgrade-ux-and-version-pin-baseline.md`、`resolved_review_working-tree-20260320-2221.md`
3. Sprint 级评审与治理流程基线
   - 验收结果：通过
   - 证据：`verified_review_tk-031-workspace-code-review-workflow-skill.md`、`AGENTS.md`、`.codex/skills/workspace-code-review-workflow/SKILL.md`
4. 依赖回填与生命周期门禁
   - 验收结果：通过
   - 证据：`node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`pnpm run check` 通过

## 6. project-004 输入约束总览

1. 已输出 `DA-040` 作为 `project-004-agent-adapter-runtime` 启动前统一输入约束清单。
2. 输入约束覆盖：
   - Stage 4 产物可消费性（`DA-032` ~ `DA-038`）；
   - review 生命周期目录规范（`review/`）；
   - artifact 生命周期与依赖回填门禁；
   - project-004 启动前推荐命令基线。
3. 项目完成态审计入口已补齐到 `project-003` 计划“里程碑记录”。

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）

## 8. 执行记录

1. 2026-03-21：任务启动，状态切换为 `in_progress`，开始汇总 sprint-002 出口验收证据并生成 project-004 输入约束清单。
2. 2026-03-21：产出 `DA-040` 输入约束清单，并完成 `DA-039/DA-040` 在 artifact registry 与索引台账的登记。
3. 2026-03-21：完成门禁复核、review 归档与台账同步，状态切换为 `completed`，并补齐 `project-003` 完成态审计摘要与里程碑回链。

## 9. 产出

1. `DA-039` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-003-exit-acceptance-and-project-004-input-constraints.md`
2. `DA-040` `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/tasks/TK-030-project-004-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-003-standards-and-slots/project-003-completion-audit-summary.md`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
6. `.repo-ai-governor/context/dev/index.md`
7. `.repo-ai-governor/context/dev/project-003-standards-and-slots/sprint-002-slot-security-and-upgrade-ux/review/verified_review_tk-030-project-003-exit-acceptance-and-project-004-input-constraints.md`
