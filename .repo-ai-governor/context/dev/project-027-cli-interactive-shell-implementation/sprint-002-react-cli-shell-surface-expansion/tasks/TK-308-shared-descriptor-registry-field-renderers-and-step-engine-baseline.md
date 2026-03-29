# TK-308 共享 descriptor registry、字段渲染器与步骤引擎基线

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-002-react-cli-shell-surface-expansion`

## 1. 任务目标

抽出共享 `CommandDescriptor` 注册表、基础字段渲染器与步骤推进引擎，让 `init/connect/workspace/workflow preview` 共用同一套交互壳层基线。

## 2. Depends On

1. `TK-307`
2. `contract.cli.interactive-shell.v1`

## 3. 预期产物

1. 共享 `CommandDescriptor` registry
2. `text/password/select/multi-select/confirm` 字段渲染器
3. 通用步骤推进、返回与校验引擎
4. `ink@6.8.0` 与 `@inkjs/ui@2.0.0` 依赖接入基线

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-306-init-react-shell-minimal-wizard-and-descriptor-state-baseline.md`
6. `apps/cli/package.json`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-307-m1-regression-testing-fallback-and-non-interactive-contract-gate.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`
4. `npm package ink`
5. `npm package @inkjs/ui`

## 6. 实施计划

1. 在 `apps/cli/package.json` 中引入并锁定 `ink@6.8.0` 与 `@inkjs/ui@2.0.0`，作为共享交互壳层唯一 UI 底座。
2. 抽象共享 `CommandDescriptor` 注册机制，并优先用 `@inkjs/ui` 实现 `text/password/select/multi-select/confirm` 渲染器。
3. 基于 `Ink` 固化共享壳层 seam、布局与步骤推进 / 返回 / 校验引擎，供 `init/connect/workspace/workflow preview` 复用，并保持 `stdout` contract 不变。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 descriptor registry / field renderer / step engine 的定向 vitest，覆盖 `Ink` 渲染与 `@inkjs/ui` 字段组件的主路径。

## 8. Delivery Verification

1. `pnpm run check`
2. `init/connect/workspace/workflow preview` 不得分叉出独立 step/state 实现，且 `Ink + @inkjs/ui` 的接入不能破坏 M1 的 fallback、`stderr-only` 与 non-interactive contract。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M2/M3 清单，重新收敛为共享壳层基础设施任务。
3. 2026-03-28：联网核对 npm 最新可用版本，后续实现默认使用 `ink@6.8.0` 与 `@inkjs/ui@2.0.0`。
4. 2026-03-28：任务切换为 `in_progress`，开始接入 `Ink` 依赖并搭建 `apps/cli/src/react-cli/` 共享壳层骨架。
5. 2026-03-28：已在 `apps/cli/package.json` 引入 `ink@6.8.0`、`@inkjs/ui@2.0.0` 与 `react@19.2.4`，并在 `package.json` 根级补入 `@types/react@19.2.14`，同时新增 `apps/cli/src/react-cli/{app,bridge,session,state,views}` 骨架与 `tsconfig.json` 的 TSX 支持。
6. 2026-03-28：`CliInteractiveShellStderrRenderer` 已改为通过 `ReactCliRunner.renderFrame()` 输出共享壳层，`init` React shell 现已走 `Ink` + `@inkjs/ui` 布局层；补充 `react-cli-runner.test.ts` 覆盖共享 frame 与 unmount 输出。
7. 2026-03-29：`connect/workspace/init/workflow preview` 已全部复用该共享壳层基线，并随 `TK-309/TK-310/TK-311` 的定向验证与 M2 gate 一并通过，任务状态切换为 `completed`。

## 10. 产出

1. `apps/cli/package.json`
2. `package.json`
3. `tsconfig.json`
4. `apps/cli/src/react-cli/index.ts`
5. `apps/cli/src/react-cli/app/react-cli-app.tsx`
6. `apps/cli/src/react-cli/app/react-cli-runner.ts`
7. `apps/cli/src/react-cli/bridge/react-cli-command-descriptor-registry.ts`
8. `apps/cli/src/react-cli/bridge/react-cli-field-renderer-registry.tsx`
9. `apps/cli/src/react-cli/session/react-cli-session-controller.ts`
10. `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts`
11. `apps/cli/src/react-cli/views/layout-shell.tsx`
12. 已完成：统一步骤推进 / 返回 / 校验引擎已作为共享壳层基线被后续命令面复用；更深的 workflow 编辑交互留给 `sprint-003`。
