# Code Review: TK-077 local installation modes and clean-room validation

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-077`
- Review Type: targeted implementation review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `scripts/release/verify-cleanroom-local-install.js`
2. `package.json`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-local-installation-modes-and-cleanroom-validation.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-089-local-installation-modes-and-cleanroom-validation.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
10. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

1. 未发现阻断交付的剩余问题。

## 3. Notes

1. clean-room 脚本默认将 Stage 9A 安装硬门槛收敛到 `path + link`，并固定每模式连续 3 次 `--help -> init -> doctor -> check`。
2. 脚本内置 `tool_managed -> repo_local -> rollback` 场景验证，以及只读 attach 预检（`doctor/init` 不写入目标仓库）。
3. `tgz` 在 clean-room 下当前触发 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`，已在 `DA-089` 中标记为 Stage 9B deferred 约束。

## 4. Verification

1. `pnpm run release:verify-cleanroom-local-install`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `pnpm run check`（通过）
