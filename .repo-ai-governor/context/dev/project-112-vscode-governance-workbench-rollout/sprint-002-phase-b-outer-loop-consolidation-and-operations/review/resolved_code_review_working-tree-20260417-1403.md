# Code Review: TK-938 round 11

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `TK-938`
- CR Task: `CR-011`
- Review Type: delegated fresh recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
3. `apps/desktop/src/runtime/desktop-orchestration-service-runtime.ts`
4. `apps/desktop/src/types/interfaces/desktop-orchestration-runtime.interface.ts`
5. `apps/desktop/test/desktop-shell-bootstrap.test.ts`

## 2. Findings

### 2.1 [P1] Custom repo-local temporary bridges were still rewritten under a fake nested governance root

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
- 问题描述:
  temporary bridge projection 仍会在 basename 不匹配时给 `workspaceRoot` 追加 `.repo-ai-governor`，从而把已发现的 custom `repo_local` governance workspace 重写成不存在的 nested root。
- 影响:
  host output dir、artifact backlink 与 upgrade report lookup 都可能偏到错误路径，导致 workbench bridge 提示与真实 canonical artifact 脱节。
- 建议:
  把 `workspaceRoot` 直接视为 authoritative governance workspace root，并补一条 custom repo-local regression test。

### 2.2 [P2] Missing `repositoryRoot` still produced fabricated bridge cwd and `--repo` values

- 位置:
  - `packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`
  - `apps/desktop/src/runtime/desktop-orchestration-service-runtime.ts`
  - `apps/desktop/test/desktop-shell-bootstrap.test.ts`
- 问题描述:
  bridge catalog 在 `repositoryRoot` 缺失时仍尝试用 `dirname(workspaceRoot)` 或 `workspaceRoot` 兜底，desktop runtime 也还没有把显式 `repositoryRoot` 事实透传给 sidecar / provider path。
- 影响:
  这会让 shared `temporaryBridges` DTO 暴露错误的 repo cwd，尤其在 tool-managed workspace 与 custom repo-local root 下会产生不可执行的桥接命令。
- 建议:
  对缺失 `repositoryRoot` 的 bridge projection fail closed，并把 desktop runtime 的 owner context / sidecar path 升级为显式透传 `repositoryRoot`。

## 3. Notes

1. 本轮修复保留了 Phase B 的 typed CLI bridge baseline，但把 root/cwd 语义收紧为“只消费显式 runtime truth，不再本地猜测”。

## 4. Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts packages/config/test/workspace-config-discovery-service.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：temporary bridge catalog 现已把传入的 `workspaceRoot` 直接作为 authoritative governance workspace root，并新增 custom repo-local regression test 覆盖 bridge output/backlink path。
   - 处理：按 accepted finding 修复。
2. `2.2`
   - 判定：**认可**
   - 证据：bridge catalog 在缺少 `repositoryRoot` 时直接返回空 bridge 集合；desktop runtime 同时把 `repositoryRoot` 透传给 service-owner provider 与 sidecar client，并新增 desktop bootstrap contract test。
   - 处理：按 accepted finding 修复。

### 验证命令

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts packages/config/test/workspace-config-discovery-service.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/orchestration-service-runtime.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：full vitest bundle、`pnpm run build`（通过）
   - 说明：custom repo-local governance root 现直接作为 bridge workspace truth，不再被改写到伪造的 nested `.repo-ai-governor` 路径。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-temporary-bridge-catalog.ts`、`apps/desktop/src/runtime/desktop-orchestration-service-runtime.ts`、`apps/desktop/src/types/interfaces/desktop-orchestration-runtime.interface.ts`、`apps/desktop/src/types/interfaces/index.ts`、`apps/desktop/src/types/index.ts`、`apps/desktop/src/index.ts`、`apps/desktop/test/desktop-shell-bootstrap.test.ts`
   - 验证：full vitest bundle、`pnpm run build`（通过）
   - 说明：temporary bridges 只在显式 `repositoryRoot` 存在时投影；desktop runtime 则把同一事实透传给 provider / sidecar path，避免 desktop surface 继续消费错误 cwd。

## 处置结果与剩余风险

1. 本轮 accepted findings 已修复并复核完成；`TK-938` 仍需进入下一轮 fresh clean recheck，只有最新 reviewer round 返回无 actionable finding 时才能进入 sprint closeout。
