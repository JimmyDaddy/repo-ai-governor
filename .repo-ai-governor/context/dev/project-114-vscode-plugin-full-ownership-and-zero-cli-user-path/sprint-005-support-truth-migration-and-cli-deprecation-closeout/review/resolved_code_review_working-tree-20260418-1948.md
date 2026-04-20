# Code Review: project-114 vscode plugin full ownership and zero-cli user path final delegated review round 7

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-007`
- Review Type: delegated project-final review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/maintainer-validation-playbook.zh-CN.md`
5. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-zero-cli-rehearsal-summary.md`
6. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-project-final-handoff.md`
7. `/Users/jimmydaddy/study/ai-governor/.tmp/project-114-project-final-vscode-distribution-report.json`
8. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/project-114-sprint-005-vscode-distribution-report-20260418T120910Z.json`

## 2. Findings
### 2.1 [P1] Final support-truth docs still point at a pre-fix immutable distribution snapshot
- 位置: `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md:172`
- 问题描述: 风险类型：standards-guided inference。当前 support-truth row、zero-cli rehearsal summary 与 project-final handoff 仍把 `project-114-sprint-005-vscode-distribution-report-20260418T090755Z.json` 当作权威 immutable snapshot，但最新 rerun 证据已经更新到 `.tmp/project-114-project-final-vscode-distribution-report.json`，并新增了 project-final closeout 现在依赖的 `smokeWorkspaceRoot`、`resolvedWorkspaceRoot` 与 `doctorDiagnosticsPath` scratch-isolation 字段。
- 影响: 一旦 `.tmp` scratch 报告被清理，当前 public support claim 将只剩一份过期且证据弱化的 immutable snapshot，无法继续支撑 `CS-004` 要求的真实交付验证链，也与 maintainer playbook 关于“先提升 scratch report 再刷新 backlink”的规则冲突。
- 建议: 将最新 rerun 的 scratch report 提升为新的 timestamped sprint-local immutable snapshot，并把 support-matrix、maintainer playbook、zero-cli rehearsal summary 与 project-final handoff 全部回链到该新证据。

## 3. Notes
1. 本轮 reviewer 没有提出第二条 actionable finding；closeout blocker 完全集中在“公开 support truth 与 sprint-local immutable evidence 未同步到最新 rerun”。
2. additive manual evidence 仍未包含真实 extension-development-host 或 VS Code `Install from VSIX...` session，因为本轮环境没有 `code` CLI；这一点仍是可选人工证据，而非 blocker。

## 4. Verification
1. reviewer 复用了本轮绿色命令证据：targeted `vitest` package slices、release integration test、`pnpm run build`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json` 与 `pnpm run check`
2. reviewer 还直接比对了旧 immutable snapshot 与当前 scratch rerun，确认旧 snapshot 早于最新 rerun，且不包含 `smokeWorkspaceRoot`、`resolvedWorkspaceRoot`、`doctorDiagnosticsPath`

## 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`docs/support-matrix*`、zero-cli rehearsal summary 与 project-final handoff 的确仍回链到了 `20260418T090755Z` snapshot，而当前 `.tmp/project-114-project-final-vscode-distribution-report.json` 的文件时间已经推进到 `2026-04-18T12:09:10Z`，并且新增了 packaged / extracted CLI-backed smoke 的 scratch-isolation 字段。
   - 处理：接受，创建新的 immutable snapshot `project-114-sprint-005-vscode-distribution-report-20260418T120910Z.json`，并同步刷新 support-matrix、maintainer playbook、zero-cli rehearsal summary 与 project-final handoff 的证据时间和回链路径。

### 验证命令
1. `pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`（通过）
2. `pnpm run check:ide-docs-parity`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`project-114-sprint-005-zero-cli-rehearsal-summary.md`、`project-114-sprint-005-project-final-handoff.md`
   - 新证据：`project-114-sprint-005-vscode-distribution-report-20260418T120910Z.json`
   - 验证：`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-114-project-final-vscode-distribution-report.json`、`pnpm run check:ide-docs-parity`、`pnpm run check`（通过）
   - 说明：project-final closeout 现在回链到 post-fix rerun 的 immutable snapshot，durable evidence 已保留 packaged / extracted CLI-backed smoke 的 `smokeWorkspaceRoot`、`resolvedWorkspaceRoot` 与 `doctorDiagnosticsPath` 字段，不再依赖易清理的 `.tmp` scratch report 作为唯一权威证明。

## 处置结果与剩余风险

1. CR-007 的 accepted finding 已全部修复，public support truth、maintainer backlink 与 sprint-local handoff 现在都指向最新 rerun 的 immutable evidence snapshot。
2. 当前 remaining risk 仍仅包括 optional manual GUI evidence 未执行，因为 `code` CLI 在本环境不可用；这不阻断 project-final closeout。
