# TK-671 implement VSIX build release path and extension-host smoke follow-up

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint: `sprint-001-packaged-distribution-and-extension-host-smoke`

## 1. 任务目标

实现 VSIX build/release path 与 extension-host smoke follow-up，把 VS Code surface 从 source-checkout 叙事推进到 packaged secondary-surface baseline。

## 2. Depends On

1. `TK-670`
2. 当前 VS Code extension runtime

## 3. 预期产物

1. VSIX build/release path
2. extension-host smoke follow-up
3. docs refresh input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-670-freeze-vs-code-packaged-distribution-contract-and-smoke-gate.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/project-054-vscode-secondary-surface-rollout-completion-audit-summary.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`

## 6. 实施计划

1. 落地 VSIX/build/release path。
2. 增补 extension-host smoke follow-up。
3. 准备 docs/support narrative closeout 输入。

## 7. Development Verification

1. VSIX build rehearsal
2. extension-host smoke rehearsal

## 8. Delivery Verification

1. packaged surface smoke
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：已补齐 `release:pack-vscode-extension` / `release:verify-vscode-extension-distribution`、VS Code extension package metadata、`@repo-ai-governor/core-orchestration-service/sidecar-client` 子路径导出，以及 packaged root/VSIX 所需的 runtime asset copy 与 packaging boundary 测试面。
3. 2026-04-08：`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json` 已通过，生成了本地 VSIX、packaged extension root 与机器可读 report，正式把“本地生成 VSIX / packaged extension root”收敛为可复跑的支持边界。

## 10. 产出

1. `package.json`
2. `apps/vscode-extension/package.json`
3. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
4. `apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts`
5. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
6. `packages/core-orchestration-service/package.json`
7. `scripts/build/copy-runtime-assets.js`
8. `scripts/release/check-release-ready.js`
9. `scripts/release/release-governance-policy.json`
10. `scripts/release/pack-vscode-extension.js`
11. `scripts/release/verify-vscode-extension-distribution.js`
12. `test/release-vscode-extension-distribution-working-root.integration.test.ts`
13. `.tmp/project-064-vscode-extension-distribution-report.json`
