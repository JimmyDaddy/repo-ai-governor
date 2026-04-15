# Code Review: project-104 final working tree clean recheck 3

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-006`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
6. `apps/cli/test/commands/connect-command.test.ts`
7. `apps/cli/test/commands/doctor-command.test.ts`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `docs/support-matrix.md`
11. `docs/support-matrix.zh-CN.md`

## 2. Findings
1. 未发现需要修复的点。

## 3. Notes
1. active support rows now consistently use `doctor`-anchored readiness wording for current public guidance, while remaining `verify` mentions stay limited to historical evidence rows or still-supported commands such as `review-verify`.
2. local adoption playbook now points operators to `context/diagnostics/doctor/` for current readiness diagnostics, which keeps the playbook aligned with the live public onboarding surface.

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check`（通过）
5. `node ./dist/bin/repo-ai-governor.js connect --help >/dev/null`（通过）
6. `node ./dist/bin/repo-ai-governor.js doctor --adapters --output json >/dev/null`（通过）
7. `node ./dist/bin/repo-ai-governor.js verify --adapters --output json`（按预期失败，用于确认 removed public command 仍未被重新暴露）

## 处置结果与剩余风险（2026-04-15）

1. `CR-006` latest fresh reviewer round clean，未发现阻止 `project-104` 进入 final closeout 的 actionable finding。
2. 本轮 residual risk 低；后续若 support matrix 或 playbook 再次修改 active readiness wording，仍需保持 `doctor`-based public guidance 与历史 artifact naming 分离。
