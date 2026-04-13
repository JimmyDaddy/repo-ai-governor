# TK-811 establish technical-solution draft template baseline and drafting skill

- Status: completed
- Date: 2026-04-12
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-093-technical-solution-draft-template-and-skill`
- Sprint: `sprint-001-draft-template-baseline-and-skillization`

## 1. 任务目标

为仓库 technical-solution draft authoring 补齐 concrete template 与 repo-local drafting skill，使后续“起草/整理 draft”可以通过统一模板和统一 workflow 执行。

## 2. Depends On

1. `.codex/skills/technical-solution-review/SKILL.md`
2. `.codex/skills/technical-solution-promotion/SKILL.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 3. 预期产物

1. `.repo-ai-governor/normative_knowledge_sources/governance/technical-solution-draft-template.md`
2. `.codex/skills/technical-solution-drafting/SKILL.md`
3. `.codex/skills/technical-solution-drafting/agents/openai.yaml`
4. `AGENTS.md`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.codex/skills/technical-solution-review/SKILL.md`
5. `.codex/skills/technical-solution-promotion/SKILL.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/session-main-conversational-chat-and-skill-intent-handoff-technical-solution.md`
2. `.repo-ai-governor/draft/local-user-config-and-secret-backed-command-configuration-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-086-local-user-config-and-secret-command-draft/sprint-001-local-user-config-and-secret-storage-technical-solution-draft/tasks/TK-775-draft-local-user-config-and-secret-backed-command-configuration-technical-solution.md`
4. `.repo-ai-governor/context/dev/project-057-standards-native-review-engine-productization/sprint-002-provenance-aware-findings-and-hybrid-review-baseline/tasks/TK-646-create-technical-solution-review-skill-workflow-and-approval-guardrails.md`
5. `.repo-ai-governor/context/dev/project-017-technical-solution-modularization/sprint-004-skillized-promotion-workflow/tasks/TK-195-technical-solution-promotion-skill-workflow-and-trigger-mapping.md`

## 6. 实施计划

1. 复盘现有 draft 的常见元数据与章节，提炼出适用于后续 technical-solution authoring 的最小闭环模板。
2. 新增 repo 级 technical-solution draft template 文档，明确 usage rules、保留章节与 handoff 要求。
3. 创建 `technical-solution-drafting` skill，定义 trigger mapping、required inputs、lifecycle write-back 与 review/promotion handoff guardrails。
4. 更新 `AGENTS.md` 与 normative-loading manifest，使模板和 skill 成为仓库级可发现入口。

## 7. Development Verification

1. 校对 template 是否覆盖背景/目标/非目标/选项对比/推荐方案/风险/handoff 最小闭环。
2. 校对 skill frontmatter、trigger mapping、draft modes 与 verification/guardrails 是否和 review/promotion 生命周期衔接。
3. 校对 `agents/openai.yaml` 与 `AGENTS.md` 是否都已暴露新 skill 的入口与用途。

## 8. Delivery Verification

1. 等价 skill 结构校验（frontmatter + `agents/openai.yaml`）；系统 `quick_validate.py` 因当前环境缺少 `PyYAML` 不可用
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-811 --tasks-dir ".repo-ai-governor/context/dev/project-093-technical-solution-draft-template-and-skill/sprint-001-draft-template-baseline-and-skillization/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. docs-only governance landing；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 可执行代码，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-12：任务创建并直接进入 `in_progress`，范围锁定为 technical-solution draft template + drafting skill 的 docs-only landing。
2. 2026-04-12：抽样复盘现有 draft、review skill 与 promotion skill，确认仓库已有 review/promotion 后半段，但缺少统一 drafting 前置模板和入口。
3. 2026-04-12：已完成 technical-solution draft template、`technical-solution-drafting` skill、`agents/openai.yaml`、`AGENTS.md` 与 manifest write-back。
4. 2026-04-12：系统 `quick_validate.py` 因当前环境缺少 `PyYAML` 不可用，已改用等价 skill 结构校验（frontmatter + `agents/openai.yaml`），并通过 manifest gate 与 ledger/status 校验；本任务完成。

## 10. 产出

1. 已完成：technical-solution draft template -> `.repo-ai-governor/normative_knowledge_sources/governance/technical-solution-draft-template.md`
2. 已完成：drafting skill -> `.codex/skills/technical-solution-drafting/SKILL.md`
3. 已完成：skill metadata -> `.codex/skills/technical-solution-drafting/agents/openai.yaml`
4. 已完成：repo entry updates -> `AGENTS.md` 与 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
