# sprint-002-onboarding-and-adapter-matrix 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

落实 `connect / doctor / verify` 三段式 onboarding 链路与最小支持矩阵。

## 2. Task Package

1. `TK-318` 实现 connect 模板与路由基线生成。
2. `TK-319` 实现 doctor --adapters 探测与 safe_local 修复。
3. `TK-320` 实现 verify --adapters 矩阵报告。

## 3. Exit Criteria

1. `connect` 已支持 `single-tool-minimal`、`multi-tool-default`、`single-tool-all-roles`、`restricted-network-safe` preset，并生成候选配置产物。
2. `doctor --adapters` 已区分 safe-local repair 与 manual-only nextAction 边界。
3. `verify --adapters` 已输出 `pass / warn / fail` 三档判定、role/tool matrix、onboarding contract 与 agent view。

## 4. Execution Notes

1. 2026-03-30：`connect` 已支持 `--preset`、`--tools`、`--overwrite`、`--single-tool-all-roles` 与重复 `--role-binding`，并把候选配置写入 `context/diagnostics/connect/*.governor.yaml`。
2. 2026-03-30：`doctor --adapters --fix` 仅执行 safe-local repair；认证、网络、CLI 安装与本地模型下载全部继续落为 `nextAction`。
3. 2026-03-30：`verify` 即使未显式传 `--adapters` 也会按 adapters baseline 执行，但 adopter-facing 文档已统一推荐显式带上 `--adapters`。
