# sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout 计划

- Status: planned
- Date: 2026-04-13
- Project: `project-098-cli-exec-runtime-rollout`
- Sprint Goal: 锁定 explicit ACP seam guardrail、补齐 non-regression evidence，并完成 rollout closeout。

## 1. Task Package

1. `TK-829` isolate a provisional ACP extension seam behind non-canonical internal runtime boundaries
2. `TK-830` add guardrails so ACP remains additive non-default and non-public without a separate solution
3. `TK-831` produce regression and evidence packets for native cli_exec convergence and ACP seam non-regression
4. `TK-832` finalize project-098 rollout closeout and delivery evidence handoff

## 2. Exit Criteria

1. ACP seam 仅作为 internal / provisional extension seam 落地，不改变 canonical transport truth。
2. governance guardrails 与 non-regression evidence 已能证明 ACP 没有被误表述成当前正式支持路径。
3. project-final closeout 与 delivery evidence handoff 已完整收口。

## 3. Milestones

1. 2026-04-13：作为 `project-098` 的第三阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-13：当前 sprint 明确只承接 seam guardrail 与 closeout，不承接新的 public ACP surface formalization。
