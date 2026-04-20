# Code Review: sprint-001-contract-and-provider-onboarding-facade

- Status: resolved
- Date: 2026-04-20
- Reviewer: AI-Agent delegated reviewer loop
- Task: `CR-001`
- Review Type: delegated sprint review
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/provider-onboarding-and-direct-api-key-entry-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
3. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
6. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
7. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/plan.md`
8. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/CR-001.md`
9. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1005-provider-onboarding-owner-split-and-contract-freeze.md`
10. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/DA-1006-service-owned-provider-onboarding-facade-and-selector-defaults.md`
11. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/checklist.md`
12. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/tasks.csv`

## 2. Findings

### 2.1 [P1] Selected secret backend silently falls back to another writable backend

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:1638`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1969`
- 问题描述: 当 `selectedBackendId` 已存在但当前不可写时，provider-onboarding backend 解析会继续回退到 `writableBackends[0]`。这让 mutation 在显式 / 当前 backend 已经失效的情况下，仍然可能把 API key 写进另一个 backend。
- 影响: secret 可能被错误写入非当前选择的 backend，甚至落到 `unsafe-local-file` 这类明文 fallback，直接违反 sprint-001 冻结的 fail-closed secret-backend boundary。
- 建议: 让 `selectedBackendId` 在本 mutation path 上保持 authoritative；若它不可写，则直接 fail-closed，并为 sidecar-backed 与 embedded-CLI 两条路径补回归测试。

### 2.2 [P2] Provider onboarding seam still guesses unsupported tool/provider combinations

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts:1559`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:1874`
- 问题描述: 当前 snapshot/apply seam 会接受任意 provider override，并用 heuristics 合成 `vendorBinding`。对于 `codex + anthropic`、`claude-code + openai` 这类组合，它会生成后续 schema 不接受的配置。
- 影响: sprint-002 若直接消费这条 seam，就可能把 invalid provider/binding 组合持久化到 user config，破坏 sprint-001 交付给后续迭代的 frozen contract。
- 建议: 在 snapshot/apply 之前验证 canonical tool/provider pairing，只允许 `codex -> openai/openai_responses` 与 `claude-code -> anthropic/anthropic_messages`，其余组合统一 fail-closed，并增加负向测试。

## 3. Notes

1. 当前 sprint 的 task-ledger / checklist / `CR-001` review lifecycle 已与 `review_pending` 状态对齐，没有额外 ledger drift。
2. 规范 contract 当前仍写着 `tools.<tool>.remoteApi.transport`，而实现与 sprint handoff 产物使用的是 `tools.<tool>.transport`；应在本窗口同步对齐，避免 sprint-002 按错误 contract 接 seam。

## 4. Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir '/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks' --task-id TK-1004`（通过）
2. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir '/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks' --task-id TK-1005`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir '/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks' --task-id TK-1006`（通过）
4. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
5. `pnpm run build`（通过）
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）

## 复核结论（2026-04-20）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts` 与 `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 现在都在 `selectedBackendId` 不可写时直接抛出 `PROCESS_RUNTIME_BACKEND_UNAVAILABLE`，不再回退到其他 writable backend；service/embedded 两条路径都新增了负向回归测试。
   - 处理：接受该 finding，并将 selected backend 解析改为 authoritative fail-closed。
2. `2.2`
   - 判定：**认可**
   - 证据：service 与 embedded snapshot/apply helper 现在都显式约束 canonical tool/provider pairing，只允许 `codex -> openai/openai_responses` 与 `claude-code -> anthropic/anthropic_messages`；unsupported pairing 直接 fail-closed，同时补充了负向测试。
   - 处理：接受该 finding，并移除 provider-onboarding seam 中的 host-side pairing heuristics。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-20）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：selected backend 现在与 requested backend 一样按 fail-closed 处理；一旦 selected backend 不可写，mutation 直接失败，不再静默漂移到其他 writable backend。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：provider-onboarding snapshot/apply seam 现在只接受 canonical `codex -> openai/openai_responses` 与 `claude-code -> anthropic/anthropic_messages` pairing，其余组合直接 fail-closed。

## 处置结果与剩余风险

1. 本轮 2 条 accepted finding 已全部修复并通过 same-window verification，`CR-001` 现在满足 `resolved` 条件。
2. review 过程中暴露的 `tools.<tool>.remoteApi.transport` contract drift 已在本窗口修正为 `tools.<tool>.transport`，与 sprint-001 DA 和 runtime truth 保持一致。
3. sprint-001 仍保持保守边界：`runConnect` 继续 analyze-first / `credentialEnvVar` compatible，public CTA 命名与 support wording 仍待后续 sprint 证据窗口推进。
