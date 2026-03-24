# DA-120 sprint-002 出口验收与 sprint-003 输入约束

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-120`
- Produced By: `TK-122`
- Scope: `project-011-cli-package-decomposition`

## 1. 目的

固化 `project-011 / sprint-002` 在 artifact/presentation 抽离、command executor cutover 与 thin facade 收敛方面的出口验收证据，并提前冻结 sprint-003 的 package hardening、shared/package-local 边界和 rollout alignment 输入约束。

## 2. 当前已成立的证据

1. `DA-117` 已可检索
   - `artifact/report/presentation` 已从 `CliGovernanceRuntime` 中抽离为 package-local runtime/presentation 模块。
2. `DA-118` 已可检索
   - `init/connect/doctor/check/verify/plan/upgrade` 已迁入 `commands/*`，并建立了稳定的 entry registry 与 shared command context。
3. `DA-119` 已可检索
   - `review/review-verify` 已迁入 `commands/*`，`run` 也已纳入 command registry dispatch，`CliGovernanceRuntime` 不再保留 `RUN` 特殊旁路分支。

## 3. sprint-003 最终输入约束

1. `shared/package-local` 边界收敛必须建立在 sprint-002 的 command/runtime/presentation/artifact 边界之上，不得反向把 CLI 专属语义上提到 shared。
2. `exports/tests/smoke` 加固要优先覆盖新形成的 `commands/*`、runtime support、presentation/artifact 边界，而不是继续围绕 legacy facade 堆测试。
3. `project-010` 后续消费 `project-011` 结果时，应优先引用 `DA-117`、`DA-118`、`DA-119`、`DA-120`，不得直接绕过这些产物继续向 legacy facade 堆主链逻辑。

## 4. 最终结论

1. 当前状态：`accepted`
2. 结论：sprint-002 的 artifact/presentation、command executor 与 thin facade 收口目标已满足，`DA-117`~`DA-120` 构成 sprint-003 的正式输入约束链。
3. 验证证据：
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-artifact-registry-lifecycle.js`
   - `pnpm run check`
