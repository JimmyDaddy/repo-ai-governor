# DA-161 project-016 bootstrap and LangGraph runtime productization rebaseline

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Depends On:
  - `DA-160`
  - `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`

## 1. 结论

1. `project-016-langgraph-runtime-productization` 已从 planned follow-up 提升为 active primary stream。
2. `project-014` 的 LangGraph 残余 gap 已被正式转译为 `TK-162` ~ `TK-166` 的执行输入。
3. `project-015` 保持 active，但降为 secondary stream，不再占用默认主执行面。

## 2. 已冻结的 bootstrap 边界

1. `project-016` 当前只承接以下 LangGraph full productization 残余项：
   - 社区 LangGraph vendor adoption 与 package truthfulness
   - graph-first execution semantics 与 selector/cutover 收敛
   - `sidecar + ipc` orchestration host 产品化
   - desktop execution surface 与 service ops/release baseline
2. 以下事项不在 `TK-161` 内直接实现：
   - memory provider pluginization 本体
   - `daemon + http` 正式产品化
   - 非 LangGraph 运行时 modernization

## 3. 后续任务输入映射

| task_id | consumed_inputs | focus |
|---|---|---|
| `TK-162` | `DA-160`, `DA-161` | 社区 LangGraph vendor adapter 与 package truthfulness |
| `TK-163` | `DA-143`, `DA-145`, `DA-148`, `DA-160`, `DA-161` | graph-first engine 与 selector/cutover hardening |
| `TK-164` | `DA-144`, `DA-151`, `DA-157`, `DA-160`, `DA-161` | `sidecar + ipc` host 与 transport |
| `TK-165` | `DA-157`, `DA-160`, `DA-161` | desktop execution surface 与 service ops/release |
| `TK-166` | `DA-160`, `DA-161` | sprint-001 acceptance 与 rollout constraints |

## 4. Context 切换结果

1. `current-context.md` 当前 primary stream 已切换为 `project-016 / sprint-001-vendor-adapter-and-sidecar-baseline`。
2. `project-015 / sprint-001-registry-and-plugin-resolution-baseline` 仍保留为 secondary active stream。
3. `master execution plan`、`projects-overview`、`index.md` 已同步到新的 active/secondary 口径。
