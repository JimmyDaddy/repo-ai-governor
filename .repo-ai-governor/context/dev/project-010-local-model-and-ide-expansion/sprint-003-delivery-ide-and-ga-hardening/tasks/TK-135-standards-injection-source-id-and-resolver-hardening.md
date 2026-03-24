# TK-135 standards injection source ID 与 resolver 收口

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-003-delivery-ide-and-ga-hardening`

## 1. 任务目标

将 IDE standards injection 契约从“当前仓库硬编码路径”收敛为“稳定 source IDs + self-hosted resolver registry”，避免把本仓库内部布局误当成产品默认契约。

## 2. Depends On

1. `TK-109`
2. `TK-110`
3. `TK-111`

## 3. 预期产物

1. `DA-135` standards injection source ID 与 resolver 收口产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-109-multi-ide-surface-registry-and-wrapper-contract-hardening.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-110-vscode-jetbrains-official-templates-and-smoke-gate.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-111-cursor-claude-code-integration-templates-and-docs-parity.md`
6. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
7. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
8. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`

## 5. 实施计划

1. 定义稳定的 standards source IDs，并建立 self-hosted resolver registry。
2. 调整 IDE wrapper metadata/env、official templates、contract JSON 与 README 语义。
3. 更新 smoke/parity/integration tests，确保 source ID 与 resolver registry 一致。
4. 回写台账并登记 `DA-135`。

## 6. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/examples/check-ide-entry-smoke.js`
3. `node ./scripts/examples/check-ide-docs-parity.js`
4. `pnpm -s vitest run apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/ide-command-wrapper.contract.test.ts test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
9. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，已确认当前 `standards-injection.contract.json`、IDE wrapper 常量与官方模板都把 `.repo-ai-governor/normative_knowledge_sources/...` 作为默认注入源；下一步将改为 source IDs + self-hosted resolver registry，避免产品契约耦合当前仓库布局。
2. 2026-03-24：已完成 source IDs + self-hosted resolver registry 收口，并同步 IDE wrapper metadata/env、official templates、smoke/parity gate、contract tests 与 `DA-135` / resolved review；当前任务状态更新为 `completed`。
3. 2026-03-24：复核并修复 follow-up CR，已将 `REPO_AI_GOVERNOR_ENTRY_SURFACE / REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID / REPO_AI_GOVERNOR_STANDARDS_SOURCES` 接入真实 CLI 入口的 fail-fast 校验和 JSON diagnostics，消除 source-ID baseline 在实际执行中的 no-op 问题。

## 8. 产出

1. `DA-135` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-135-standards-injection-source-id-and-resolver-hardening.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv`
