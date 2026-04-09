# TK-679 freeze codex claude host asset lifecycle and support-truth contract

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`
- Sprint: `sprint-001-codex-claude-host-ergonomics-lifecycle-and-upgrade`

## 1. 任务目标

冻结 Codex / Claude Code host asset lifecycle 与 support-truth contract，把 plugin / skill / agent / hooks / MCP 资产从 baseline 叙事推进到正式 follow-up lane。

## 2. Depends On

1. `project-050` closeout
2. `project-070` triad sync
3. `project-063` recommended

## 3. 预期产物

1. host asset lifecycle contract
2. support-truth contract
3. implementation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-070-host-plugin-skill-agent-triad-sync/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-069-host-plugin-skill-agent-decomposition-refresh/project-069-host-plugin-skill-agent-decomposition-refresh-completion-audit-summary.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`

## 6. 实施计划

1. 冻结 host asset lifecycle states 与 upgrade path。
2. 明确 support-truth 与 adopter consumption 叙事。
3. 将 apply / verify / upgrade follow-up 交给 `TK-680`。

## 7. Development Verification

1. host asset lifecycle contract review
2. adopter consumption narrative review

## 8. Delivery Verification

1. target-specific verify rehearsal
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`project-063` final closeout 已完成，当前任务切换为 `in_progress`，开始冻结 Codex / Claude Code host asset lifecycle、upgrade path 与 support-truth contract。
3. 2026-04-08：已冻结正式 contract truth：`host export / host verify / host pack` 只承接 Codex / Claude Code 的 source-checkout follow-up surface；`project-local` 与 `plugin-bundle` 是当前正式支持的 host-native lifecycle 载体；所谓“upgrade”语义固定为 governor 源码或 vendored skills 更新后重新渲染并重新 `host verify`，而不是新增一条独立安装器路径。

## 10. 产出

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`
