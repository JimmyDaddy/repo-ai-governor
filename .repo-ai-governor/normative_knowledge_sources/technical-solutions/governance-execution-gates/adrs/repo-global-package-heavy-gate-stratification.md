# ADR: Repo-global、Package-local 与 Heavy-runtime Gate Stratification

- Status: active
- Date: 2026-03-27
- Module ID: `governance.execution-gates`

## 1. Context

当前 gate 执行已经接入 `turbo`，但仍保留显著的单体特征：

1. gate 入口主要集中在根 `package.json`。
2. `turbo.json` 里的大多数 gate 仍是根任务，且广泛依赖一次全仓 `build`。
3. `cache=false` 使可确定性复用的治理检查无法获得缓存收益。
4. `tsconfig.build.json` 仍是单体全仓 build，package-level build / typecheck / test 尚未下沉。

## 2. Decision

1. 将 gate execution 正式分成三层：
   - `repo-global`
   - `package-local`
   - `heavy-runtime`
2. 为本地与 PR 场景正式引入三类执行 profile：
   - `full`
   - `fast`
   - `affected`
3. 将 repo-global checks 从“默认依赖全仓 build”改为“仅在确实消费 build 产物时依赖 build”。
4. 将 future 演进方向固定为：
   - package-level scripts
   - package graph execution
   - TS project references
   - affected gate planning

## 3. Consequences

1. 本地反馈路径将从“统一全量 gate”演进为“分层 + 并行 + 按影响范围”的执行模型。
2. formal solution 会先提供结构化 guidance，不把所有实现 phases 自动视为当前已承诺的代码改造。
3. 若未来要真正落地 package-level scripts、Turbo task graph 重构与 TS project references，需要新开 implementation stream 承接。
