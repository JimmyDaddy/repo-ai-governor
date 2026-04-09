# TK-675 close desktop surface recommendation with support-truth refresh

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-065-desktop-secondary-surface-productization-decision`
- Sprint: `sprint-001-secondary-surface-decision-and-packaging-boundary`

## 1. 任务目标

用 evidence、docs refresh 与公开支持边界判断关闭 desktop surface recommendation，形成稳定的后续产品口径。

## 2. Depends On

1. `TK-673`
2. `TK-674`

## 3. 预期产物

1. desktop recommendation closeout
2. support-truth refresh
3. ecosystem follow-up input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-065-desktop-secondary-surface-productization-decision/sprint-001-secondary-surface-decision-and-packaging-boundary/tasks/TK-673-freeze-desktop-secondary-surface-productization-decision-and-packaging-boundary.md`
2. `.repo-ai-governor/context/dev/project-065-desktop-secondary-surface-productization-decision/sprint-001-secondary-surface-decision-and-packaging-boundary/tasks/TK-674-implement-minimum-desktop-productization-seam-or-reaffirm-foundation-only-guardrails-with-explicit-evidence.md`
3. `.repo-ai-governor/context/dev/project-066-standards-and-language-pack-ecosystem-expansion/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/project-044-desktop-governance-console-mvp-foundation-completion-audit-summary.md`

## 6. 实施计划

1. 刷新 desktop 的 public support-truth。
2. 将 evidence 与 decision 统一到 adopter-facing narrative。
3. 输出对后续 ecosystem / backlog 的清晰建议。

## 7. Development Verification

1. support-truth review
2. adopter narrative consistency check

## 8. Delivery Verification

1. public support boundary review
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已把 README、local adoption playbook、maintainer validation playbook、support matrix 与 desktop integration docs 的中英文口径统一收敛到同一条 support-truth：desktop 继续保持 built-source `foundation-only`，当前公开支持只覆盖 sidecar foundation verification，不扩大为 installer 或 packaged product 叙事。
3. 2026-04-08：已补齐证据窗口：`pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run check:desktop-entry-smoke`、`node ./scripts/release/verify-local-distribution.js --output .tmp/project-065-sprint-001-desktop-foundation-report.json`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
3. `/Users/jimmydaddy/study/ai-governor/integrations/desktop/README.md`
4. `/Users/jimmydaddy/study/ai-governor/.tmp/project-065-sprint-001-desktop-foundation-report.json`
