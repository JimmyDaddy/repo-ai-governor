# sprint-002 exit acceptance and sprint-003 handoff

- Status: active
- Date: 2026-04-18
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-002-doctor-check-and-workspace-bootstrap-cutover`
- Covers: `TK-970`

## 1. Exit acceptance summary

1. doctor / check / workspace bootstrap 的 service-native result contract 已经稳定落到 orchestration client type surface。
2. VS Code workbench 与 workflow studio 现在可以持续显示最近一次 workspace operation 的诊断、回执/回链、建议动作与 layered progress；sidecar restart 后也会从 workspace-owned read model 回填最近一次结果。
3. `/status` 已能回显最近一次 workspace operation 的摘要，不再只给出队列/数量型状态。
4. 同窗口 build 与 full `pnpm run check` 均已通过。

## 2. Evidence bundle

1. contract and implementation note:
   - `doctor-check-workspace-bootstrap-cutover-contract-and-implementation.md`
2. code surfaces:
   - `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
   - `packages/core-orchestration-service/src/local-orchestration-service-workspace-ops-runtime.ts`
   - `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
   - `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
   - `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
3. regression tests:
   - `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - `packages/core-orchestration-service/test/local-orchestration-service-workspace-ops-runtime.test.ts`

## 3. Sprint-003 handoff

1. adopt / host / verify / upgrade 的 UI 主路径应直接复用 `latestWorkspaceOperation` snapshot pattern，而不是重新回到 toast-only UX。
2. 如果 sprint-003 需要保留 temporary bridge metadata，也只能用于 compatibility / exit-criteria evidence，不再承担用户主执行反馈。
3. trust-sensitive UX、receipt/backlink projection、retry/reopen guidance 应继续沉到 service result + workbench surface，而不是 session shell 文案。
4. 后续若重用 `latestWorkspaceOperation` pattern，必须继续保留 locale guard，不能直接把另一种 UI 语言下采集的 summary / prompt / progress 文案原样混入当前 workbench。

## 4. Remaining steps before closeout

1. 为 sprint-002 启动 fresh reviewer round，并将 `CR-001` 按 `review_pending -> verified -> resolved` 收口。
2. reviewer clean 后再推进 `TK-984`，完成 sprint-002 closeout、sprint-003 activation 与 boundary commit。
