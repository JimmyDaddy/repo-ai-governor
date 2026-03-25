# DA-142 LangGraph runtime adoption 与 migration baseline

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-142`
- Produced By: `TK-142`
- Scope: `project-014-langgraph-orchestration-runtime-adoption`

## 1. 目的

将 `LangGraph` 采用决策从 draft 升级为 triad 与 master execution plan 中的正式事实链，并冻结 project-014 的 runtime modernization 起始边界。

## 2. 已确认决策

1. 采用 `LangGraph` 作为 `Process Runtime` 的默认演进方向。
2. `LangGraph` 只承接 graph execution、checkpointing、interrupt/resume 与 per-node execution state，不替代 `DSL/IR/policy/audit/ledger` 领域模型。
3. `CLI` 与未来 `desktop client` 统一收敛到 `shared local orchestration service`，桌面 UI 不直接持有 runtime 主状态。
4. `LangGraph state/checkpointer` 只是执行恢复介质，不升格为新的 canonical source。

## 3. 本轮同步范围

1. triad / brief：
   - `product-requirements.md`
   - `product-requirements-brief.md`
   - `repo-ai-governor-overall-technical-solution.md`
   - `repo-ai-governor-architecture-and-repo-layering.md`
2. execution planning：
   - `repo-ai-governor-master-execution-plan.md`
   - `projects-overview.md`
   - `dev/index.md`
3. execution surface：
   - `current-context.md`
   - `completed-streams-history.md`
   - `project-014` project/sprint/task 骨架

## 4. project-014 的起始边界

1. sprint-001 只负责冻结决策、边界、契约和迁移计划，不直接承诺完整 runtime 替换。
2. 后续实现必须优先保持 `workspace canonical sources`、artifact/audit/ledger 的单一事实源边界。
3. runtime modernization 的首批交付物应优先围绕：
   - `Process Runtime -> LangGraph` adapter 边界
   - `shared local orchestration service`
   - `dual-runtime parity`
   - `file-backed -> sqlite-fs` checkpointer 路径

## 5. 证据路径

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
6. `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/plan.md`

## 6. 使用方式

1. `TK-143`、`TK-144` 必须将本 artifact 视为 direct formal baseline；`TK-145`、`TK-146` 通过 `TK-143/TK-144` 的产物与 master plan 继承该基线，不再直接消费本 artifact。
2. 后续若 `LangGraph` 采用边界发生变化，应先更新本 artifact 与 triad/master plan，再继续推进实现。
