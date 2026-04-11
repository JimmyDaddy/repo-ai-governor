# sprint-002-runtime-resolution-and-doctor-diagnostics 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint Goal: 打通 `credentialRef` runtime resolution、canonical onboarding/projection normalization 与 doctor secret diagnostics。

## 1. Task Package

1. `TK-792` resolve credentialRef through secret backends and preserve env precedence
2. `TK-793` normalize user-config authoring into enabled-tools and projection canonical truth
3. `TK-794` add doctor secret-backend availability and missing-secret guidance across supported platforms
4. `TK-795` sprint-002 exit acceptance and sprint-003 activation handoff

## 2. Exit Criteria

1. `credentialRef` 已不再只是 manual-only truth，而是可由 runtime 通过 secret backend 做 read-only resolution。
2. `user-config` authoring 已稳定归一化到 `enabled_tools[] / configured_remote_api / AgentDescriptor.selected_*`。
3. `doctor` 已能诚实暴露 backend availability、missing secret 与 secure next action guidance。

## 3. Milestones

1. 2026-04-11：作为 `project-089` 的第二阶段 execution surface 创建，当前保持 `planned`。
2. 2026-04-12：`TK-791 / DA-791` 已完成 sprint-001 closeout 与 activation handoff，当前已切换为 active sprint，`TK-792` 进入 `in_progress`。
3. 2026-04-12：`CR-003` fresh delegated clean recheck 已返回无 actionable finding；`TK-795 / DA-795` 已完成 sprint closeout，并将 primary execution surface 切换到 `sprint-003`。
