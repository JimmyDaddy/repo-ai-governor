# M1 核心包抽离 SPRINT-002 Checklist

- [x] **TK-111** 抽离 core-memory（负责人：Core Runtime｜优先级：P0｜截止：2026-04-28｜状态：done）
  - 执行记录：plan=定义 core-memory 抽离边界、记忆分层契约与迁移步骤并形成统一输入;result=已新增 `core-memory-extraction-baseline.md`，明确职责边界|最小契约|依赖方向|回归口径;verify=内容与总方案 4.3 和架构 Step 2 约束一致
  - 执行记录：review_delta=已在 `docs/dev/dependency-artifact-registry.md` 登记 `DA-011`，并在 `TK-112`、`TK-113`、`TK-116` 建立 Depends On 与输入引用;verify=core-session|memory-store-adapter|M1 退出回归任务可直接消费该基线
  - 执行记录：review_delta=已完成 CR 复核并流转为 `verified_review_tk-111-core-memory-extraction-baseline.md`;verify=复核通过，无新增问题
- [x] **TK-112** 抽离 core-session（负责人：Core Runtime｜优先级：P0｜截止：2026-04-28｜状态：done）
  - 执行记录：plan=定义 core-session 抽离边界、共享会话契约与迁移步骤并形成统一输入;result=已新增 `core-session-extraction-baseline.md`，明确职责边界|事件流|快照回放|回归口径;verify=内容与总方案 4.2/6.5 和架构 Step 2 约束一致
  - 执行记录：review_delta=已在 `docs/dev/dependency-artifact-registry.md` 登记 `DA-012`，并在 `TK-113`、`TK-116`、`TK-213`、`TK-214` 建立 Depends On 与输入引用;verify=memory-store-adapter|M1 退出|M2 session 任务可直接消费该基线
  - 执行记录：review_delta=已完成 CR 复核并流转为 `verified_review_tk-112-core-session-extraction-baseline.md`;verify=复核通过，无新增问题
- [x] **TK-113** 抽离 memory-store-adapter（负责人：Storage｜优先级：P0｜截止：2026-04-28｜状态：done）
  - 执行记录：plan=定义 memory-store-adapter 抽离边界、Provider 契约与装配基线并形成统一输入;result=已新增 `memory-store-adapter-extraction-baseline.md`，明确职责边界|最小契约|能力矩阵|后端扩展路径;verify=内容与总方案 4.3 存储后端抽象和架构 Step 2/3 约束一致
  - 执行记录：review_delta=已在 `docs/dev/dependency-artifact-registry.md` 登记 `DA-013`，并在 `TK-116`、`TK-211`、`TK-212` 建立 Depends On 与输入引用;verify=M1 退出回归与 M2 memory 接入任务可直接消费该基线
  - 执行记录：review_delta=已完成 CR 复核并流转为 `verified_review_tk-113-memory-store-adapter-extraction-baseline.md`;verify=复核通过，无新增问题
- [ ] **TK-114** 抽离 notification-dispatcher（负责人：Notification｜优先级：P0｜截止：2026-04-28｜状态：todo）
- [ ] **TK-115** 接入依赖方向自动检查（先 warning）（负责人：Architecture｜优先级：P1｜截止：2026-04-28｜状态：todo）
- [ ] **TK-116** M1 退出回归与 CR 收口（负责人：QA｜优先级：P1｜截止：2026-04-28｜状态：todo）
