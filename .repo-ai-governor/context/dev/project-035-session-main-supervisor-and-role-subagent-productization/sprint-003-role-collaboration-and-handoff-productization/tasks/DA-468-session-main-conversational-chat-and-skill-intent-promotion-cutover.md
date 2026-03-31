# DA-468 session.main conversational chat and skill intent promotion cutover

- Status: active
- Date: 2026-04-01
- Owner: AI-Agent
- Task: `TK-468`
- Project: `project-035-session-main-supervisor-and-role-subagent-productization`
- Sprint: `sprint-003-role-collaboration-and-handoff-productization`

## 1. Summary

1. 已将 `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md` 正式并入 active solution `technical-solution.interactive-cli-react-style-cli` 的 formal module docs。
2. `runtime.orchestration` 现正式接受 `conversation-first chatability + risk-tiered natural-language skill handoff` 方向，并要求 shared session truth 同时承载 `preview_confirm` 与 `direct_execute` continuity。
3. `runtime.cli-interactive-shell` 现正式接受低风险 skill 直跑、`help` 直接执行/回答、以及 scope-aware `review` 直跑回退语义；CLI 继续只消费 service-owned risk decision，不在 presenter 层本地重算确认策略。
4. lifecycle、delivery、review、artifact 与 `TK-468` closeout ledger 已保持同步；本轮只 formalize 方向，不宣称对应代码已全部交付。

## 2. Outputs

1. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
3. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
4. 更新后的 `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
5. 更新后的 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. 更新后的 `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
7. `.repo-ai-governor/context/dev/project-035-session-main-supervisor-and-role-subagent-productization/sprint-003-role-collaboration-and-handoff-productization/review/resolved_code_review_tk-468-session-main-conversational-chat-and-skill-intent-promotion-cutover.md`
8. 更新后的 `.repo-ai-governor/context/artifact-registry/artifacts.csv`
