# Code Review: TK-036 首批 Adapters 基线与 sprint 状态门禁调整

- Status: resolved
- Date: 2026-03-21
- Reviewer: AI-Agent
- Task: `TK-036`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/plan.md`
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/plan.md`
4. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-036-first-batch-adapters-baseline.md`
5. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/checklist.md`
6. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/tasks.csv`
7. `scripts/governance/check-sprint-plan-status-sync.js`
8. `tsconfig.json`
9. `vitest.internal-alias.ts`
10. `packages/adapters/codex/package.json`
11. `packages/adapters/codex/src/index.ts`
12. `packages/adapters/codex/src/codex-agent-adapter.ts`
13. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
14. `packages/adapters/codex/README.md`
15. `packages/adapters/github-copilot/package.json`
16. `packages/adapters/github-copilot/src/index.ts`
17. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
18. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
19. `packages/adapters/github-copilot/README.md`
20. `packages/adapters/claude-code/package.json`
21. `packages/adapters/claude-code/src/index.ts`
22. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
23. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
24. `packages/adapters/claude-code/README.md`
25. `test/first-batch-adapters-route.integration.test.ts`

## 2. Findings
### 2.1 [P1] 新增 workspace package 未同步更新 `pnpm-lock.yaml`
- 位置: `packages/adapters/claude-code/package.json:12`, `packages/adapters/codex/package.json:12`, `packages/adapters/github-copilot/package.json:12`
- 问题描述: 本次新增了 3 个 workspace package，并都声明了 `@repo-ai-governor/adapter-sdk` 的 `workspace:*` 依赖，但仓库未同步提交 `pnpm-lock.yaml` 的 importer 更新。实测执行 `pnpm install --frozen-lockfile --ignore-scripts` 会直接报 `ERR_PNPM_OUTDATED_LOCKFILE`，并明确指出 `packages/adapters/claude-code/package.json` 与 lockfile 不一致。
- 影响: 干净环境或 CI 默认会在安装阶段直接失败，后续 `typecheck`、测试和构建都无法开始，属于交付阻断问题。
- 建议: 重新生成并提交 `pnpm-lock.yaml`，至少让 `packages/adapters/{claude-code,codex,github-copilot}` 的 importer 与 `workspace:*` 依赖声明保持一致；建议用一次 `pnpm install --lockfile-only` 或等价安装流程完成同步后，再复跑 `pnpm install --frozen-lockfile` 校验。

## 3. Notes
1. 除上述 lockfile 阻断项外，新增 adapter 基线实现与 `AgentRouteRunner` 集成测试在本地定向验证中表现一致，暂未看到第二个阻断性正确性问题。
2. 本次 review 重点检查了 adapter 协议契约、route fallback 行为、sprint 状态门禁脚本以及任务台账同步，未对整仓全量 gate 进行重跑。

## 4. Verification
1. `pnpm install --frozen-lockfile --ignore-scripts`（失败：`ERR_PNPM_OUTDATED_LOCKFILE`）
2. `pnpm run typecheck`（通过）
3. `pnpm run test:packages -- packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm -s exec vitest run --config vitest.integration.config.ts test/first-batch-adapters-route.integration.test.ts`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-03-21）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] 新增 workspace package 未同步更新 pnpm-lock.yaml`
   - 判定：**认可**
   - 证据：复核时 `pnpm install --frozen-lockfile --ignore-scripts` 可稳定复现 `ERR_PNPM_OUTDATED_LOCKFILE`，并指向 `packages/adapters/claude-code/package.json` 与 lockfile specifier 不一致。
   - 处理：已执行 `pnpm install --lockfile-only --ignore-scripts` 同步锁文件 importer/specifier 后，冻结安装恢复通过。

### 验证命令

1. `pnpm install --frozen-lockfile --ignore-scripts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run test:packages -- packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm -s exec vitest run --config vitest.integration.config.ts test/first-batch-adapters-route.integration.test.ts`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-03-21）

1. `2.1`：已完成
   - 变更文件：`pnpm-lock.yaml`
   - 验证：`pnpm install --frozen-lockfile --ignore-scripts`（通过）
   - 说明：补齐新增 workspace adapters importer 对应的 lockfile specifier/link，恢复 CI 默认冻结安装可执行性。
