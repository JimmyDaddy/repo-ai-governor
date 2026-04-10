# Technical Solution Review

- Status: approved
- Date: 2026-04-10
- Solution ID: `technical-solution.session-main-prompt-first-command-model`
- Draft Path: `.repo-ai-governor/draft/session-main-prompt-first-command-mental-model-and-deterministic-workflow-split-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target modules:
   - `runtime.orchestration`
   - `runtime.cli-interactive-shell`
   - `runtime.agent-projection`
   - `runtime.durable-storage`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
   - `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
   - `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
   - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
   - `apps/cli/src/commands/run-command.ts`
   - `apps/cli/src/commands/verify-command.ts`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-001-solution-review-promotion-and-rollout-decomposition/review/approved_solution_review_session-main-prompt-first-command-model.md`
5. Approval focus:
   - whether `/plan`、`/review`、`/review verify` 已被明确建模为产品化 AI fixed workflow
   - whether public `/verify` deletion now preserves underlying onboarding / readiness / projection truth instead of accidentally deleting runtime seams
   - whether `run` 已从“待解释的 catch-all”收敛为“保留但收紧”的明确 rollout 结论
   - whether promotion landing shape is explicit enough to drive `technical-solution-promotion` without inventing module ownership on the fly

## Blocking Findings

1. None. 当前 draft 已清除会阻断 approval 的关键缺口：
   - `run` 的终态不再停留在“只提出问题、不定义收口”，而是明确为 public-but-narrowed surface，且要求 rollout 交付独立 existence review evidence。
   - `/verify` 的删除不再与 `runtime.agent-projection` 的 onboarding / projection seam 混淆。
   - capability interaction model 不再只有抽象字段定义，而是补齐了可 promotion 的目标分类矩阵。
   - formal landing 已明确固定到 `runtime.orchestration` producer + `runtime.cli-interactive-shell` consumer 的 promotion shape。

## Non-Blocking Suggestions

1. promotion 时建议把新的 ADR 与 contract 名称直接对齐 draft 中的 interaction-model vocabulary，避免 formal docs 再引入第二套近义术语。
2. rollout 实现期建议把 `run` 的“public but narrowed” wording 同步到 i18n/help/presenter copy，而不只停留在 catalog metadata。
3. `/verify` 删除后的 migration copy 最好在 explainer、error copy 与 README/playbook 中共用同一套 wording，减少迁移窗口的解释漂移。

## Promotion Interlocks

1. `product-requirements.md` 与 `product-requirements-brief.md` 必须在 promotion 同窗内同步改写 `connect / doctor / verify` 的公开 onboarding wording。
2. 若 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` 或 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` 仍把 `/verify` 写成公开入口，也必须一起改写，避免 triad/architecture 漂移。
3. promotion 时必须把 `runtime.orchestration` 固定为 command-model source of truth，并只让 `runtime.cli-interactive-shell` 消费新的 contract；不要反向把 shell discoverability 写成 orchestration canonical truth。
4. 实现 rollout 必须同时移除 public `VERIFY` capability/cmd discoverability，并保留 `connect` follow-up、`doctor` mode 与 internal gate 的 readiness checks，避免“删命令 = 删能力”的误读。

## Verification

1. Review baseline included:
   - draft file
   - lifecycle registry entry
   - PRD brief/full
   - overall technical solution + architecture layering
   - `runtime.orchestration` overview + supervisor ADR
   - `runtime.cli-interactive-shell` overview
   - current implementation hotspots around capability catalog, NL routing, slash registry, `run`, and `verify`
2. Delegated reviewer note:
   - 按用户要求已两次启动 fresh reviewer sub-agent
   - 其中一轮被本地 sub-agent service `503 Service Unavailable` 明确中断，另一轮长期无结果后被关闭
   - 在 delegated reviewer 当前不可用的窗口内，本轮 approval 结论由主 agent 按同一 baseline 执行 fallback review 得出
3. Docs-only review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation:
   - update solution to `approved`
   - add this canonical artifact path to `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for formal cutover
