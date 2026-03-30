# Code Review: project-028 working tree onboarding and agent projection

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `README.md`
  - `docs/local-adoption-playbook.md`

## 1. Review Scope
1. `apps/cli/**`
2. `packages/core-agent-projection/**`
3. `packages/core-runtime-langgraph/**`
4. `packages/reporting/**`
5. `packages/shared/src/i18n/locales/**`
6. `README.md`
7. `docs/local-adoption-playbook.md`

## 2. Findings
### 2.1 [P1] LangGraph supervisor cannot bind descriptors for custom role profile ids
- 位置: `packages/core-runtime-langgraph/src/agent-descriptor-supervisor.ts:29`
- 问题描述: descriptor 是按 `stageId:roleId:routeKey` 生成的，但 supervisor 的精确匹配却用 `stageId:roleProfileId:routeKey` 查找；一旦精确匹配失败，回退逻辑只会把 `roleProfileId` 去掉 `-default` 后再拼 key。这样默认 `planner-default` 之类还能误打误撞命中，但自定义 profile（例如带点号或不以 `-default` 结尾的 profile）会直接失配。当前仓库里同一运行时已经在 [`apps/cli/src/cli-governance-runtime.ts#L2209`](/Users/jimmydaddy/study/ai-governor/apps/cli/src/cli-governance-runtime.ts#L2209) 做了更宽松的 profile -> role fallback，这里没有复用同等规则。
- 影响: 只要目标仓库采用自定义 `roleProfileId`，`run --dry-run --trace`/真实运行在生成 LangGraph supervisor plan 时就会抛 `PROCESS_RUNTIME_NODE_NOT_FOUND`，让新的 agent projection 路径对非默认配置 fail closed。
- 建议: supervisor 应改为基于真实 `roleId` 或显式传入 `roleProfileId -> roleId` 映射做绑定；同时补一条 custom profile 场景单测，覆盖 `role.default.xxx` / 自定义 profile id。

### 2.2 [P2] `single-tool-minimal` preset in merge mode does not actually produce a minimal candidate
- 位置: `apps/cli/src/runtime/agent-onboarding-runtime.ts:163`
- 问题描述: `buildCandidateAdaptersConfig()` 先把 `single-tool-minimal` 收窄到 `planner/coder/reviewer`，但在默认 `overwrite=false` 下又调用 `mergeAdaptersConfig()` 把当前 config 里其余角色、路由和工具重新并回去了。文档同时把 `single-tool-minimal` 作为可选 preset 暴露给用户，而 `--overwrite` 只是“是否完全替换 adapters block”的附加行为，不应成为 preset 语义成立的前提。
- 影响: 用户按文档执行 `connect --preset single-tool-minimal` 时，candidate 里仍会保留 `architect/tester/verifier` 等非最小角色；后续 `doctor/verify` 仍会对这些角色做检查，常见结果是最小 onboarding 方案被额外失败项污染，和 preset 名称及文档预期不一致。
- 建议: 对 `single-tool-minimal` 单独实现“裁剪后再 merge”的规则，至少要剔除非最小角色及其路由；或者把该 preset 明确改成只有在 `--overwrite` 下才生效，并补上对应测试与文档约束。

## 3. Notes
1. 主要审查了本次新增的 onboarding、agent projection、LangGraph supervisor 和 reporting 接线；台账与 closeout 文档只做了路径一致性抽查。
2. `apps/cli/src/runtime/agent-onboarding-runtime.ts` 中新增的原生 `new Error(...)` 已在同一修复窗口中一并收敛为 `RuntimeError`，避免留下 `CS-022` 标准化错误模型漂移。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `rg -n "single-tool-minimal|multi-tool-default|restricted-network-safe|single-tool-all-roles|preset" README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md apps/cli/test/commands/connect-command.test.ts apps/cli/src/main.ts`（通过）
5. `rg -n "new Error\\(|extends Error|instanceof Error" apps/cli/src/runtime/agent-onboarding-runtime.ts packages/core-agent-projection packages/core-runtime-langgraph apps/cli/src/commands apps/cli/src/main.ts packages/reporting`（通过）

## 复核结论（2026-03-30）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-runtime-langgraph/src/agent-descriptor-supervisor.ts` 现在先按 `stageId + roleProfileId + routeKey` 做精确绑定，再回退到 `stageId + roleId + routeKey`；新增 custom profile 单测覆盖 `roles.product.planner` 这类非 `-default` profile。
   - 处理：已修复并补测试。
2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/agent-onboarding-runtime.ts` 现在对 `single-tool-minimal` 直接返回裁剪后的 candidate adapters config，不再在 `overwrite=false` 时把非最小角色 merge 回去；新增 runtime 单测覆盖 merge 模式下的最小 preset 语义。
   - 处理：已修复并补测试；同文件中新增的原生 `new Error(...)` 也已一起改为标准化错误。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/core-runtime-langgraph/test/agent-descriptor-supervisor.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts packages/core-agent-projection/test/agent-session-registry.unit.test.ts packages/reporting/test/report-builder.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-03-30）

1. `2.1`：已完成
   - 变更文件：`packages/core-runtime-langgraph/src/agent-descriptor-supervisor.ts`、`packages/core-runtime-langgraph/test/agent-descriptor-supervisor.unit.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts packages/core-runtime-langgraph/test/agent-descriptor-supervisor.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts packages/core-agent-projection/test/agent-session-registry.unit.test.ts packages/reporting/test/report-builder.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：supervisor 现在优先按真实 profile 绑定 descriptor，custom role profile 不再因为 `agentId`/`roleProfileId` 键不一致而 fail closed。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/agent-onboarding-runtime.ts`、`apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
   - 验证：`pnpm run build`（通过）
   - 说明：`single-tool-minimal` 在 merge 模式下也会保持最小 candidate 语义；同时已把同文件里的原生 `new Error(...)` 收敛为 `RuntimeError`。
