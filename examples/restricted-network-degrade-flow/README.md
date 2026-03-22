# Example: Restricted Network Degrade Flow

## 输入

1. 受限网络或离线场景，优先验证本地治理链路可运行。
2. 需要明确 `read-only attach` 边界，以及 `tool_managed` / `repo_local` workspace 差异。
3. 推荐使用 `--dry-run --trace` 避免不必要外部副作用。

## 命令

```bash
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
pnpm exec repo-ai-governor check --output json
```

## 预期输出

1. `doctor` 在无写权限时应返回 `read-only attach` 语义提示，而不是直接崩溃。
2. `run` 在受限场景下仍可输出本地诊断与策略决策信息。
3. `check` 输出本地可执行治理检查结果，缺失脚本应有可解释告警。
4. 切换到 `repo_local` 时写入仓库内 `.repo-ai-governor/`，默认 `tool_managed` 时写入工具侧 workspace。

## 排障

1. 若 `doctor` 未输出 attach 信息，检查输出模式与 command_result 字段是否被过滤。
2. 若 `run` 在受限网络中失败，优先确认是否启用 `--dry-run` 并查看 trace 错误上下文。
3. 若 workspace 路径与预期不一致，检查 `governor.yaml.workspace.mode` 与运行目录。

## 可执行资产

1. 机器可执行场景：`examples/restricted-network-degrade-flow/scenario.json`
2. 固定输入约束：`examples/restricted-network-degrade-flow/fixtures/input.md`
3. 运行基线断言：`examples/restricted-network-degrade-flow/expected/runtime-baseline.json`
