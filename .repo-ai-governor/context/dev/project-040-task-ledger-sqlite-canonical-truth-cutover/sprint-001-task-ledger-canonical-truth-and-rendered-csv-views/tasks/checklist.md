# checklist

- [x] TK-514 activate project-040 and switch task-ledger execution surface
  - 2026-04-04：任务创建，状态初始化为 `planned`。
  - 2026-04-04：状态切换为 `in_progress`，开始创建 `project-040` skeleton 并切换 current-context/completed-history。
  - 2026-04-04：已完成 `project-040` skeleton、current-context 切换与 `project-039` completed history 迁移。
- [x] TK-515 cut over task ledger to sqlite canonical truth and rendered csv views
  - 2026-04-04：任务创建，状态初始化为 `planned`。
  - 2026-04-04：状态切换为 `in_progress`，开始切换 `task-ledger-projection.js`、`sync-task-ledger.js` 与 `check-task-ledger-sync.js` 的真值边界。
  - 2026-04-04：已完成 task ledger sqlite canonical truth cutover；bootstrap/render/compare 能力就位，且相关 task-ledger/artifact-lifecycle/delivery-registry 门禁通过。
- [x] TK-516 align governance contracts plan-ledger seams and regression coverage with sqlite canonical task ledger
  - 2026-04-04：任务创建，状态初始化为 `planned`。
  - 2026-04-04：状态切换为 `in_progress`，开始同步 durable-storage formal docs、task-ledger governance contract 与 planning/ledger seam draft。
  - 2026-04-04：已完成 formal docs/draft 口径更新、completion audit summary 与关键定向验证回链。
