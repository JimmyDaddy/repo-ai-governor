# TK-492 prepare api-key remote adapter invocation technical solution promotion readiness and follow-up mapping

- Status: completed
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-001-shared-liveness-contract-and-codex-watchdog-baseline`

## 1. 任务目标

为 `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md` 建立 promotion-readiness 所需的最小治理锚点，包括 review artifact、lifecycle 条目与 follow-up delivery mapping，避免后续 formalization 缺少可回链的准备证据。

## 2. Depends On

1. `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`

## 3. 预期产物

1. `review_pending` promotion-readiness review artifact
2. `technical-solution.api-key-remote-adapter-invocation` lifecycle entry
3. 明确的 target module / draft status / follow-up stream mapping
4. 后续 formal cutover 所需 final paths / delivery mode / impact class 的准备结论

## 4. 实施计划

1. 对 draft 进行 prepare-promotion readiness 审查，确认 module ownership、package ownership 与 contract delta 已明确到足以进入 lifecycle registry。
2. 在 active sprint review 目录下生成可回链的 review artifact，记录 readiness 结论与 formal cutover 仍未执行的边界。
3. 在 lifecycle registry 中登记 `review_pending` 条目，并将目标模块锚定到 `runtime.agent-projection`。
4. 将后续 delivery ownership 指向 `project-037 / sprint-002` 的 follow-up rollout surface，避免当前窗口误宣称已完成 formal activation。

## 5. 验证

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-code-review-status-sync.js`
5. docs-only window；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 6. 执行记录

1. 2026-04-02：任务创建并立即进入执行，目标限定为 prepare-promotion readiness，不执行 formal cutover。
2. 2026-04-02：已生成 `review_pending` 评审文件，记录 draft readiness、target module、delivery mode 与后续 formalization 边界。
3. 2026-04-02：已登记 `technical-solution.api-key-remote-adapter-invocation` lifecycle `review_pending` 条目，锚定 `runtime.agent-projection`。
4. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-technical-solution-lifecycle-registry.js`。
5. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-task-ledger-sync.js`。
6. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-sprint-plan-status-sync.js`。
7. 2026-04-02：已通过 `/opt/homebrew/bin/node ./scripts/governance/check-code-review-status-sync.js`。
8. 2026-04-02：本窗口仅修改 draft / lifecycle / task ledger / review artifact，未修改可执行代码，因此 `pnpm run build` not required。
