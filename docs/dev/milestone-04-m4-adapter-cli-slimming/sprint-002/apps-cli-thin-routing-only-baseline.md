# apps/cli 仅保留参数编排与路由基线（TK-412）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-002`
- Task: `TK-412`

## 1. 目标

把 `apps/cli` 收敛为薄入口层：只做参数解析、上下文注入、路由分发与输出格式化，不承载业务执行和策略判定逻辑。

## 2. CLI 职责保留清单

1. 命令行参数 schema 校验与默认值补齐。
2. workspace/session/context 装配。
3. 命令到 package executor 的路由映射。
4. 终端输出渲染与交互确认提示。

## 3. CLI 禁止职责清单

1. 禁止直接调用 adapter 执行阶段逻辑。
2. 禁止在 CLI 内进行风险阈值判定。
3. 禁止在 CLI 内实现流程状态机推进。
4. 禁止在 CLI 内持有长期状态存储写入策略。

## 4. 路由契约（Draft）

```ts
enum CliRouteKey {
  Run = "run",
  Check = "check",
  Review = "review",
  ReviewVerify = "review-verify",
}

enum CliOutputMode {
  Pretty = "pretty",
  Json = "json",
}
```

CS-009 落地要求：以上有限集合在实现阶段统一归入常量层管理。

## 5. 目录与模块基线

1. `apps/cli/src/commands/*-command.ts`：仅参数层。
2. `apps/cli/src/routing/*-shared.ts`：仅路由与上下文拼装。
3. `packages/*`：承载执行、策略、流程、适配器能力。

## 6. 输出一致性

1. 默认输出风格遵循 CLI 美化约束，且不改变底层结果语义。
2. `--json` 模式直接透传核心执行结果，不做业务级重写。

## 7. 后续任务输入映射

1. `TK-414`：消费路由与上下文注入边界，落实入口门禁收口。
2. `TK-416`：消费 CLI 轻量入口契约，执行兼容回归。
3. `TK-502`：消费薄入口结构作为 integration/e2e 主链路输入。

## 8. 验收标准

1. CLI 与业务执行层解耦边界清晰。
2. 路由映射可直接驱动核心包调用。
3. 输出模型兼容人类可读与机器消费两种模式。
