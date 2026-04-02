# TK-479 deliver migration verification rebuild and cutover governance for durable storage surfaces

- Status: active
- Date: 2026-04-02
- Owner: AI-Agent
- Priority: P0
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint: `sprint-004-migration-verification-and-cutover-governance`

## 1. 任务目标

为 runtime session durable truth、artifact registry sqlite truth 与 `tasks.csv` sqlite projection 补齐 migration、doctor/verify、rebuild/render/reconcile 与 cutover governance，确保新旧工作区升级路径可验证、可审计。

## 2. Depends On

1. `TK-476`
2. `TK-477`
3. `TK-478`
4. `TK-480`

## 3. 预期产物

1. durable storage surfaces 的迁移流程与回滚边界
2. doctor/verify 对 sqlite truth / projection drift / rendered view consistency 的检测能力
3. rebuild/render/reconcile/cutover governance gate
4. cleanroom / adoption / rollout evidence baseline
5. 与 artifact lifecycle automation / auto-archive 的协同 cutover 与治理验证

## 4. 实施计划

1. 为旧工作区提供 `copy -> verify -> switch` 或等价迁移路径。
2. 扩展 doctor/verify，让其显式检测 sqlite-fs default truth、artifact registry canonical truth 与 ledger projection 健康状态。
3. 收口 rebuild/render/reconcile/cutover governance 与相关脚本/回归。
4. 将 artifact lifecycle automation / auto-archive 纳入 governance closeout 范围，并与 doctor/verify/cutover gate 协同验证。
5. 在 cleanroom/adoption 场景中验证升级路径，沉淀 rollout evidence。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
3. `pnpm run build`
4. cleanroom / verify / doctor / migration / rollout 相关定向测试与 smoke

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`。
2. 2026-04-02：补充 `TK-480` 作为配套 follow-up package，使 artifact lifecycle automation / auto-archive 从 sprint-004 起进入正式实施范围。
3. 2026-04-02：随着 `sprint-003 / TK-478` 收口完成，`TK-479` 被提升为 `active`，开始承接 migration、verify/doctor、rebuild/render/reconcile 与 cutover governance 的实现窗口。
