# DA-135 standards injection source ID 与 resolver 收口

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-135`
- Produced By: `TK-135`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

将 IDE standards injection baseline 从“当前仓库硬编码路径列表”收敛为“稳定 source IDs + self-hosted resolver registry”，避免把 self-host 布局误当成产品默认契约。

## 2. 关键实现

1. 新增稳定 source IDs 与 self-hosted resolver registry：
   - `apps/cli/src/constants/ide-standards-source.constant.ts`
   - `apps/cli/src/runtime/ide-standards-source-runtime.ts`
2. `integrations/ide/contracts/standards-injection.contract.json` 已从 `defaultSources` 升级为：
   - `defaultSourceIds`
   - `selfHostedSourceRegistry`
3. `IdeCommandWrapper` 现改为：
   - `REPO_AI_GOVERNOR_STANDARDS_SOURCES=<csv source ids>`
   - metadata 中显式返回 `sourceIds + resolvedSources`
4. self-hosted 文件路径解析被下沉到 resolver registry；模板和产品契约不再直接依赖 `.repo-ai-governor/...` 路径。
5. 官方模板已同步切到 source IDs：
   - VS Code
   - JetBrains
   - Cursor
   - Claude Code
6. `integrations/ide/README.md` 与 `integrations/ide/examples/README.md` 已明确：
   - env 中注入的是 stable source IDs
   - self-hosted 解析由 contract registry 负责
7. 真实 CLI 入口现已消费并校验 `REPO_AI_GOVERNOR_ENTRY_SURFACE / REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID / REPO_AI_GOVERNOR_STANDARDS_SOURCES`，合法值会进入稳定 JSON diagnostics，非法 surface/source IDs 会 fail-fast。
8. `check-ide-entry-smoke.js`、`check-ide-docs-parity.js`、wrapper contract/unit tests 与 IDE entry integration 都已切到新语义。

## 3. 关键产物

1. `DA-135` 本文档
2. `resolved_code_review_tk-135-standards-injection-source-id-and-resolver-hardening.md`
3. `integrations/ide/contracts/standards-injection.contract.json`
4. `apps/cli/src/constants/ide-standards-source.constant.ts`
5. `apps/cli/src/runtime/ide-standards-source-runtime.ts`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/examples/check-ide-entry-smoke.js`
3. `node ./scripts/examples/check-ide-docs-parity.js`
4. `pnpm -s vitest run apps/cli/test/ide-command-wrapper.unit.test.ts apps/cli/test/ide-command-wrapper.contract.test.ts test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm -s vitest run apps/cli/test/cli-output-contract.integration.test.ts test/ide-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-code-review-status-sync.js`
9. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
10. `pnpm run check`

## 5. 结论

1. 现在产品契约表达的是稳定 `source IDs`，不是当前仓库的内部路径布局。
2. self-hosted 文件路径仍然可用，但已被限制在 resolver 层，后续新项目/外部仓库接入不再被迫复制本仓库目录结构。
3. `TK-112` 可以在此基础上完成 project-010 出口验收，不需要再把 standards injection contract 视为已知风险。
