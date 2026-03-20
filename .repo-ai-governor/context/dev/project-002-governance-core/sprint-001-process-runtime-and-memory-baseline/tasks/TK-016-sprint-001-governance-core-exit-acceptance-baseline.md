# TK-016 sprint-001 出口验收基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-002-governance-core`
- Sprint: `sprint-001-process-runtime-and-memory-baseline`

## 1. 任务目标

完成 sprint-001 统一验收并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-013`
2. `TK-014`
3. `TK-015`
4. `TK-022`
5. `TK-023`
6. `DA-020`
7. `DA-021`
8. `DA-022`
9. `DA-023`
10. `DA-024`

## 3. 预期产物

1. `DA-025` sprint-001 governance-core exit acceptance baseline 文档。
2. `DA-026` sprint-002 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md` (`DA-020`)
2. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-014-runtime-control-flow-engine-baseline.md` (`DA-021`)
3. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-015-memory-session-store-baseline.md` (`DA-022`)
4. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-022-sqlite-fs-memory-provider-baseline.md` (`DA-023`)
5. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-023-memory-store-engine-config-and-cli-composition-baseline.md` (`DA-024`)
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（`§4.2.2`、`§4.3`、`§4.2.3`）
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`（`§2` 执行时序图）
8. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`（`§4` 核心能力基线）

## 5. 实施摘要

1. 完成 sprint-001 出口验收矩阵，确认四条出口标准均具备可回链证据：
   - `Compiler IR v1`：`compiled-ir/<execution_id>.json` 契约落盘可检索。
   - `Runtime 控制流`：`Sequential/Parallel/Loop/Condition` 与中断语义基线已稳定。
   - `Memory/Session/Store`：`fs-csv` 与 `sqlite-fs` 后端都可完成快照读写与最小回放。
   - `CLI 组装`：`memory.storeEngine` 可驱动 provider 选择并输出统一组装事实。
2. 新增 sprint-002 输入约束清单，固化 Stage 3 启动前的输入资产、风险分级、门禁命令与回滚入口。
3. 收敛依赖产物编号冲突：
   - 保持已完成任务 `TK-022/TK-023` 的 `DA-023/DA-024` 不变。
   - 将 TK-016 产物登记为 `DA-025/DA-026`，并同步 sprint-002 规划依赖编号。
4. 同步 artifact registry 与索引入口，确保后续任务可直接按 `artifact_id + artifact_path` 回链检索。

## 6. 产出

1. `DA-025` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-001-governance-core-exit-acceptance-baseline.md`
2. `DA-026` `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/TK-016-sprint-002-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/tasks/tasks.csv`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
6. `.repo-ai-governor/context/dev/index.md`
7. `.repo-ai-governor/context/dev/project-002-governance-core/sprint-001-process-runtime-and-memory-baseline/code-review/verified_review_tk-016-sprint-001-governance-core-exit-acceptance-baseline.md`

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `pnpm run check`

## 8. 执行记录

1. 2026-03-20：任务启动，状态切换为 `in_progress`，开始汇总 sprint-001 交付证据并建立出口验收矩阵。
2. 2026-03-20：新增 `TK-016-sprint-002-input-constraints-checklist.md` 并完成 artifact registry / index 同步。
3. 2026-03-20：完成验收基线收敛，状态切换为 `completed`；验证通过 `node ./scripts/governance/reconcile-artifact-dependencies.js` 与 `pnpm run check`。
