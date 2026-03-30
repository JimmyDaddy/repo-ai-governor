# sprint-004-ui-consumer-and-rollout-closeout 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-030-runtime-agent-projection-phase-2-productization`
- Sprint Goal: 落地 formal UI consumer baseline，并完成 phase-2 productization 的 docs / review / rollout closeout。

## 1. Task Package

1. `TK-428` add formal UI consumer baseline for desktop and richer UI surfaces
2. `TK-429` close docs, review, and rollout evidence for phase-2 productization

## 2. Exit Criteria

1. 存在一个 transport-neutral 的 `agent projection` panel/view-model seam，可被 React CLI 与 desktop-ready surface 共同消费。
2. 至少一个正式 UI consumer 已接入该 panel/view-model seam，不再只停留在 JSON-only 或 line-only presenter。
3. `integrations/desktop/**` 或相应 baseline docs/sample 明确回链到同一套 consumer seam，而不是旁路 runtime internals。
4. `project-030` 的 docs / review / rollout closeout 证据齐全，并满足 build + governance gate 要求。

## 3. Milestones

1. 2026-03-30：建立 `sprint-004` planning surface，并将 `current-context.md` primary stream 从 `project-031 / sprint-004` closeout surface 切换回 `project-030 / sprint-004`。
2. 2026-03-30：开始执行 `TK-428`，目标是落地 transport-neutral view-model + React panel，并先接入 command-level React shell。
3. 2026-03-30：完成 `TK-428 ~ TK-429`，`connect` React shell 成为第一正式 UI consumer，desktop baseline docs 对齐同一 seam，并补齐 resolved review / completion audit。
