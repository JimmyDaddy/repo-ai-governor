# Code Review: sprint-003 phase-f secure authoring baseline

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated fresh reviewer round
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. Review Scope

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/constants/**`
5. `apps/vscode-extension/src/runtime/**`
6. `apps/vscode-extension/src/types/**`
7. `apps/vscode-extension/test/**`

## 2. Findings

### 2.1 [P1] Unsafe fallback backend warnings were dropped before secret mutation decisions

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
- 问题描述: `secret status` producer 会把 `unsafe-local-file` 维持为 `available=true`，并把明文 fallback warning 放在独立 warning / experience 元数据里；最初的 VS Code consumer 只解析 `checks.status/detail`，导致 warning-bearing backend 在 workbench 中看起来像普通的“Ready/Available”。
- 影响: 用户可能在没有显式高噪声确认的前提下，把 managed secret 落到 `unsafe-local-file` 这样的明文本地 fallback backend，违背了 contract 中“只能显式 opt-in 且必须保留 warning”的安全边界。
- 建议: 把 warning-bearing backend metadata 带入 secure-authoring snapshot，并在 secret write 前对 warning-bearing backend 强制显式确认。

### 2.2 [P2] Degraded secure-authoring snapshots were cached past transient failures

- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
- 问题描述: 最初实现会把第一次失败后的 `{ degradedReason }` 结果作为成功 promise 缓存下来，后续普通 refresh/read 会持续复用这个 degraded snapshot，而不是重试。
- 影响: 一次短暂的 embedded CLI / backend 抖动就可能把 Phase F 的 workbench surface 固定在 degraded 状态，直到用户 reload extension host 或执行 mutation 才能恢复。
- 建议: degraded snapshot 不应长期缓存；至少要在下次读取时自动重试。

## 3. Notes

1. secure-authoring metadata 仍会在 untrusted workspace 中以只读诊断形式显示；本轮将其视为风险备注而非 actionable finding，因为当前 Phase F contract 只冻结了 command mutation trust gate，没有把只读诊断定义为同级阻断项。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核

1. `F1`
   - 判定：**认可**
   - 证据：`local-user-config-and-secret-command-contract.md` 明确要求 unsafe fallback 只能显式 opt-in 且必须保留 warning；当前修复已把 warning-bearing backend metadata 投影到 `VsCodeExtensionSecureAuthoringSnapshot`，并在 write 前新增显式确认。
   - 处理：已接受并修复。
2. `F2`
   - 判定：**认可**
   - 证据：当前修复已把 degraded snapshot 改为“允许当前请求返回 degradedReason，但不把 degraded 结果长驻缓存”，随后读取会自动重试。
   - 处理：已接受并修复。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）

## 修复执行记录（2026-04-17）

1. `F1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
   - 说明：warning-bearing backend 现在会显式呈现在 workbench surface 上，并在 secret write 前触发 modal confirm。
2. `F2`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
   - 说明：degraded secure-authoring snapshot 不再被永久缓存；一次 transient failure 后，下一次读取会自动重试并恢复正常 diagnostics。

## 处置结果与剩余风险

1. 本轮 delegated reviewer 提出的 2 个 actionable finding 已全部修复并通过同窗口 build + targeted vitest 复验。
2. 当前未发现阻止 sprint-003 进入 closeout 的新增 actionable finding；剩余只读 trust-boundary 风险已作为备注保留，后续若 Phase G 对 secure-authoring read surface 继续扩展，再单独评估是否需要提升为正式 contract。
