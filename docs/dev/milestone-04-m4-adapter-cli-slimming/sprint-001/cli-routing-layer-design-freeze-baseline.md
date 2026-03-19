# CLI 路由层设计冻结基线（TK-406）

- Status: active
- Date: 2026-03-19
- Milestone: `M4`
- Sprint: `sprint-001`
- Task: `TK-406`

## 1. 目标

冻结 `apps/cli` 路由层边界，明确“参数编排与命令路由保留在入口层、核心逻辑下沉 packages”的稳定接口。

## 2. 冻结范围

1. CLI 入口层保留职责：
   - 参数解析与校验。
   - 命令路由与子命令分发。
   - 输出模式选择（pretty/plain/json）的入口级透传。
2. CLI 入口层禁止职责：
   - 流程编排决策。
   - 策略评估与人工闸口判定。
   - 适配器能力判定与降级决策。

## 3. 路由冻结契约（Draft）

```ts
enum CliCommandRouteKey {
  Run = "run",
  Check = "check",
  Review = "review",
  ReviewVerify = "review-verify",
}

enum CliRouteLayer {
  Entry = "entry",
  Package = "package",
}

enum CliRouteFreezeStatus {
  Frozen = "frozen",
  Deprecated = "deprecated",
}
```

CS-009 落地要求：有限集合在代码实现阶段统一落到 `src/constants/`。

## 4. 命令到包层映射（基线）

1. `run` -> `core-runtime` orchestration entry
2. `check` -> governance/quality gate package entry
3. `review` -> review workflow package entry
4. `review-verify` -> verify workflow package entry

## 5. 变更控制规则

1. 新增 CLI 命令必须先声明 `routeKey` 与包层落点。
2. 任何进入包层的 breaking change 必须同步更新映射清单与迁移说明。
3. CLI 层仅允许“参数与路由改动”，业务逻辑改动必须进入包层。

## 6. 后续任务输入映射

1. `TK-411`：消费冻结边界进行核心逻辑下沉设计。
2. `TK-412`：消费冻结映射实现 CLI 仅保留参数编排与路由。
3. `TK-416`：消费冻结口径做兼容性回归。

## 7. 验收标准

1. CLI 层与包层职责边界可执行、可审计。
2. 命令映射清单可作为后续实现单一事实源。
3. 与 M4 sprint-002 任务接口关系清晰。
