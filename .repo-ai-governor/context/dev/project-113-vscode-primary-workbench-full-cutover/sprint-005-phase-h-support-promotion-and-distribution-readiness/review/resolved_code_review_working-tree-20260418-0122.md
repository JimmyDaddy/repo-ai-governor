# Code Review: sprint-005 phase-h post-fix recheck round 5

- Status: resolved
- Date: 2026-04-18
- Reviewer: AI-Agent
- Task: `CR-005`
- Review Type: sprint boundary recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `docs/maintainer-validation-playbook.md`
2. `docs/maintainer-validation-playbook.zh-CN.md`
3. `docs/support-matrix.md`
4. `docs/support-matrix.zh-CN.md`
5. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/project-113-sprint-005-vscode-distribution-report-20260417T171401Z.json`
6. `.repo-ai-governor/context/dev/project-113-vscode-primary-workbench-full-cutover/sprint-005-phase-h-support-promotion-and-distribution-readiness/tasks/CR-005.md`

## 2. Findings
### 2.1 [P2] Maintainer playbook still routed VS Code evidence through the mutable `.tmp` report
- 位置: `docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`
- 问题描述: support-matrix 已经把 VS Code primary-workbench 的公开证据回链切到 immutable snapshot，但 maintainer playbook 仍把 `.tmp/project-113-sprint-005-vscode-distribution-report.json` 当作可复用 evidence path，导致后续正常 rerun 仍可能把 support-truth 再次拉回可变证据链。
- 影响: 维护者 runbook 会继续制度化可变 artifact 作为公开 claim 的证据面，削弱 `CS-004` 要求的验证证据可追溯性，并让 CR-004 的修复缺少制度层收口。
- 建议: 保留 `.tmp` 作为 rerun 工作输出，但把 maintainer-facing authoritative backlink 明确切到 timestamped immutable snapshot，并在 runbook 中写清楚“刷新 public docs 前先 promote snapshot”。

## 3. Notes
1. support-matrix 当前已正确回链 immutable snapshot，本轮不需要再次修改公开 claim row。
2. 未发现 `vscode-extension-presentation-builder`、distribution verify script 或对应测试面上新的 remaining actionable finding。

## 4. Verification
1. `pnpm run check:ide-docs-parity`（通过）
2. `pnpm run build`（未执行；本轮 accepted fix 仅修改 maintainer playbook/backlink guidance，未改动可执行或 typed surface）

## 5. 复核结论（2026-04-18）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：maintainer playbook 的 VS Code refresh 段落与 common evidence path 列表仍把 `.tmp/project-113-sprint-005-vscode-distribution-report.json` 作为 maintainer-facing evidence path，而 support-matrix 已改为不可变 snapshot。
   - 处理：在中英文 maintainer playbook 中明确 `.tmp` 仅是 rerun 工作输出，并把 authoritative backlink 固定到 timestamped immutable snapshot。

### 验证命令
1. `pnpm run check:ide-docs-parity`（通过）
2. `pnpm run build`（未执行；docs-only fix，不要求 build）

## 6. 修复执行记录（2026-04-18）

1. `2.1`：已完成
   - 变更文件：`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`
   - 验证：`pnpm run check:ide-docs-parity`（通过）
   - 说明：maintainer runbook 现在明确区分 scratch `.tmp` rerun output 与 authoritative immutable snapshot，后续刷新 support docs 时不再把公开证据面回退到可变 artifact。
