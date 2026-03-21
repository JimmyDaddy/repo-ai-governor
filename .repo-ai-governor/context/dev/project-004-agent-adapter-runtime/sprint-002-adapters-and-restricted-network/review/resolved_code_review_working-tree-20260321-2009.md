# Code Review: Restricted Network Fallback 与 IDE Wrapper 基线变更

- Status: review_pending
- Date: 2026-03-21
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/plan.md`
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/plan.md`
4. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-036-first-batch-adapters-baseline.md`
5. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-037-restricted-network-mode-baseline.md`
6. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-038-ide-integration-skeleton-baseline.md`
7. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/tasks.csv`
9. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
10. `.repo-ai-governor/normative_knowledge_sources/archive/normative-context-loading-optimization-plan.md`
11. `apps/cli/src/constants/cli-command.constant.ts`
12. `apps/cli/src/constants/ide-command-wrapper.constant.ts`
13. `apps/cli/src/ide-command-wrapper.ts`
14. `apps/cli/src/main.ts`
15. `apps/cli/src/types/aliases/ide-command-wrapper.type.ts`
16. `apps/cli/src/types/interfaces/ide-command-wrapper.interface.ts`
17. `apps/cli/src/types/index.ts`
18. `apps/cli/test/ide-command-wrapper.unit.test.ts`
19. `integrations/ide/README.md`
20. `integrations/ide/contracts/command-wrapper.contract.json`
21. `integrations/ide/contracts/standards-injection.contract.json`
22. `integrations/ide/examples/vscode-task.sample.json`
23. `packages/adapter-sdk/src/agent-route-runner.ts`
24. `packages/adapter-sdk/src/constants/agent-protocol.constant.ts`
25. `packages/adapter-sdk/src/constants/index.ts`
26. `packages/adapter-sdk/src/index.ts`
27. `packages/adapter-sdk/src/restricted-network-fallback-handler.ts`
28. `packages/adapter-sdk/src/types/interfaces/agent-route.interface.ts`
29. `packages/adapter-sdk/src/types/interfaces/index.ts`
30. `packages/adapter-sdk/src/types/index.ts`
31. `packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
32. `packages/shared/src/errors/error-code.constant.ts`
33. `test/first-batch-adapters-route.integration.test.ts`

## 2. Findings
### 2.1 [P1] restricted mode 会把非网络原因的失败也误降级到本地 fallback
- 位置: `packages/adapter-sdk/src/agent-route-runner.ts:241`
- 问题描述: 当前实现只要 `networkMode === restricted` 且主循环没有选出 surface，就会直接进入 `dispatchByRestrictedFallback(...)`。但这段逻辑没有判断候选 surface 是否真的是因为 `NETWORK_RESTRICTED` 被挡住；如果 local-only surface probe 失败、surface 不可用，或者受限模式下存在其他非网络错误，也会被当成“网络受限”处理并返回本地 fallback 结果。
- 影响: restricted mode 会掩盖真实的 adapter/probe/availability 问题，让流程继续走一条“看起来成功”的本地降级路径，导致审计记录和实际失败原因不一致。
- 建议: 只有当所有候选 surface 都因 `AgentSurfaceSkipReason.NETWORK_RESTRICTED` 被跳过时才激活本地 fallback；否则应保留原始错误或 `no available surface` 结果。

### 2.2 [P2] IDE wrapper 生成的默认 argv 按字面执行会直接失败
- 位置: `apps/cli/src/ide-command-wrapper.ts:69`
- 问题描述: wrapper 默认输出 `["node", "repo-ai-governor", ...]`。Node 的第二个参数必须是脚本路径，而不是 PATH 里的 bin 名称；实测在仓库根目录执行 `node repo-ai-governor --help` 会直接报 `MODULE_NOT_FOUND`。这和示例文件里使用的 `node ./dist/bin/repo-ai-governor.js` 也不一致。
- 影响: 任何按 envelope 的 `argv` 原样执行的 IDE/Agent 集成都会在命令入口前就失败，当前默认包装结果不可运行。
- 建议: 要么输出真实脚本路径（例如 `./dist/bin/repo-ai-governor.js`），要么把 envelope 语义改成“直接执行二进制”而不是“用 node 执行二进制名”。

### 2.3 [P2] `additionalEnv` 可以覆盖 wrapper 保留的规范注入变量
- 位置: `apps/cli/src/ide-command-wrapper.ts:78`
- 问题描述: `env` 组装时先写入 `REPO_AI_GOVERNOR_OUTPUT_MODE`、`ENTRY_SURFACE`、`STANDARDS_PROFILE_ID`、`STANDARDS_SOURCES`，随后再展开 `request.additionalEnv`。这意味着调用方可以把这些本应由 wrapper 固定注入的保留键覆盖掉，且 `metadata` 仍会保留旧值，形成 env/metadata 不一致。
- 影响: IDE 或 agent 集成可以绕过 baseline 规范注入与输出模式约束，造成入口治理语义漂移，同时给排障留下“metadata 看起来正确、env 实际已被改写”的隐蔽问题。
- 建议: 先合并 `additionalEnv` 再回填保留键，或者显式拒绝与保留环境变量重名的自定义注入。

## 3. Notes
1. 任务台账、artifact registry 和 normative loading manifest 的同步状态在本次定向 gate 中均通过，暂未发现账实漂移问题。
2. `packages/adapter-sdk` 与 `apps/cli` 的新增测试覆盖了 happy path，但没有覆盖“restricted mode 下 local-only surface 失败”以及“`additionalEnv` 覆盖保留键”的回归场景。

## 4. Verification
1. `node repo-ai-governor --help`（失败：`MODULE_NOT_FOUND`，用于验证 IDE wrapper 默认 argv 不可执行）
2. `pnpm run typecheck`（通过）
3. `pnpm run test:packages -- apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
7. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）

## 复核结论（2026-03-21）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] restricted mode 会把非网络原因的失败也误降级到本地 fallback`
   - 判定：**认可**
   - 证据：`packages/adapter-sdk/src/agent-route-runner.ts` 原实现在 `networkMode=restricted` 且未命中可用 surface 时无条件进入 `dispatchByRestrictedFallback(...)`，未校验是否全部为 `NETWORK_RESTRICTED`。
   - 处理：仅当所有候选 surface 的 `skippedReason === NETWORK_RESTRICTED` 时才允许触发本地 fallback；其余 restricted 模式失败路径保留 `no available surface` 语义。
2. `2.2 [P2] IDE wrapper 生成的默认 argv 按字面执行会直接失败`
   - 判定：**认可**
   - 证据：`apps/cli/src/ide-command-wrapper.ts` 原默认 argv 为 `["node", "repo-ai-governor", ...]`，与 Node 脚本执行模型不一致，也与 `integrations/ide/examples` 样例不一致。
   - 处理：默认 argv 改为 `["node", "./dist/bin/repo-ai-governor.js", ...]`，并同步 wrapper 单测与契约文档。
3. `2.3 [P2] additionalEnv 可以覆盖 wrapper 保留的规范注入变量`
   - 判定：**认可**
   - 证据：`apps/cli/src/ide-command-wrapper.ts` 原 `env` 组装顺序先写保留键、后展开 `additionalEnv`，调用方可覆盖保留键并造成 `env/metadata` 漂移。
   - 处理：新增 `normalizeAdditionalEnv`，显式拒绝覆盖保留键的注入请求，并保留原有可扩展自定义 env 能力。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run test:packages -- apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-03-21）

1. `2.1 [P1] restricted mode 会把非网络原因的失败也误降级到本地 fallback`：已完成
   - 变更文件：`packages/adapter-sdk/src/agent-route-runner.ts`、`packages/adapter-sdk/test/agent-route-runner.smoke.test.ts`
   - 验证：`pnpm run test:packages -- packages/adapter-sdk/test/agent-route-runner.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 `isRestrictedNetworkFallbackEligible(...)` 守卫；补充“restricted 模式但非网络失败不触发本地 fallback”的回归用例。
2. `2.2 [P2] IDE wrapper 生成的默认 argv 按字面执行会直接失败`：已完成
   - 变更文件：`apps/cli/src/ide-command-wrapper.ts`、`apps/cli/test/ide-command-wrapper.unit.test.ts`、`integrations/ide/contracts/command-wrapper.contract.json`、`integrations/ide/README.md`
   - 验证：`pnpm run test:packages -- apps/cli/test/ide-command-wrapper.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：默认 argv 改为 `node ./dist/bin/repo-ai-governor.js`，并同步 wrapper 单测与契约文档。
3. `2.3 [P2] additionalEnv 可以覆盖 wrapper 保留的规范注入变量`：已完成
   - 变更文件：`apps/cli/src/ide-command-wrapper.ts`、`apps/cli/test/ide-command-wrapper.unit.test.ts`、`integrations/ide/contracts/command-wrapper.contract.json`、`integrations/ide/README.md`
   - 验证：`pnpm run test:packages -- apps/cli/test/ide-command-wrapper.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 `normalizeAdditionalEnv(...)`，对保留键覆盖行为直接阻断并输出标准化错误码。
