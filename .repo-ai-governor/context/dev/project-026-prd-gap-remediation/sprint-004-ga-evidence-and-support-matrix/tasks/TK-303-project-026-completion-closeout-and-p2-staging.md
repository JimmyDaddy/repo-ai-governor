# TK-303 project-026 completion closeout 与 P2 staging 建议

- Status: planned
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-004-ga-evidence-and-support-matrix`

## 1. 任务目标

完成 project-026 的 DoD 全项核查，执行项目级 closeout，并输出 P2 平台化阶段的 staging 建议。

## 2. Depends On

1. `TK-301`（支持矩阵已发布）
2. `TK-302`（GA 证据已沉淀）

## 3. 预期产物

1. project-026 DoD 核查表（逐项 pass/fail）
2. project plan 状态更新为 `completed`
3. sprint-004 stream 移入 `completed-streams-history.md`
4. `current-context.md` 清理 project-026 active stream
5. P2 staging 建议文档

## 4. DoD 核查项（来自 project plan §5）

| # | DoD 条目 | 验证方式 |
|---|---------|---------|
| 1 | PRD §10.2 #8 GA 硬阻断已关闭（通知 provider 已实装） | 引用 sprint-001 TK-292 rehearsal 通过记录 |
| 2 | Standards Pack 三视图端到端链路已验证闭环 | 引用 TK-293 + `standards-projection-parity.integration.test.ts` |
| 3 | i18n zh-CN/en 键集 parity 已通过 | 引用 TK-294 + `i18n-translation-key-coverage.integration.test.ts` |
| 4 | 至少 Python 和 Go 有最小治理模板 | 引用 TK-298 + `language-minimal-governance-packs.integration.test.ts` |
| 5 | 6 个 public 包 exports 声明已核查并补全 | 引用 TK-295 + `public-package-exports.integration.test.ts` |
| 6 | upgrade/workspace lifecycle adopter UX 已打磨 | 引用 TK-299 + `cli-output-contract.integration.test.ts` |
| 7 | 正式支持矩阵已发布 | 引用 TK-301 产物 `docs/support-matrix.md` |
| 8 | GA Readiness §10.2 全量量化证据已沉淀 | 引用 TK-302 产物 `docs/ga-readiness-evidence.md` |

## 5. Closeout 操作

1. 更新 project plan `plan.md` 状态为 `completed`
2. 更新 sprint-004 plan 状态为 `completed`
3. 更新 sprint-004 checklist 全部标记完成
4. 更新 tasks.csv 全部任务状态为 `completed`
5. 将 sprint-004 stream 移入 `completed-streams-history.md`
6. 清理 `current-context.md` 中 project-026 的 active stream

## 6. P2 Staging 建议范围

基于 `comprehensive-requirements-gap-analysis.md` §4.3 的 P2 远期缺口：

| Gap ID | 描述 | 建议优先序 | 启动条件 |
|--------|------|-----------|---------|
| GAP-DESKTOP | Desktop Client 实装 | P2-1 | 架构基线就绪（sidecar + IPC 已有） |
| GAP-VISUAL | 可视化配置与执行面板 | P2-2 | Desktop Client 基线完成 |
| GAP-CLOUD | 云端同步与策略分发 | P2-3 | 需产品化需求确认 |
| GAP-MARKET | 插槽市场/共享机制 | P2-4 | 需生态规模确认 |
| GAP-ORG | 组织级审计与指标看板 | P2-5 | 需企业客户需求驱动 |
| GAP-SLOT-DX | 插槽调试与测试工具链 | P2-附加 | 可并行推进 |

## 7. 验证命令

1. `pnpm run typecheck`
2. `pnpm run check`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
