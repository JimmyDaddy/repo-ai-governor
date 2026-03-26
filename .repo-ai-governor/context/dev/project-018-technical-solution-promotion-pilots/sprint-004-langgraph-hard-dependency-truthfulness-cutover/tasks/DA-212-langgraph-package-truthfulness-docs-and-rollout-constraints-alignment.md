# DA-212 LangGraph package truthfulness docs and rollout constraints alignment

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-212`
- Project: `project-018-technical-solution-promotion-pilots`
- Sprint: `sprint-004-langgraph-hard-dependency-truthfulness-cutover`

## 1. Summary

1. `core-runtime-langgraph` README 已从 `optional peer + binding seam` 切换到 `direct dependency + bundled vendor contract verification`。
2. 当前 truthfulness 已明确：默认随包分发社区 `@langchain/langgraph`，但 primary execution 仍是仓库自有 graph-first backend。
3. sprint-004 已把新的 rollout 约束写入当前 closeout surface，而没有改写历史 `project-016` 产物。

## 2. Key Outputs

1. [README.md](/Users/jimmydaddy/study/ai-governor/packages/core-runtime-langgraph/README.md)
2. [project-018 plan](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-018-technical-solution-promotion-pilots/plan.md)
3. [repo-ai-governor-master-execution-plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md)

## 3. Follow-Up Constraints

1. 后续如果真的要把官方社区包变成唯一 execution 内核，需要单独 reopen 新 stream，而不是把这次 direct dependency cutover 误解成“vendor execution 已完全接管”。
