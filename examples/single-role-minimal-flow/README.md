# Example: Single Role Minimal Flow

## 输入

1. 本地仓库已安装 `repo-ai-governor`（path 或 link 模式）。
2. 目标仓库具备可写工作目录。
3. 默认使用 `tool_managed` workspace。

## 命令

```bash
pnpm exec repo-ai-governor init --output json
pnpm exec repo-ai-governor doctor --output json
pnpm exec repo-ai-governor check --output json
```

## 预期输出

1. 三条命令均返回 JSON payload，且 `status=success`。
2. `init` 产出 workspace 初始化 artifact。
3. `doctor` 输出 attach mode 与环境探测结果。
4. `check` 输出治理脚本状态总览（pass/warn/fail）。

## 排障

1. 若 `init` 失败，优先检查安装方式与 Node 版本是否在支持矩阵内。
2. 若 `doctor` 返回异常 attach mode，检查当前目录写权限与 workspace 根路径。
3. 若 `check` 失败，优先定位 `command_result.checks[]` 中 `status=fail` 的条目。

## 可执行资产

1. 机器可执行场景：`examples/single-role-minimal-flow/scenario.json`
2. 固定输入约束：`examples/single-role-minimal-flow/fixtures/input.md`
3. 运行基线断言：`examples/single-role-minimal-flow/expected/runtime-baseline.json`
