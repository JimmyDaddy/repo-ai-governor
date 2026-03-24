# Code Review: TK-097 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-097`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `packages/shared/src/i18n/locales/en-US.ts`
7. `packages/shared/src/i18n/locales/zh-cn.ts`
8. `scripts/ci/run-resilience-regression.js`
9. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-097-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`
10. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-101-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`

## 2. Findings

### 2.1 [P1] restricted-network local fallback 绕过了 probe 与 capability gate

- 位置: `apps/cli/src/cli-governance-runtime.ts:949`, `apps/cli/src/cli-governance-runtime.ts:2505`
- 问题描述: `restrictedNetwork=true` 时，`run` 会显式关闭 `ollama` 作为 route candidate 的正常注入，只保留 `restrictedNetworkFallbackHandler`。但 `AgentRouteRunner` 的 restricted fallback 路径只会直接 `invokeFallback()`，不会对本地模型再次做 `probe()` 或 capability requirement 校验。因此 restricted-network rehearsal 会把本地模型当作兜底执行面直接放行，哪怕它并不满足该 stage 的必需能力。
- 影响: `TK-097` 想验证的是“外部 surface 被阻断后由本地 fallback handler 接管的真实链路”，但现在这条链路跳过了正常资格判断，restricted mode 的 `run` 语义会比 standard mode 更宽松，可能把本应 fail 的 planner/coder/reviewer/verifier stage 误报为成功。
- 建议: restricted fallback 进入真实调用前，先对本地 fallback surface 复用一次与常规 route 一致的 probe/capability evaluation，或保留本地 candidate 注入并显式标记 `selected_by=local_fallback`，避免两条执行链的资格规则分叉。

### 2.2 [P2] `doctor --fix` 在非 `--adapters` 路径下不会生成 `doctor_diagnostics`

- 位置: `apps/cli/src/cli-governance-runtime.ts:667`, `apps/cli/src/cli-governance-runtime.ts:717`
- 问题描述: `doctorDiagnosticsArtifactPath` 只在 `runtimeDebugOptions.adapters` 为真时才创建，后续 artifact 写入也同时要求 `adapterVerificationSnapshot` 非空。这样 `doctor --fix` 虽然会追加 `safe_local_fix` check 和最终 next action，但如果用户没有显式打开 `--adapters`，这些终端上可见的诊断事实根本不会落到 `doctor_diagnostics` 产物里。
- 影响: 这与 `DA-101` 第 17 行和第 55 行“`doctor --fix` 的 safe_local 说明必须与最终 checks/nextActions 一起写入 `doctor_diagnostics` artifact”的约束直接冲突，会重新引入终端输出和 artifact 漂移，也让后续自动化消费不到 fix 边界信息。
- 建议: 将 `doctor_diagnostics` 产物从 adapters 专属路径提升为 `doctor` 命令的统一输出；即使未启用 adapter probe，也应至少写入 workspace checks、`safeLocalBoundary`、最终 checks 和 nextActions。

## 3. Notes

1. `apps/cli/test/cli-governance-runtime.integration.test.ts` 已新增 endpoint-backed probe 与部分负向能力测试，但没有覆盖 “restricted-network fallback 仍需 capability 校验” 以及 “doctor --fix without --adapters 仍应落 artifact” 这两个场景。
2. 本轮只做 working tree 静态审查，没有重跑仓库测试。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `git diff -- apps/cli/src/cli-governance-runtime.ts`（通过）
5. `git diff -- apps/cli/src/main.ts apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts apps/cli/src/constants/cli-governance-runtime.constant.ts`（通过）
6. `git diff -- apps/cli/test/cli-governance-runtime.integration.test.ts scripts/ci/run-resilience-regression.js packages/shared/src/i18n/locales/en-US.ts packages/shared/src/i18n/locales/zh-cn.ts`（通过）
7. `rg` / `nl -ba` 追踪 restricted-network fallback、doctor diagnostics 与测试覆盖（通过）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] restricted-network local fallback 绕过了 probe 与 capability gate`
   - 判定：**认可**
   - 证据：当前实现已将 restricted fallback 升级为“先 `probe()`、再执行 capability evaluation、最后才 `invokeStage()`”；同时补入了“默认 required capability 下应 fail”和“capability-compatible 下才允许成功 takeover”两条 CLI 集成测试。
   - 处理：已修复，restricted-network 不再比 standard mode 更宽松。
2. `2.2 [P2] doctor --fix 在非 --adapters 路径下不会生成 doctor_diagnostics`
   - 判定：**认可**
   - 证据：`doctor_diagnostics` 已提升为 `doctor` 命令统一产物；未开启 adapters 时也会落盘最终 `checks`、`nextActions` 与 `safeLocalBoundary`，并新增了对应的无 adapters 集成测试。
   - 处理：已修复，artifact 与终端结果重新保持同源。

### 验证命令
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:resilience`（通过）
4. `pnpm run check`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P1] restricted-network local fallback 绕过了 probe 与 capability gate`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm -s tsc -p tsconfig.json --noEmit && pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：restricted fallback 现在会对本地模型 surface 复用 probe/capability gate；默认 capability 不满足时 fail，兼容场景才允许真实接管。
2. `2.2 [P2] doctor --fix 在非 --adapters 路径下不会生成 doctor_diagnostics`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`、`.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/DA-101-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`
   - 验证：`pnpm run test:resilience && pnpm run check`（通过）
   - 说明：`doctor_diagnostics` 已提升为统一产物，不再依赖 `--adapters` 开关。
