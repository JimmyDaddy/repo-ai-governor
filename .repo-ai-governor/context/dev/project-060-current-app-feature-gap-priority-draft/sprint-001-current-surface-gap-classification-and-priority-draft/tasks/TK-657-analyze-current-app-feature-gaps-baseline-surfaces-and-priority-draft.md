# TK-657 analyze current app feature gaps baseline surfaces and priority draft

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-060-current-app-feature-gap-priority-draft`
- Sprint: `sprint-001-current-surface-gap-classification-and-priority-draft`

## 1. 任务目标

基于当前仓库真实代码与文档状态，输出一份新的当前应用分析 draft，明确哪些功能已经进入正式实现/支持，哪些仍只是 baseline / MVP / foundation / fallback-only / reserved 占位，以及哪些能力应按优先级继续推进。

## 2. Depends On

1. `docs/support-matrix.md` 当前正式支持边界
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md` 当前 PRD 目标
3. 既有 draft 分析文档的 traceback

## 3. 预期产物

1. 当前应用功能实现度、baseline 面与优先级分类 draft
2. 一份“旧 gap 已过时”的纠偏清单
3. 后续 project/sprint 可直接消费的优先级排序

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
3. `docs/support-matrix.md`
4. `README.md`
5. `apps/desktop/README.md`
6. `apps/vscode-extension/README.md`
7. `packages/standards/README.md`
8. `packages/adapters/local-model/README.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
3. `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
4. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
5. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/plan.md`

## 6. 实施计划

1. 复核 PRD、support matrix 与各 surface README，先判断哪些能力已经进入正式支持边界。
2. 抽取仍明确标记为 baseline / MVP / foundation / fallback-only / reserved 的能力，避免把它们误当成“已经产品化”。
3. 基于主入口影响度和 adopter 支持边界，输出按优先级排序的新 draft。

## 7. Development Verification

1. docs/source cross-check：`README.md`、`docs/support-matrix.md`、`apps/*/README.md`、`packages/standards/README.md`、`packages/adapters/local-model/README.md`

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-657`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. docs-only analysis window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `in_progress`；本轮目标是重新厘清“真实已实现能力”和“仍属占位/保守口径”的边界。
2. 2026-04-08：已核对 `product-requirements.md`、`docs/support-matrix.md`、根级 `README.md`、`apps/desktop/README.md`、`apps/vscode-extension/README.md`、`packages/standards/README.md`、`packages/adapters/local-model/README.md`，并确认若干旧 draft gap 结论已过时。
3. 2026-04-08：已识别当前最需要继续推进的缺口主要集中在 CLI 真正的 provider-native 连续性、adapter probe truthfulness、packaged distribution 收口、VS Code packaged distribution、desktop 成品化，以及语言/standards 生态扩展。
4. 2026-04-08：已输出 `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`，任务完成。

## 10. 产出

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/plan.md`
3. `.repo-ai-governor/context/dev/project-060-current-app-feature-gap-priority-draft/sprint-001-current-surface-gap-classification-and-priority-draft/plan.md`
