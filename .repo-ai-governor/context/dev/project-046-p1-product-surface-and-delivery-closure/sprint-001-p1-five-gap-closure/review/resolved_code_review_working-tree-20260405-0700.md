# Code Review: Working Tree Review 2026-04-05

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `apps/desktop/src/runtime/desktop-preload-bridge.ts`
4. `apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`
5. `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`
6. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
7. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
8. `packages/standards/src/standards-runtime-loader.ts`
9. `packages/config/src/schema-validator.ts`
10. `scripts/governance/check-task-ledger-sync.js`
11. `apps/desktop/test/**`
12. `test/desktop-entry-smoke.integration.test.ts`
13. `test/task-ledger-gates.integration.test.ts`
14. `docs/support-matrix.md`
15. `docs/support-matrix.zh-CN.md`
16. `docs/ga-readiness-evidence.md`
17. `docs/ga-readiness-evidence.zh-CN.md`
18. `integrations/ci/**`
19. `packages/adapters/claude-code/README.md`
20. `packages/adapters/github-copilot/README.md`
21. `packages/adapters/local-model/README.md`
22. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
23. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
24. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`
25. `package.json`
26. `integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
27. `.repo-ai-governor/context/dev/project-045-governance-truth-alignment-and-primary-stream-cutover/plan.md`
28. `.repo-ai-governor/context/dev/project-045-governance-truth-alignment-and-primary-stream-cutover/project-045-governance-truth-alignment-and-primary-stream-cutover-completion-audit-summary.md`
29. `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md`
30. `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/project-046-p1-product-surface-and-delivery-closure-completion-audit-summary.md`
31. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/project-038-session-main-capability-explainer-productization-completion-audit-summary.md`
32. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`

## 2. Findings
### 2.1 [P1] Current context no longer provides a valid default CR routing target
- 位置: `.repo-ai-governor/context/current-context.md:5`
- 问题描述: 当前变更把 primary stream 切成 `idle`，同时把 `Review records` 置为 `none`，且文件内没有 `## Worktree Review Target` override。按照仓库级 `AGENTS.md` 和当前 workspace code review skill，working-tree review 产物默认只能写到 active primary stream `review/` 或 `Worktree Review Target`，否则就必须依赖人工显式指定路径。本次 worktree 仍存在大量未收口改动，但默认 CR 路由已经被移除。
- 影响: 后续 `帮我 cr`、CR 复核和 CR 修复工作流都无法从上下文自动解析合法输出目录，导致 review 生命周期台账与自动化行为脱钩。
- 建议: 保留最近 completed stream 作为 active closeout surface，或在同一变更窗口补充 `## Worktree Review Target` 指向已完成 stream 的 `review/` 目录，并在最后一个 pending/verified CR 关闭后清理该 override。

### 2.2 [P1] Artifact-pane review path resolution ignores `Worktree Review Target` and treats `none` as a real directory
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts:280`
- 问题描述: `resolvePrimaryReviewDirectoryPath()` 只抓取 `current-context.md` 里第一个 `- Review records:` 字段，没有按协议优先解析 `## Worktree Review Target`。在当前 worktree 里，这个字段的值正好是字面量 `none`，函数会把它解析成 `<repo>/none`，随后 `query()` 又把这个不存在的路径原样回传给 `reviewSourcePath`。这意味着桌面端既拿不到 completed-stream CR tail 的真实 review 目录，也会暴露一个伪造的 review source。
- 影响: 新增的 service-owned artifact pane 在 completed-stream closeout 场景下无法展示真正待收口的 review 生命周期文件，还会向 renderer 输出误导性的 `review_source`，直接破坏 `Worktree Review Target` 协议的核心语义。
- 建议: 按 `显式 target -> Worktree Review Target -> active primary stream` 顺序解析 review 路径；将 `none` 视为未配置；只有目录真实存在时才回填 `reviewSourcePath`。同时补一条覆盖 `Worktree Review Target` 与 `Review records: none` 的单测。

### 2.3 [P2] Governance console snapshot can combine artifacts from one execution with transcript from another session
- 位置: `apps/desktop/src/runtime/desktop-preload-bridge.ts:160`
- 问题描述: `buildGovernanceConsoleSnapshot()` 分别拉取“最新 execution 列表”和“最新 session 列表”，再把 `executions[0].executionId` 与 `sessions[0].sessionId` 同时传给 `queryArtifactPane()`。当最新 session 并不属于最新 execution 时，artifact pane 会把 execution A 的产物/评审和 session B 的 transcript 混在同一个快照里。
- 影响: 桌面治理控制台会在多会话并行或恢复历史执行时展示错误的上下文组合，让 transcript、artifact 和 review 看起来像同一条执行链上的证据。
- 建议: 由 execution 派生 session（优先使用 `executionSessionId`），或把“解析同一上下文对”的职责下沉到 service 端，并补一条“latest execution != latest session” 的回归测试。

### 2.4 [P1] Newly published GitLab/Jenkins templates are not included in the npm package
- 位置: `package.json:27`
- 问题描述: 本次变更把 `integrations/ci/gitlab-ci/**` 与 `integrations/ci/jenkins/**` 定位为“官方模板”并同步进 `docs/support-matrix*.md`、`integrations/ci/README.md` 和 `project-046` completion audit，但根 `package.json -> files` 白名单仍只发布 `integrations/ide` 与 `integrations/desktop`，没有包含 `integrations/ci`。`npm pack --dry-run --json` 的产物清单里也确实看不到任何 `integrations/ci/**` 文件。
- 影响: 从 npm 安装仓库分发包的用户拿不到这批新模板，导致文档声明的“已发布官方 GitLab/Jenkins 模板”在真实分发物中不可用，形成明显的对外 truthfulness 漂移。
- 建议: 将 `integrations/ci` 加入根包 `files` 白名单，并补一条打包层校验，确保 GitHub Actions 之外的官方 CI 模板会随发布物一起分发。

### 2.5 [P3] Project-046 top-level plan still marks the finished sprint as active
- 位置: `.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md:26`
- 问题描述: `project-046` 顶层 `plan.md` 已经把项目状态改为 `completed`，同一文件的 WBS 也把 `TK-551 ~ TK-555` 全部标成 `completed`，但 `## 2.1 sprint-001-p1-five-gap-closure` 仍写着 `Status: active`。与此同时，sprint 自己的 `plan.md` 与 `tasks/checklist.md` / `tasks/tasks.csv` 都已经是完成态。
- 影响: 虽然当前 gate 主要以 sprint 目录下的 `plan.md` 为准，但顶层 project plan 仍会给人工追溯和后续 closeout 判断带来错误信号。
- 建议: 将顶层 project plan 中该 sprint 条目的状态同步为 `completed`，保持 project plan、sprint plan 与 ledger 描述一致。

## 3. Notes
1. 由于 `.repo-ai-governor/context/current-context.md` 当前没有可解析的默认 review 输出目录，本报告以显式路径方式写入 `project-046-p1-product-surface-and-delivery-closure / sprint-001-p1-five-gap-closure / review/`，这是基于当前上下文注释中最近完成 stream 的保守假设。
2. 本次 packages / integration 测试和 `pnpm run build` 都通过，但现有用例没有覆盖 `Worktree Review Target` 路由，也没有覆盖 “latest execution / latest session 不一致” 的组合场景。
3. 已补充复核其余改动项，包括 `packages/config` 的 `standards` schema 扩展、`packages/standards` runtime loader、`scripts/governance/check-task-ledger-sync.js` 的 idle 分支、desktop sample、untracked project/completion-audit/backlog 台账以及 CI 模板/支持矩阵/GA evidence 的文档同步；除第 2 节列出的 5 个 finding 外，未发现新增 actionable issue。

## 4. Verification
1. `pnpm run test:packages -- packages/standards/test/standards-runtime-loader.integration.test.ts packages/config/test/config.unit.test.ts apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts`（通过；实际执行时跑出了 packages 配置下的全量 package tests）
2. `pnpm run test:integration -- test/desktop-entry-smoke.integration.test.ts test/task-ledger-gates.integration.test.ts`（通过）
3. `pnpm run build`（通过）
4. `npm pack --dry-run --json`（通过；确认发布物清单中不包含 `integrations/ci/**`）

## 复核结论（2026-04-05）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**不认可**
   - 证据：当前 worktree 同时存在 `project-015`、`project-037`、`project-044` 与 `project-046` 的 open `verified/code_review` 生命周期文件；`.repo-ai-governor/context/current-context.md -> Update Rules 8` 明确要求这种场景不要保留多个默认 target，而应显式指定 report 路径或先收完一个再切换另一个。
   - 处理：本次继续按显式 report 路径只收口 `project-046` 这份 pending CR，不把 `Worktree Review Target` 强行写回 `current-context.md`。
2. `2.2`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceArtifactPaneQueryRuntime` 原实现确实只读取第一个 `- Review records:` 字段，无法优先解析 `## Worktree Review Target`，且会把字面量 `none` 解析成伪路径；现已改为按 `Worktree Review Target -> Primary Stream` 顺序解析，并只在目录真实存在时回填 `reviewSourcePath`。
   - 处理：已修复并补充覆盖 `Worktree Review Target + Review records: none` 组合场景的单测。
3. `2.3`
   - 判定：**认可**
   - 证据：`DesktopPreloadBridge.buildGovernanceConsoleSnapshot()` 原实现会把最新 execution 与最新 session 独立拼装；现已改为优先使用最新 execution 的 `executionSessionId`，仅在 execution 缺失时回退到最新 standalone session。
   - 处理：已修复并补充 execution/session 不一致及 fallback 场景的单测。
4. `2.4`
   - 判定：**认可**
   - 证据：根 `package.json -> files` 原先确实未包含 `integrations/ci`，且 release local distribution gate 也没有要求这些模板必须出现在 packed manifest 中；现已同时补齐发布白名单与 packed-path 校验。
   - 处理：已修复，并通过新的 `npm pack --dry-run --json` 结果确认 GitLab/Jenkins 模板已进入分发物。
5. `2.5`
   - 判定：**认可**
   - 证据：`project-046` 顶层 `plan.md` 的 sprint 条目此前仍是 `Status: active`，与 sprint 自身 plan 和 ledger 的完成态不一致；现已同步为 `completed`，且 `check-sprint-plan-status-sync` 通过。
   - 处理：已修复。

### 验证命令
1. `pnpm vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-preload-bridge.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `npm pack --dry-run --json`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 修复执行记录（2026-04-05）

1. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-artifact-pane-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`
   - 验证：`pnpm vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-preload-bridge.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：artifact-pane review 路由现已优先解析 `Worktree Review Target`，并把 `none` 与不存在目录都视为未配置。
2. `2.3`：已完成
   - 变更文件：`apps/desktop/src/runtime/desktop-preload-bridge.ts`、`apps/desktop/test/desktop-preload-bridge.test.ts`
   - 验证：`pnpm vitest run packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts apps/desktop/test/desktop-preload-bridge.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：desktop governance console 构建 snapshot 时，artifact pane 现在会绑定到最新 execution 对应的 session。
3. `2.4`：已完成
   - 变更文件：`package.json`、`scripts/release/verify-local-distribution.js`
   - 验证：`npm pack --dry-run --json`（通过）
   - 说明：`integrations/ci/**` 已纳入根包发布白名单，并纳入 local distribution packed-path 必选校验。
4. `2.5`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-046-p1-product-surface-and-delivery-closure/plan.md`
   - 验证：`node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
   - 说明：project-046 顶层 plan 中 `sprint-001-p1-five-gap-closure` 的状态已与 sprint plan/ledger 同步为 `completed`。
