# TK-079 用户接入文档与本地采用手册基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

补齐接入与运维文档，使工具用户可在 5~15 分钟内独立完成本地接入、调试与升级。

## 2. Depends On

1. `TK-075`
2. `TK-077`
3. `TK-078`

## 3. 预期产物

1. `DA-091` 用户接入文档与本地采用手册基线产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 补齐 `README.md` 与 `README.zh-CN.md` 的 5~15 分钟接入路径，至少覆盖本地安装选择、只读接入预检、`--help -> init -> doctor -> check` 命令示例与常见下一步。
2. 补齐 `CHANGELOG.md` 与 `CHANGELOG.zh-CN.md` 升级说明与变更记录基线，并显式记录 CLI `json` 契约变化或迁移说明。
3. 形成本地接入/调试/升级 playbook，回链 `scripts/examples/`、clean-room 验证差异说明、workspace 切换/rollback 指引与常见故障排查路径。
4. 为完整自动闭环补齐 `review-verify`、台账回写与治理 gate 相关的用户可见说明，确保 Stage 9B rehearsal 不依赖隐含知识。
5. 在 `DA-091` 中登记文档 readiness、遗留缺口与供 `DA-092`/Stage 9B 消费的文档前置条件。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 将文档目标收紧为独立接入、`doctor` 路径覆盖与 CLI 兼容迁移说明，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐只读接入、workspace rollback 与完整 `review-verify` 闭环文档口径，任务状态保持 `planned`。
4. 2026-03-22：任务启动，状态切换为 `active`，完成双语 README/CHANGELOG 与本地接入手册初稿收敛。
5. 2026-03-22：完成 `DA-091` 与台账同步，补齐 review 记录并通过 `check-task-ledger-sync`、`check-sprint-plan-status-sync`、`check-code-review-status-sync`、`pnpm run check`，状态切换为 `completed`。

## 8. 产出

1. `DA-091` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-091-user-docs-and-local-adoption-playbook-baseline.md`
2. `README.md`
3. `README.zh-CN.md`
4. `CHANGELOG.md`
5. `CHANGELOG.zh-CN.md`
6. `docs/local-adoption-playbook.md`
7. `docs/local-adoption-playbook.zh-CN.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-079-user-docs-and-local-adoption-playbook-baseline.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
11. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
