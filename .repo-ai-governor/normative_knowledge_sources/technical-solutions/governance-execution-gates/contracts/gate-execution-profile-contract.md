# Gate Execution Profile Contract

- Status: active
- Date: 2026-03-27
- Contract ID: `contract.governance.gate-execution-profile.v1`
- Producer Module: `governance.execution-gates`

## 1. 目标

定义仓库级 gate execution 的 profile 与分层边界，使“repo-global checks / package-local checks / heavy runtime checks”可以在不破坏完整 gate 语义的前提下并行、分层与按影响范围执行。

## 2. Profile Set

1. `repo_global`
2. `package_local`
3. `heavy_runtime`
4. `full`
5. `fast`
6. `affected`

## 3. Minimum Result Shape

1. `profile_id`
2. `execution_mode`
3. `task_entries[]`
4. `depends_on_profiles[]`
5. `requires_build_outputs`
6. `cache_policy`
7. `selection_policy`

## 4. Behavioral Constraints

1. `repo_global` gate 默认不得依赖全仓 `build`，除非明确消费 build 产物。
2. `package_local` gate 必须优先绑定到真实 workspace package/app 边界，而不是继续通过根包脚本间接代表单个 package。
3. `heavy_runtime` gate 应支持独立运行，并允许在 `affected` mode 下按 diff 明确跳过未命中的高成本 smoke / e2e / resilience 路径。
4. `full` 必须是 `fast` 与 `affected` 的超集；`fast` 不得伪装成完整 gate 成功。
5. profile 切换只影响执行范围与编排顺序，不应改变既有 gate 输出契约的机器可读稳定性。

## 5. Compatibility

1. `v1` 不强制仓库立即从根脚本迁移到 package-level scripts，但要求 formal guidance 以 package graph 为目标形态。
2. `v1` 不强制具体实现必须使用 Turbo；只要求 execution profile 与缓存/依赖边界具备同等语义。
3. `v1` 允许 `heavy_runtime` profile 继续使用 `cache=false`。
