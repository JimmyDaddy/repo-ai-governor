# Code Review: project-054-vscode-secondary-surface-rollout final delegated review loop round 2

- Status: resolved
- Date: 2026-04-07
- Reviewer: fresh delegated reviewer, verified by AI-Agent
- Task: `CR-002`
- Review Type: project scoped delegated final review
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

1. `apps/vscode-extension/**`
2. `apps/desktop/README.md`
3. `integrations/desktop/README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/maintainer-validation-playbook.md`
7. `docs/maintainer-validation-playbook.zh-CN.md`
8. `docs/support-matrix.md`
9. `docs/support-matrix.zh-CN.md`
10. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
11. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/plan.md`
12. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/tasks/**`
13. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/review/**`

## 2. Findings

### 2.1 [P2] Support-truth verification slices omitted the new workspace-diagnostics failure-path test

- 位置: `apps/vscode-extension/README.md`, `docs/maintainer-validation-playbook.md`, `docs/maintainer-validation-playbook.zh-CN.md`, `docs/support-matrix.md`, `docs/support-matrix.zh-CN.md`, `DA-611`, `DA-612`
- 问题描述: fresh reviewer 指出 `TK-611` 新增了 `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`，但当前 maintainer/support truth 与 delivery artifact 仍未把这条 failure-path coverage 纳入验证切片，导致公开证据面对最新 hardening coverage 的描述不完整。
- 影响: maintainer 在后续回放验证时可能漏跑最关键的 degrade-path test，也会让 project-final closeout 的 evidence chain 低估已经存在的自动化保障。
- 建议: 将 `vscode-extension-service-runtime.test.ts` 追加到 README、maintainer validation、support matrix 与相关 delivery artifact 的验证列表中，并重跑同窗口验证。

## 3. Notes

1. 当前 project-final scope 仍维持 `VS Code first / desktop foundation`，desktop launch rehearsal 继续只作为非阻断的 manual evidence。
2. 本轮 full `pnpm run check` 在更早的两次尝试中命中过 repo 既有的 timeout-equality flaky assertions（均发生在 project-054 scope 之外，且无代码改动后复跑即通过）；最终 green run 已在同一 change window 取得。

## 4. 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Support-truth verification slices omitted the new workspace-diagnostics failure-path test`
   - 判定：**认可**
   - 证据：`TK-611` 已新增 `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts` 覆盖 service-health enrichment 的成功/失败分支，但 project-final 对外 truth surface 仍未把这条测试纳入 README、maintainer validation、support matrix 与交付 artifact。
   - 处理：已将该测试补入上述 support-truth / delivery artifact，并以同窗口 full verification 重新确认 project-final closeout 证据链。

### 验证命令

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md .repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `pnpm run check:ide-docs-parity`（通过）
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
8. `pnpm run check`（通过）

## 5. 修复执行记录（2026-04-07）

1. `2.1 [P2] Support-truth verification slices omitted the new workspace-diagnostics failure-path test`：已完成
   - 变更文件：`apps/vscode-extension/README.md`、`docs/maintainer-validation-playbook.md`、`docs/maintainer-validation-playbook.zh-CN.md`、`docs/support-matrix.md`、`docs/support-matrix.zh-CN.md`、`DA-611`、`DA-612`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md .repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`、`pnpm run build`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check`
   - 说明：project-final 的对外 verification slice 已补齐 `vscode-extension-service-runtime.test.ts`，service-health degrade-path 现已在代码、README、maintainer validation、support matrix 与 delivery artifact 中保持一致。

## 6. 处置结果与剩余风险（2026-04-07）

1. `CR-002` 的 accepted finding 已全部处理完成，当前 project-final review surface 不再存在阻止 closeout 的 actionable finding。
2. `project-054` 现可进入 final closeout，并将主执行流切换到 `project-055 / sprint-001`。
3. desktop 仍保持 foundation surface；若后续要把它提升为正式 secondary surface，仍需单独补自动化 launch rehearsal 与新的支持声明边界。
