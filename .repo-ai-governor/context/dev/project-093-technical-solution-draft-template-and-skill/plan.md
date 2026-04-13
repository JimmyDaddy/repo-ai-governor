# project-093-technical-solution-draft-template-and-skill 计划

- Status: completed
- Date: 2026-04-12
- Stage Mapping: technical-solution drafting governance
- Phase Mapping: draft template baseline + skillization + docs-only closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/technical-solution-review/SKILL.md`
  - `.codex/skills/technical-solution-promotion/SKILL.md`

## 1. 目标

1. 为 `.repo-ai-governor/draft/**` 下的新技术方案草案建立 concrete template，避免后续 draft 结构漂移。
2. 新增 repo-local `technical-solution-drafting` skill，使“起草/整理 draft”成为仓库内可复用的 workflow 入口。
3. 将模板和 skill 暴露到 `AGENTS.md` 与 normative-loading manifest，保证后续执行可发现、可复用、可审计。

## 2. Sprint 细化

## 2.1 sprint-001-draft-template-baseline-and-skillization

- Status: completed
- Sprint Goal: 落地 technical-solution draft template、drafting skill 与 docs-only closeout。
- Task Package: `TK-811`、`TK-812`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-811 | sprint-001 | establish technical-solution draft template baseline and drafting skill | governance/docs/skill | existing review + promotion workflows | completed |
| TK-812 | sprint-001 | finalize project-093 closeout after drafting workflow landing | closeout/final-audit | TK-811 | completed |

## 4. 依赖产物策略

1. 本项目只新增 template、skill 与治理入口，不把任何 draft 误写成正式规范源。
2. template 是 repo 内 technical-solution draft 的 concrete authoring baseline；draft 本身仍只留在 `.repo-ai-governor/draft/**`。
3. 新 skill 只负责 `problem/request -> draft`，不替代后续 `technical-solution-review` 与 `technical-solution-promotion`。

## 5. DoD（project-093）

1. 已新增可复用的 technical-solution draft template 文档。
2. 已新增 `technical-solution-drafting` repo-local skill 与 `agents/openai.yaml`。
3. `AGENTS.md` 与 normative-loading manifest 已暴露该 template/skill 入口。
4. docs-only project 台账、completion audit 与验证记录已同步完成。

## 6. 里程碑记录

1. 2026-04-12：基于“草案生成缺少模板，并希望后续按模板生成 draft”的需求创建 `project-093`。
2. 2026-04-12：范围锁定为 docs-only governance landing，不扩张到 runtime/code implementation。
3. 2026-04-12：`TK-811` 已完成，新增 technical-solution draft template、drafting skill、AGENTS 入口与 manifest 登记。
4. 2026-04-12：`TK-812` 已完成 closeout，本项目在此里程碑回链 [project-093 completion audit summary](./project-093-technical-solution-draft-template-and-skill-completion-audit-summary.md)。
