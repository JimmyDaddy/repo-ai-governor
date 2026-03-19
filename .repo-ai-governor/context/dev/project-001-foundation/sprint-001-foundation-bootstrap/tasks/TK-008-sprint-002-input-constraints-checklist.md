# TK-008 sprint-002 输入约束清单

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Scope: `TK-009` ~ `TK-012`

## 1. 输入准入条件

1. `pnpm run check` 必须稳定通过（含 dependency boundary warning gate）。
2. `DA-005` 配置契约与 `DA-008` shared i18n runtime 基线必须作为 sprint-002 的默认输入，不允许重复定义。
3. `DA-010` warning gate 违规计数必须保持为 0；若出现违规，先修复或登记白名单再进入 TK-010+。
4. 所有 TK-009~TK-012 任务卡必须在 `Depends On` 中显式引用本清单（`DA-013`）。

## 2. TK-009~TK-012 约束映射

1. TK-009（workspace resolver）
   - 必须复用 `DA-005` 的 `workspace.mode`/schema 语义，不得定义平行字段。
2. TK-010（workspace migration）
   - 迁移链路必须含 `copy -> verify -> switch -> rollback`，且每步有失败回退语义。
3. TK-011（upgrade diff）
   - `schema diff -> 迁移建议 -> 人工确认` 三段契约必须可回放到任务台账。
4. TK-012（sprint-002 exit）
   - 必须包含回滚演练与验收结论，输出可复用 baseline 文档。

## 3. 升级 blocking 的前置条件（从 TK-007 延续）

1. 连续 3 次主干门禁 `check-package-dependency-boundary --mode warn` 无违规。
2. 白名单为空或仅保留“有拆除计划”的短期项。
3. TK-012 验收确认后，允许在下一阶段切换默认命令到 `--mode block`。

## 4. 验证建议命令

1. `node ./scripts/governance/check-package-dependency-boundary.js --mode warn --format json`
2. `pnpm run check`
