# sprint-001-connect-command-remote-api-authoring 计划

- Status: completed
- Date: 2026-04-11
- Project: `project-085-command-based-remote-api-configuration`
- Sprint Goal: 为 `connect` 增加首次 remote_api 命令式配置能力，并完成文档、测试与 closeout。

## 1. Task Package

1. `TK-773` add command-based remote_api authoring to connect onboarding flow
2. `TK-774` finalize project-085 closeout after connect remote_api command authoring

## 2. Exit Criteria

1. `connect` 可以直接接收 remote_api authoring 参数来生成首次 candidate config。
2. connect help、用户文档与回归测试反映该能力。
3. sprint 台账、plan 与 `current-context.md` 在 closeout 时保持同步。

## 3. 里程碑记录

1. 2026-04-11：作为 `project-085` 的唯一 sprint 创建，并立即成为当前 active primary stream。
2. 2026-04-11：范围锁定为“首次 remote_api 配置的 connect 命令 authoring 能力”，不新增新的 public command family。
3. 2026-04-11：`TK-773` 已完成，`connect` 可通过命令直接 author 首次 `remote_api` candidate，并已补齐 tests/docs/help。
4. 2026-04-11：`TK-774` 已完成，sprint closeout、completion audit 与 current-context write-back 已同步收口。
