# ADR: Current Surface Baseline Classification And Follow-Up Decomposition

- Status: active
- Date: 2026-04-08
- Module: `runtime.governance-clients`

## 1. Context

旧的 adopter priority roadmap 已经驱动 `project-052 ~ project-057` 完成了一轮 CLI truthfulness、real adapter invocation、VS Code secondary surface、GA evidence 与 standards productization 收口。

但在这些历史流完成后，当前仓库仍存在两类新的治理问题：

1. 需要重新判定哪些 surface 已经进入正式实现，哪些仍只是 baseline / MVP / foundation / fallback-only / reserved，而不是继续沿用过时 gap 判断。
2. 需要把新的 priority order 直接投影成下一轮真实 execution stream，而不是让最新盘点再次停留在 draft 分析层。
3. 新的 triad 已明确要求首批入口显式承载 host-native plugin / skill / agent / hooks / MCP 资产的 lifecycle、upgrade、support-truth 与 adopter consumption，因此 `project-067` 必须成为正式 follow-up，而不能继续被挤进 reserved target backlog。

## 2. Decision

正式采用以下当前端面分类与 follow-up decomposition。

### 2.1 Surface Classification

| surface / capability | classification | decision |
| --- | --- | --- |
| CLI primary surface | implemented primary surface | 继续作为当前第一优先级产品面 |
| session shell / resume / slash command | implemented interactive surface | 不再视为 demo |
| Codex / Claude Code / GitHub Copilot real-path onboarding | implemented but truthfulness-sensitive | 继续 hardening，不再回退成 fixture-only 叙事 |
| host-native distribution baseline | baseline completed, follow-up required | 后续重点从“有没有导出”切到 lifecycle / support-truth / adopter consumption |
| packaged install | rehearsal-level baseline | 需要独立 closeout，不与 CLI truthfulness 混写 |
| VS Code extension | companion MVP | 先补 packaged distribution 与 smoke gate，再升级支持口径 |
| desktop sidecar | foundation only | 保留为 secondary-surface decision，不误报为完整桌面产品 |
| local-model | fallback-only real-path | 保持为保守支持面，放在 P2 |
| GitHub.com coding agent target | reserved placeholder | 继续 deferred，不抢当前主线 |

### 2.2 Follow-Up Order

1. 下一条真正建议激活的 primary stream 固定为 `project-062-cli-continuity-and-adapter-truthfulness-hardening`。
2. adopter-facing distribution truth lane 固定按 `project-063-packaged-distribution-and-install-surface-closeout -> project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption` 推进。
3. secondary surface productization 固定按 `project-064-vscode-packaged-secondary-surface-rollout -> project-065-desktop-secondary-surface-productization-decision` 推进。
4. ecosystem expansion 固定由 `project-066-standards-and-language-pack-ecosystem-expansion` 承接。
5. `project-068-p2-fallback-and-reserved-target-followups` 保持 `P2 deferred`，只承接 `local-model` 能力天花板与 `github-com-agent` reserved target follow-up。

### 2.3 Task Package Allocation

1. `project-062` 使用 `TK-661 ~ TK-666`。
2. `project-063` 使用 `TK-667 ~ TK-669`。
3. `project-064` 使用 `TK-670 ~ TK-672`。
4. `project-065` 使用 `TK-673 ~ TK-675`。
5. `project-066` 使用 `TK-676 ~ TK-678`。
6. `project-067` 使用 `TK-679 ~ TK-681`。
7. `project-068` 使用 `TK-682 ~ TK-686`。

## 3. Rationale

1. CLI 仍是当前最成熟的 adopter-facing 主产品面，最近用户反馈也直接集中在会话连续性与 adapter truthfulness，因此 `project-062` 必须先行。
2. packaged install 与 host-native asset lifecycle 共同组成 adopter-facing distribution truth；若拆得太开，用户仍会同时面对“安装边界不清”和“导出资产后如何 apply/verify/upgrade 不清”的双重漂移。
3. host-native plugin / skill / agent carry slot 已被 PRD / brief / overall technical solution / architecture 同步接纳，因此 `project-067` 是正式 follow-up，不再只是 draft 偏好。
4. VS Code 与 desktop 都已有非 demo 基线，但当前仍应先收 adopter distribution truth，再做 secondary surface productization，避免同时发散。
5. `local-model` 与 `github-com-agent` 都属于有边界的保守或 reserved surface，晚于主 adoption path 收口更符合 ROI。

## 4. Consequences

1. `runtime.governance-clients` 的 planning-side formal truth 需要同时保留“priority sequencing ADR”与“current surface baseline/decomposition ADR”两层信息。
2. `technical-solution.adopter-productization-priority-roadmap` 的 delivery handoff 从历史完成流 `project-052 ~ project-057` 更新为新的 planned follow-up stream `project-062`，并通过 `project-072` handoff artifact 回链 `project-063 ~ project-068`。
3. `project-052 ~ project-057` 保留为已完成历史证据，但不再代表当前下一轮 primary / planned stream truth。
4. `current-context.md` 必须显式登记 `project-062 ~ project-068` 的 planned follow-up streams，避免 delivery registry 指向“存在于文档但不在上下文 surface 可见”的虚假 follow-up。

## 5. Follow-Up

1. `project-062`: CLI continuity and adapter truthfulness hardening
2. `project-063`: packaged distribution and install-surface closeout
3. `project-067`: host plugin / skill / agent lifecycle and adopter consumption
4. `project-064`: VS Code packaged secondary-surface rollout
5. `project-065`: desktop secondary-surface productization decision
6. `project-066`: standards and language-pack ecosystem expansion
7. Deferred:
   - `project-068-p2-fallback-and-reserved-target-followups`
