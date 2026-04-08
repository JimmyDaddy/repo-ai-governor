# TK-668 implement packaged installer runtime layout follow-up or explicit online-only boundary hardening

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-063-packaged-distribution-and-install-surface-closeout`
- Sprint: `sprint-001-packaged-install-contract-and-acceptance-refresh`

## 1. 任务目标

根据 `TK-667` 的结论，补齐 packaged installer runtime layout follow-up，或强化 online-only boundary 的 truthfulness。

## 2. Depends On

1. `TK-667`
2. 当前 packaged install runtime

## 3. 预期产物

1. installer/runtime follow-up or explicit guardrails
2. docs alignment input
3. clean-room evidence input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-063-packaged-distribution-and-install-surface-closeout/sprint-001-packaged-install-contract-and-acceptance-refresh/tasks/TK-667-freeze-packaged-install-support-contract-and-acceptance-matrix.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`
2. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`

## 6. 实施计划

1. 落实 runtime layout 或 boundary hardening 方案。
2. 对齐 adopter docs 与 verify path。
3. 准备 clean-room evidence refresh 输入。

## 7. Development Verification

1. packaged install rehearsal
2. runtime layout / boundary assertion review

## 8. Delivery Verification

1. clean-room install verification
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已将 `verify-local-distribution.js` 的 standards runtime-loader dist smoke 断言切换为绝对 projection target，并把 `docs/support-matrix*.md` 与 maintainer/playbook truthfulness 一并纳入 packed-surface/documentation assertions，明确 online-only packaged boundary 不会误扩张为 secondary-surface packaged support。
3. 2026-04-08：same-window `pnpm run build`、`pnpm exec vitest run packages/standards/test/standards-runtime-loader.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `node ./scripts/release/verify-local-distribution.js --output .tmp/project-063-sprint-001-local-distribution-report.json` 已通过，任务切换为 `completed`。

## 10. 产出

1. `scripts/release/verify-local-distribution.js`
2. `.tmp/project-063-sprint-001-local-distribution-report.json`
3. same-window verification: `pnpm exec vitest run packages/standards/test/standards-runtime-loader.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
