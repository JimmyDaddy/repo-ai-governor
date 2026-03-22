# TK-075 CLI 命令去 skeleton 化与最小治理链路

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

完成关键命令从占位输出到可执行语义的收敛，确保 Stage 9A 的 `init/doctor/check` 硬门槛与最小治理链路可运行，并为 Stage 9B 保留稳定 CLI 契约。

## 2. Depends On

1. `DA-086`

## 3. 预期产物

1. `DA-087` CLI 命令去 skeleton 化与最小治理链路产物文档。
2. CLI 输出兼容约束说明（含 `pretty/plain/json` 行为边界与 `json` 字段迁移规则）。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-007-platformization/sprint-002-org-governance-and-rollout-readiness/tasks/TK-073-project-007-exit-acceptance-and-rollout-input-constraints.md`（`DA-086`）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 收敛 `init/doctor/check/run/review/review-verify/plan/upgrade` 的最小可执行语义，其中 `init/doctor/check` 必须满足 Stage 9A Hard Exit，不再返回 skeleton 占位输出。
2. 为 `doctor` 与首次接入路径补齐“只读接入模式”与既有规范检测/复用建议，确保在不写入目标仓库的情况下也能输出治理状态、接入建议与下一步动作。
3. 打通 `compiler -> runtime -> policy -> audit/report` 最小链路并统一错误输出契约，同时为 `review/review-verify` 与后续台账回写预留稳定命令边界。
4. 对齐 CLI 输出模式契约，确保 `pretty/plain/json` 三模式语义一致；`json` 字段默认只允许增量扩展，若存在 breaking change，必须提供 deprecation window、兼容模式或 before/after 示例输出。
5. 在 `DA-087` 中显式登记供 `DA-092` 与 Stage 9B 消费的稳定契约、已知限制、read-only attach 行为边界与待继续收敛项。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-087`/`TK-088` 补齐 Stage 9A 硬门槛、CLI 兼容迁移与 `DA-092` 交接约束，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐只读接入模式、既有规范复用建议与 `review/review-verify` 命令边界，任务状态保持 `planned`。
4. 2026-03-22：任务启动，状态切换为 `active`，完成 CLI 运行时从 skeleton 常量到可执行治理链路的主实现接线（`init/doctor/check/run/review/review-verify/plan/upgrade`）。
5. 2026-03-22：完成 `@repo-ai-governor/reporting` 运行时构建镜像缺口修复，恢复 `pnpm run help` 可执行；同步 CLI 输出契约扩展与任务台账，状态切换为 `completed`。

## 8. 产出

1. `DA-087` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`

## 9. DA-087 交付摘要

1. 命令语义去 skeleton 化：
   - `init/doctor/check` 满足 Stage 9A 硬门槛，`run/review/review-verify/plan/upgrade` 提供最小可执行语义与结构化结果。
2. 最小治理链路打通：
   - `compiler -> runtime -> risk -> policy -> audit -> report/replay` 在 CLI `run` 路径内可执行并可产出 artifact。
3. 只读接入行为边界：
   - `doctor` 可在写权限受限场景输出 attach mode、基线探测结果与下一步动作建议。
4. 输出契约与兼容策略：
   - `pretty/plain/json` 三模式语义对齐；`json` 以增量字段扩展为默认策略，新增 `command_result` 承载稳定机器可读摘要。
5. 验证证据：
   - `pnpm run help`、`pnpm vitest run --config vitest.packages.config.ts apps/cli/test`、`pnpm run typecheck`、`pnpm run check` 通过。
