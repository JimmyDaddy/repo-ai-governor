# Code Review: TK-078 working tree follow-up

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-078`
- Review Type: working tree follow-up
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `examples/README.md`
2. `examples/example-smoke.contract.json`
3. `examples/**/README.md`
4. `examples/**/scenario.json`
5. `examples/**/expected/runtime-baseline.json`
6. `scripts/examples/check-examples-smoke.js`
7. `scripts/examples/check-examples-runtime.js`
8. `package.json`
9. `turbo.json`
10. `scripts/governance/check-code-standards.js`
11. `scripts/release/verify-local-distribution.js`
12. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
13. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-078-examples-assets-and-example-smoke-gate.md`
14. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-090-examples-assets-and-example-smoke-baseline.md`
15. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
16. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
17. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
18. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
19. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

1. [P2] `check:examples-smoke` / `gate:examples-smoke` 名称表现为总门禁，但实际只执行 doc smoke，完全不会覆盖 `check-examples-runtime.js`。`package.json` 中这两个聚合脚本都只代理到 `check:examples-doc-smoke`，而 contract 又把 `check:examples-smoke` 列为 required gate script；结果是任何直接调用该聚合名的外部消费方都会在 examples 运行链路回归时得到误报通过。`pnpm run check:examples-smoke` 现已复核，输出只包含 doc smoke。建议将聚合名改为串联 doc + runtime，或删除这个易误导的别名，仅保留显式分层脚本。
2. [P2] `expected/runtime-baseline.json` 当前没有参与真实运行断言，示例“运行基线”可以静默漂移。`check-examples-runtime.js` 只从 contract 读取 `id/path/runtimeScenarioPath` 并使用 `scenario.commands[].expect` 做断言，根本不消费 `expectedPath`；而 `check-examples-smoke.js` 对 `expectedCommandOperations` 也只检查“键存在”，不校验它与 `scenario.expect.operation` 或真实 CLI 输出一致。这意味着 `expected/runtime-baseline.json` 即使把 operation 映射写错，所有门禁仍会通过，和 `DA-090` 中“运行基线断言”的承诺不一致。建议让 runtime smoke 读取 expected baseline 并与 scenario/runtime output 做一致性校验，或下调该资产的契约描述避免虚假保障。

## 3. Notes

1. `pnpm run check:examples-runtime-smoke` 当前可通过，说明 examples 运行链路本身没有立即失效；本轮问题集中在门禁覆盖口径和资产契约真实性。
2. 本地分发校验已确认 tarball 至少包含 `examples/README.md` 和一个场景的 `scenario/expected` 资产；本轮未发现 examples 被打包遗漏的问题。

## 4. Verification

1. `pnpm run check:examples-smoke`（通过；确认仅执行 doc smoke）
2. `pnpm run check:examples-runtime-smoke`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核

1. [P2] `check:examples-smoke` / `gate:examples-smoke` 聚合语义不完整
   - 判定：**认可**
   - 证据：`package.json` 中 `check:examples-smoke` 与 `gate:examples-smoke` 仍仅代理 `check:examples-doc-smoke`，未串联 `check:examples-runtime-smoke`；复核命令 `pnpm run check:examples-smoke` 输出仅包含 doc smoke。
   - 处理：保留为待修复项，建议将聚合名改为 doc+runtime 串联，或移除该易误解别名并仅保留显式分层脚本。

2. [P2] `expected/runtime-baseline.json` 未参与运行期一致性断言
   - 判定：**认可**
   - 证据：`scripts/examples/check-examples-runtime.js` 未读取 `expectedPath`；`scripts/examples/check-examples-smoke.js` 对 `expectedCommandOperations` 仅做键存在检查，未与 scenario 的 `expect.operation` 或真实命令输出做一致性校验。
   - 处理：保留为待修复项，建议将 runtime smoke 纳入 expected baseline 的一致性断言链路，避免“基线文件存在但不生效”的虚假保障。

### 验证命令

1. `pnpm run check:examples-smoke`（通过）
2. `pnpm run check:examples-runtime-smoke`（通过）
3. `rg -n "check:examples-smoke|gate:examples-smoke|check:examples-doc-smoke|check:examples-runtime-smoke" package.json`（通过）
4. `rg -n "expectedPath|expectedCommandOperations|runtimeScenarioPath" scripts/examples/check-examples-runtime.js scripts/examples/check-examples-smoke.js`（通过）

## 修复执行记录（2026-03-22）

1. [P2] `check:examples-smoke` / `gate:examples-smoke` 聚合语义不完整：已完成
   - 变更文件：`package.json`
   - 验证：`pnpm run check:examples-smoke`（通过）
   - 说明：`check:examples-smoke` 已改为串联 `check:examples-doc-smoke && check:examples-runtime-smoke`；`gate:examples-smoke` 改为代理聚合脚本，避免外部调用漏掉 runtime smoke。

2. [P2] `expected/runtime-baseline.json` 未参与运行期一致性断言：已完成
   - 变更文件：`scripts/examples/check-examples-runtime.js`、`scripts/examples/check-examples-smoke.js`
   - 验证：`pnpm run check:examples-doc-smoke`、`pnpm run check:examples-runtime-smoke`、`pnpm run check`（通过）
   - 说明：runtime smoke 现已读取 `expectedPath`，并对 `baseline operation -> scenario expect.operation -> 实际 CLI 输出 operation` 执行一致性断言；doc smoke 也已补充 scenario/expected 操作映射一致性检查。
