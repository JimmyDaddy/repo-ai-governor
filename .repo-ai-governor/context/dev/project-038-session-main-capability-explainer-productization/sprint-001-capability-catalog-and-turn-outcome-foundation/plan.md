# sprint-001-capability-catalog-and-turn-outcome-foundation 计划

- Status: active
- Date: 2026-04-02
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint Goal: 为 `session.main capability explainer` 建立 canonical capability catalog、shared turn outcome metadata 与首条 governed contextual guidance bridge。

## 1. Task Package

1. `TK-495` establish session.main capability descriptor seed-view contract and canonical catalog baseline
2. `TK-496` cut over CLI help appendix and governed command discoverability to single-source capability catalog
3. `TK-497` add session.main capability intent routing and explanation answer generation
4. `TK-498` project capability explanation metadata into shared session truth and transcript affordances
5. `TK-499` add capability availability overlay governed execution bridge and sprint-001 exit acceptance

## 2. Exit Criteria

1. capability descriptor seed/view contract 已正式冻结，且 `runtime.orchestration` 拥有 canonical catalog owner seam。
2. 至少 `help / connect / doctor / verify / review` 的 governed capability cards 已从单一 truth 渲染到 CLI help / discoverability surface。
3. `session.main` explanation route 已能输出结构化 capability answer，并把 explanation metadata 投影到 shared session turn outcome。
4. CLI transcript / future desktop consumer 已具备消费 `capabilityAnswerKind / referencedCapabilityIds / suggestedActions` 的正式 contract。
5. availability overlay 与 explanation -> governed execution bridge 范围已冻结，且 sprint 可以明确判断哪些能力已具备 direct-execute / preview-confirm continuity。

## 3. Milestones

1. 2026-04-02：创建 `sprint-001` planned skeleton，并冻结 `TK-495` ~ `TK-499` 作为 capability explainer implementation package。
2. 2026-04-02：在 `current-context.md` 中登记 `project-038 / sprint-001` 为 planned follow-up stream，同时保持 `project-037` 仍为唯一 active primary stream。
3. 2026-04-03：激活 `TK-495`，并将 `project-038 / sprint-001` 切换为当前 primary implementation stream。
4. 2026-04-03：完成 `TK-495`，冻结 orchestration-owned governed capability ids、descriptor seed/view contract、canonical catalog baseline 与 shared i18n descriptor view truth。
5. 2026-04-03：激活 `TK-496`，开始将 CLI help appendix 与 session-shell governed discoverability metadata 切到 single-source capability catalog，同时保持 shell-local builtins 自治。
6. 2026-04-03：完成 `TK-496`，将 top-level/command help appendix 与 governed slash discoverability metadata 切到 canonical capability catalog，并保持 shell-local builtins / local bridges 自治。
7. 2026-04-03：激活 `TK-497`，开始在 `session.main` dispatcher 中插入 capability explainer route，并为 overview/detail/examples/comparison 生成结构化 answer。
8. 2026-04-03：完成 `TK-497`，capability explanation 已在 skill route 之前成为正式 answer 分支，并冻结 `SessionMainCapabilityAnswer` baseline 供 `TK-498` 投影共享 turn truth。
