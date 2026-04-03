# TK-504 add remote-api delivery verification and clean-room smoke coverage

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P1
- Project: `project-037-agent-invoke-liveness-and-timeout-governance-rollout`
- Sprint: `sprint-002-cross-adapter-liveness-rollout-and-diagnostics`

## 1. 任务目标

补齐 `remote_api` enabled distribution、clean-room smoke、release verification 与 rollout evidence，使 `technical-solution.api-key-remote-adapter-invocation` 的 delivery handoff 有可执行验证闭环。

## 2. Depends On

1. `TK-501`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `scripts/release/verify-local-distribution.js`
4. `scripts/release/verify-cleanroom-local-install.js`

## 3. 预期产物

1. remote-api enabled distribution verification baseline
2. clean-room smoke 脚本或矩阵补充
3. rollout evidence / verification artifact
4. release guidance 对齐
5. delivery registry 可回链证据

## 4. 实施计划

1. 定义 remote-api enabled distribution 所需的最小 env/config 注入方式。
2. 为 clean-room install / local verify 增补 remote-api smoke 断言与失败分类。
3. 记录 rollout evidence，并把验证输出回链到 delivery handoff surface。
4. 评估是否需要 companion release-governance change 承接更正式的 gate profile。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run build`
4. `release verify + clean-room remote_api` 相关定向验证

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；从 `TK-501` baseline 拆分 delivery verification / clean-room smoke follow-through。
2. 2026-04-03：完成 release verification / clean-room smoke 收口：新增 remote-api stub runtime 与独立 server entry，`verify-local-distribution.js` 现已执行 dist-binary remote-api rehearsal，`verify-cleanroom-local-install.js` 现已覆盖 `path/link/tgz` remote-api rehearsal；playbook 文档、`DA-504` 与 delivery registry 已同步，`pnpm run build`、两条 release verify 命令通过，任务标记 `completed`。
