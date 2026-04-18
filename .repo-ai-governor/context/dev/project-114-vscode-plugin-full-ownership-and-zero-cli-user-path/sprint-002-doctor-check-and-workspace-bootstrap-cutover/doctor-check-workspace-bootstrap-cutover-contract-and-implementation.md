# sprint-002 doctor-check and workspace bootstrap cutover contract and implementation

- Status: active
- Date: 2026-04-18
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-002-doctor-check-and-workspace-bootstrap-cutover`
- Covers: `TK-967`, `TK-968`, `TK-969`

## 1. Contract freeze

1. VS Code 的 doctor / check / workspace bootstrap 保持为 plugin-primary 人类路径，用户不再需要先手动打开 CLI。
2. 插件消费的用户可见结果必须来自 `local_orchestration_service` query/command seam，而不是扩展本地重新拼装 shadow state。
3. `doctor/check/init` 的结构化输出 contract 固定为：
   - `summary`
   - `checkTotals`
   - `checks`
   - `artifacts`
   - `interactionPrompts`
   - `layeredLogs`
   - `details`
4. workbench / workflow studio 不再只弹一次 toast；它们必须持续显示最近一次 service-backed workspace operation 的诊断、建议、回执/回链与进度。

## 2. Service seam delivery

1. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - 为 workspace operation 新增 `layeredLogs`。
   - 为 queue overview 新增 `latestWorkspaceOperation` snapshot。
2. `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
   - 解析 CLI `experience.layeredLogs`。
   - 持久化最近一次 service-owned workspace operation snapshot，并在 sidecar/window restart 后回填。
3. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
   - 将 `latestWorkspaceOperation` 投影到 queue overview query。
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - 将 workspace ops runtime 的最新结果接入 queue overview query runtime。

## 3. Workbench surface delivery

1. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - workbench overview 新增 `Latest workspace operation` 节点。
   - workflow studio 新增同名 evidence section。
   - `/status` chat markdown 现在会带出最近一次 workspace operation 及其检查摘要。
2. 插件展示的最近一次结果至少覆盖：
   - operation kind
   - runtime operation id
   - summary
   - completedAt
   - warn/fail checks
   - receipt/backlink artifacts
   - suggested follow-up prompts
   - layered progress logs
3. 若 snapshot 是在另一种 locale 下采集的，workbench 会保留 locale-neutral facts，并要求用户在当前 VS Code 语言下重跑该操作来刷新本地化摘要、建议动作与进度文案。

## 4. Verification evidence

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-host.activation.test.ts packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.timeout.test.ts`
3. `pnpm run build`
4. `pnpm run check`

## 5. Exit notes

1. sprint-002 现在已经把 doctor/check/bootstrap 的“最近一次结果”固定成 service query 可见且可在 sidecar restart 后回填的 workbench truth。
2. sprint-003 可以复用同一 snapshot pattern，把 adopt / host / verify / upgrade 的结果继续投影到 VS Code，不必重新引入 CLI-first bridge UI。
