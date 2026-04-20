# DA-940 workflow studio desktop decision and support-truth evidence

- Status: completed
- Date: 2026-04-17
- Project: `project-112-vscode-governance-workbench-rollout`
- Sprint: `sprint-003-phase-c-workflow-studio-and-full-workbench-cutover`
- Task: `TK-940`

## 1. Summary

1. Phase C 已把 `workflow studio` 接入 VS Code primary governance workbench，并让它作为专门的 Phase C evidence surface 展示 workflow、queue、bridge 与 support-truth 证据。
2. 新 surface 继续只消费 service-owned `queue overview + selected execution + artifact pane` projection，不直接读取 `.repo-ai-governor/**` canonical workspace files，也不在 extension host 内重建 workflow truth。
3. `desktop relationship` 与 `support-truth gate` 现在已经作为显式 evidence surface 呈现出来，但 public support level 仍保持 `workbench_baseline_in_progress`；只有 project-final 证据窗口确认放行后，才允许改口为公开 `primary workbench`。

## 2. Implemented Surface

1. `apps/vscode-extension/package.json`、contract constants 与 localized manifest title 新增 `workflow studio` view/panel，并把它纳入 frozen VS Code workbench contract。
2. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts` 新增 `resolveWorkflowStudioSnapshot()`，把 queue overview、selected execution 与 artifact-pane evidence 组合为一个 service-backed Phase C snapshot。
3. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts` 与 `.../vscode-extension-host.ts` 把 workflow-studio webview 正式接入 extension activation wiring 与 selection-driven refresh flow。
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 新增 workflow-studio HTML presenter，以及 workbench overview 中的 `desktop relationship` / `workflow studio gate` 快速证据节点。
5. `apps/vscode-extension/test/**` 已补齐 contract/runtime/presenter/provider 回归覆盖，确认 workflow-studio surface、desktop decision text 与 support-truth evidence 都由受治理 snapshot 驱动。

## 3. Verification Evidence

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
2. `pnpm run build`

## 4. Outputs

1. `apps/vscode-extension/package.json`
2. `apps/vscode-extension/package.nls.json`
3. `apps/vscode-extension/package.nls.zh-cn.json`
4. `apps/vscode-extension/src/constants/vscode-extension.constant.ts`
5. `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
6. `apps/vscode-extension/src/runtime/vscode-extension-workflow-studio-provider.ts`
7. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
8. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
9. `apps/vscode-extension/test/vscode-extension-contract.test.ts`
10. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
11. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
12. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
