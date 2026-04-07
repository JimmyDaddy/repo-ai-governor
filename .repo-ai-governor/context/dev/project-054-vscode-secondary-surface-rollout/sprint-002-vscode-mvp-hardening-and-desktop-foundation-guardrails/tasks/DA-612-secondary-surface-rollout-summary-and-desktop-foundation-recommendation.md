# DA-612 secondary surface rollout summary and desktop foundation recommendation

- Status: completed
- Date: 2026-04-07
- Project: `project-054-vscode-secondary-surface-rollout`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Task: `TK-612`

## 1. Secondary Surface Rollout Summary

1. `project-054` 已把 `VS Code extension` 固定为当前更值得收口的 secondary surface，并在 `sprint-001` 完成正式支持边界、packaging narrative、installer truth 与 docs parity 的冻结。
2. `sprint-002` 已进一步补齐定向 MVP hardening，把 `Workspace Context`、`Review Detail` 与 `@governor` chat 的 trust-sensitive diagnostics 和 local orchestration service health/topology facts 串到统一的 service-owned truth seam。
3. 当前 public truth 已明确保持 source-checkout-only 的 extension-development-host 路径；`VSIX`、Marketplace、npm/tgz-installed extension bundle 仍不进入正式支持口径。

## 2. Desktop Foundation Recommendation

1. `apps/desktop` 继续保持 foundation-only surface：保留 sidecar / preload / session / governance-console seam，但不在 `project-054` 内被提升为 preferred secondary surface。
2. 后续若要重启 desktop productization，应先以独立 project 明确其 adopter path、packaging truth、distribution contract 与 non-goal 迁移边界，而不是在当前 VS Code closeout 窗口里顺手扩张。
3. 在此之前，desktop 文档应持续坚持 “foundation only / not a packaged product claim / no shadow orchestration state” 的 guardrail 口径。

## 3. Project-final-ready Truth Surface

1. `project-054` 当前已具备进入 sprint-scoped fresh reviewer CR loop 的实现与文档基线；下一边界应先收口 `sprint-002`，然后再执行 project-final scoped CR loop。
2. 最新实现窗口已经具备以下关键证据：
   - `apps/vscode-extension/README.md`
   - `docs/support-matrix.md`
   - `docs/support-matrix.zh-CN.md`
   - `docs/local-adoption-playbook.md`
   - `docs/local-adoption-playbook.zh-CN.md`
   - `docs/maintainer-validation-playbook.md`
   - `docs/maintainer-validation-playbook.zh-CN.md`
   - `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
   - `apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts`
   - `apps/vscode-extension/src/runtime/vscode-extension-host.ts`
   - `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
3. `project-054` completion audit summary 需等 project-final CR clean 后再提升为最终 completed truth；当前 artifact 只负责把 review-ready surface 与 desktop recommendation 固定下来。

## 4. Verification Baseline For Handoff

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md`
3. `pnpm run build`
4. `pnpm run check:ide-entry-smoke`
5. `pnpm run check:ide-docs-parity`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 5. Next Boundary

1. `project-054 / sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails` fresh reviewer scoped CR loop
2. clean sprint closeout task creation and sprint-level local commit
3. `project-054` project-final fresh reviewer CR loop, then final closeout and activation of `project-055`
