# TK-905 refresh adopter docs truth for quickstart versus check follow-up

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

刷新 adopter-facing docs，使 `adopt bootstrap` 的 quickstart path 与 `check` follow-up 的关系保持真实且不误导。

## 2. Depends On

1. `TK-904`

## 3. 预期产物

1. README truth refresh
2. local adoption playbook refresh
3. support matrix wording update

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `README.md`
3. `docs/local-adoption-playbook.md`
4. `docs/support-matrix.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`
3. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`

## 6. 实施计划

1. 刷新 README quickstart wording。
2. 刷新 playbook 中 quickstart 与 `check` follow-up 的解释。
3. 对 support matrix 明确它仍是 existing install mode 之上的 convenience surface。

## 7. Development Verification

1. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。
2. 2026-04-15：进入实现窗口，开始刷新 README、adoption playbook 与 support matrix，使 quickstart、verify 与 `check` 的边界表述回到运行时真值。
3. 2026-04-16：已完成 adopter-facing docs truth refresh；README、local adoption playbook 与 support matrix 现已把 `adopt bootstrap` 表述为 installer quickstart convenience surface，并明确 `adopt verify` 仍是 canonical install truth、`check` 仍是显式 broader governance follow-up。
4. 2026-04-16：文档验证结果已记录：`node ./scripts/governance/check-normative-loading-manifest.js --mode block` 与 `node ./scripts/governance/check-docs-triad-sync.js` 通过；同窗口 `pnpm run build` 与定向 vitest 已提供代码变更所需的 build/test 证据。

## 10. 产出

1. `README.md` 已切到 `adopt bootstrap` quickstart，并保留 `check` 为显式 broader governance follow-up。
2. `docs/local-adoption-playbook.md` 已补齐 quickstart、rerun redirect 与 lifecycle handoff 说明。
3. `docs/support-matrix.md` 已同步 public command surface truth 与 bootstrap convenience boundary。
