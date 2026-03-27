# sprint-002-package-level-gates-and-build-graph-cutover 计划

- Status: completed
- Date: 2026-03-27
- Project: `project-025-gate-execution-efficiency-implementation`

## 1. Sprint Goal

将核心 package 的 `build / typecheck / test:unit` 下沉到 package-level，并让 Turbo 真正消费 workspace package graph 与 cache policy。

## 2. Task Package

1. `TK-283` package-level build typecheck test pilot 与 core package cutover（completed）
2. `TK-284` turbo package graph 与 cache policy cutover（completed）
3. `TK-285` sprint-002 出口验收与 sprint-003 输入约束（completed）

## 3. Exit Criteria

1. 至少一个核心 package pilot 已具备 package-level `build / typecheck / test` 真正执行入口。
2. Turbo 开始消费 workspace package graph 与 cache policy，而不是继续依赖根级单体 gate 编排。
3. `check` 完整语义保持兼容，`fast` profile 不被回退成伪 full gate。
4. sprint-003 的 TS project references 与 affected planner 输入约束已被冻结为显式 follow-up。

## 4. Execution Notes

1. 本 sprint 由 `sprint-001-repo-global-parallelization-and-fast-check-baseline` closeout handoff 激活。
2. `packages/core-memory-semantics` 已完成首个 core package pilot，并已沿 `shared -> memory-store-adapter -> core-memory -> core-memory-semantics` 依赖链补齐 package-level pilot 入口。
3. `check:package-local:pilot` 已通过两次连续验证，其中第二次获得 `12/12 cached`，证明 Turbo 已开始消费 workspace package graph 与 package-local outputs。
4. `sprint-003-project-references-affected-check-and-ci-matrix` 继续保持 planned follow-up，不在当前 sprint 内隐式开工。
5. `code_review_working-tree-20260328` 已于 2026-03-28 完成复核并收口：接受并修复了 `copy-runtime-assets --package` 健壮性与 repo-global gate JSON 诊断长度两项问题，其余 finding 判定为非阻塞或记录性观察。
