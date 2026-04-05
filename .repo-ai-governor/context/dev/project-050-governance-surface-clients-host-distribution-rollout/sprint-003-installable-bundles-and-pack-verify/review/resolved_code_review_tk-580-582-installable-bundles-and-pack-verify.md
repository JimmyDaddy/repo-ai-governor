# Code Review: sprint-003 installable bundles and pack verify

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `TK-580/TK-581/TK-582`
- Review Type: sprint owned scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/host-native-distribution-and-target-specific-consumption.md`

## 1. Review Scope
1. `packages/adapters/codex/src/**`
2. `packages/adapters/codex/test/**`
3. `packages/adapters/claude-code/src/**`
4. `packages/adapters/claude-code/test/**`
5. `packages/adapters/github-copilot/src/**`
6. `packages/adapters/github-copilot/test/**`
7. `packages/standards/src/**`
8. `apps/cli/src/runtime/host-distribution-runtime.ts`
9. `project-050 / sprint-003` ledger docs

## 2. Findings

未发现需要修复的点。

## 3. Notes
1. 本轮 closeout synthesis 重点确认 plugin/bundle 只作为 staged export 的安装型输出，不反向成为 canonical workflow truth。
2. `host-pack.report.json` 缺失会阻断 verify 的 fail-closed 修复已纳入当前窗口验证，避免 bundle drift 被静默跳过。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./dist/bin/repo-ai-governor.js host pack --host codex --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts-final/codex-plugin --bundle-dir .repo-ai-governor/generated/bundles-final/codex-plugin`（通过）
5. `node ./dist/bin/repo-ai-governor.js host verify --manifest .repo-ai-governor/generated/hosts-final/codex-plugin/host-export.manifest.json`（通过）
6. `node ./dist/bin/repo-ai-governor.js host pack --host claude-code --mode plugin-bundle --output-dir .repo-ai-governor/generated/hosts-final/claude-code-plugin --bundle-dir .repo-ai-governor/generated/bundles-final/claude-code-plugin`（通过）
7. `node ./dist/bin/repo-ai-governor.js host verify --manifest .repo-ai-governor/generated/hosts-final/claude-code-plugin/host-export.manifest.json`（通过）
8. `node ./dist/bin/repo-ai-governor.js host pack --host github-copilot --mode plugin-bundle --copilot-target cli-plugin --output-dir .repo-ai-governor/generated/hosts-final/github-copilot-cli-plugin --bundle-dir .repo-ai-governor/generated/bundles-final/github-copilot-cli-plugin`（通过）
9. `node ./dist/bin/repo-ai-governor.js host verify --manifest .repo-ai-governor/generated/hosts-final/github-copilot-cli-plugin/host-export.manifest.json`（通过）
