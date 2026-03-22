# TK-077 本地安装模式（path/tgz/link）与 clean-room 验证

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

实现无需发布即可本地安装使用，并以 Stage 9A Hard Exit 为准提供 clean-room 最小链路验证能力。

## 2. Depends On

1. `TK-075`

## 3. 预期产物

1. `DA-089` 本地安装模式与 clean-room 验证产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 固化本地安装方案：path/tgz/link 的推荐场景与约束，并明确 sprint-001 至少选择两种模式作为强制门槛。
2. 建立 clean-room 验证脚本：对选定模式分别执行安装 -> `--help` -> `init` -> `doctor` -> `check`，且每种模式需连续 3 次通过；如额外覆盖 `run`，应单列记录为扩展验证，不替代 Stage 9A 门槛。
3. 在 clean-room 环境至少完成 1 组 `tool_managed -> repo_local -> rollback` workspace 切换验证，确认状态、配置与最小目录结构在切换后保持可用。
4. 将只读接入路径纳入安装后预检场景，确认“不写入目标仓库”的 attach/doctor 行为与正式初始化路径边界清晰。
5. 明确本地安装与正式发布模式差异说明，并登记限制、回退路径与推荐场景。
6. 回写台账并登记可复用产物。

## 6. 验证

1. `pnpm run release:verify-cleanroom-local-install`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：根据 `TK-088` 将 clean-room 验证口径收紧为“两种模式 x 连续 3 次 x --help -> init -> doctor -> check”，任务状态保持 `planned`。
3. 2026-03-22：根据 `TK-090` 补齐 workspace 切换/rollback 与只读接入预检验证，任务状态保持 `planned`。
4. 2026-03-22：任务启动，状态切换为 `active`，新增 `scripts/release/verify-cleanroom-local-install.js` 并接线 `pnpm run release:verify-cleanroom-local-install`。
5. 2026-03-22：完成 clean-room 实跑：`path` + `link` 各连续 3 次通过 `--help -> init -> doctor -> check`，并通过 `tool_managed -> repo_local -> rollback` 与只读 attach 预检，状态切换为 `completed`。

## 8. 产出

1. `DA-089` `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-089-local-installation-modes-and-cleanroom-validation.md`
2. clean-room 报告 `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`
3. 验证脚本 `scripts/release/verify-cleanroom-local-install.js`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
