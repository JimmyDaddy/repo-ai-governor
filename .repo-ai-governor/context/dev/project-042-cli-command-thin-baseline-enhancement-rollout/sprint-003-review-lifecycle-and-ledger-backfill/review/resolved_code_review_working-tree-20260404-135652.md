# Code Review: working-tree-20260404-135652

- Status: resolved
- Date: 2026-04-04
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/completed-streams-history.md`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
5. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
6. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
7. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
8. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
9. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
10. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/adrs/sqlite-fs-default-runtime-truth-and-rendered-csv-views.md`
11. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
12. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
13. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
14. `apps/cli/src/cli-output-presenter.ts`
15. `apps/cli/src/commands/doctor-command.ts`
16. `apps/cli/src/commands/plan-command.ts`
17. `apps/cli/src/commands/review-command.ts`
18. `apps/cli/src/commands/review-verify-command.ts`
19. `apps/cli/src/commands/upgrade-command.ts`
20. `apps/cli/src/commands/verify-command.ts`
21. `apps/cli/src/constants/cli-command-result-check.constant.ts`
22. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
23. `apps/cli/src/constants/cli-output.constant.ts`
24. `apps/cli/src/main.ts`
25. `apps/cli/src/runtime/durable-storage-diagnostics-runtime.ts`
26. `apps/cli/src/types/index.ts`
27. `apps/cli/src/types/interfaces/cli-durable-storage-diagnostics.interface.ts`
28. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
29. `apps/cli/src/types/interfaces/index.ts`
30. `apps/cli/test/cli-governance-runtime.integration.test.ts`
31. `apps/cli/test/cli-output-contract.integration.test.ts`
32. `apps/cli/test/commands/review-verify-command.test.ts`
33. `examples/multi-role-collaboration-flow/expected/runtime-baseline.json`
34. `examples/multi-role-collaboration-flow/scenario.json`
35. `packages/config/src/upgrade-schema-diff-service.ts`
36. `packages/shared/src/i18n/locales/en-us.ts`
37. `packages/shared/src/i18n/locales/zh-cn.ts`
38. `scripts/governance/check-task-ledger-sync.js`
39. `scripts/governance/sync-task-ledger.js`
40. `scripts/governance/task-ledger-projection.js`
41. `test/e2e/blackbox-governance-flow.e2e.test.ts`
42. `test/sync-task-ledger.integration.test.ts`
43. `test/task-ledger-projection.integration.test.ts`

## 2. Findings
### 2.1 [P1] `review` scope parsing truncates ordinary unstaged file paths
- 位置: `apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts:127-130`
- 问题描述: `collectGitChangedPaths()` 先对 `git status --porcelain` 的整行做 `trim()`，再 `slice(3)` 截掉状态位。对最常见的未暂存修改形态 ` M <path>`，`trim()` 会先吃掉前导空格，导致路径首字符也被一起截掉。当前工作树本身就是这种形态；例如 `node -e "const line=' M apps/cli/src/main.ts'; console.log(line.trim().slice(3));"` 实际输出是 `pps/cli/src/main.ts`。这会让后续 risk evaluator、TODO 扫描和缺测判断都基于错误路径运行。
- 影响: `review` / `review-verify` 在正常的 unstaged working tree 上会漏掉真实改动文件，严重时直接把有风险的改动误判成“无 actionable finding”并写成 `resolved`。
- 建议: 保留 porcelain 的两位状态列，先按固定列宽切出路径再单独 `trim()` 路径 payload；同时补一条覆盖 ` M <path>` 的回归测试。

### 2.2 [P1] stream 路径被错误地绑定到调用时 cwd，而不是仓库根
- 位置: `apps/cli/src/commands/review-command.ts:45-47`、`apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts:300-305`、`apps/cli/src/commands/plan-command.ts:667-694`
- 问题描述: `review` 和 `plan` 都把 `context.options.currentWorkingDirectory` 当成 repository root 传给路径解析逻辑；而入口层 `apps/cli/src/main.ts:437` 明确把它设置成 `io.cwd()`。这样一来，`current-context.md` 中像 `.repo-ai-governor/context/dev/...` 这种仓库相对路径，会在从 `apps/cli/` 等子目录运行命令时被解析到错误的嵌套位置，而不是实际仓库根。
- 影响: 只要用户不是在 repo root 运行命令，review artifact、tasks/checklist/tasks.csv 以及后续 ledger sync 就会读写错目录，表现为“找不到 active stream 台账”或把产物写进一棵错误的 `.repo-ai-governor` 子树。
- 建议: 将 `current-context` 派生出的 repo-relative 路径统一解析到真实仓库根或 workspace 所属仓库根，而不是命令调用目录。

### 2.3 [P2] `plan commit` 在 preview 后发生同标题漂移时，会把不存在的 TK id 写回 sprint plan
- 位置: `apps/cli/src/commands/plan-command.ts:449-458`、`apps/cli/src/commands/plan-command.ts:1169-1174`
- 问题描述: commit 阶段会再次读取现有 task cards；如果 preview 期间原本计划 `CREATE` 的任务，在 commit 前已经因为同标题被别的操作创建出来，代码会把它降级成 `RETAIN_EXISTING`，但没有把 `provisionalTaskId` 改成真实保留的 task id。`updateSprintPlan()` 随后仍然用 `task.provisionalTaskId` 重写 `## 1. Task Package`，于是 sprint plan 可能引用一个从未落地的“新 TK”，而 receipt/checklist 却把旧 TK 视为 retained。
- 影响: preview -> commit 漂移场景下，`plan.md`、TK 文件和 receipt 会出现事实分叉，后续人工执行或门禁校验会沿着一个不存在的 task id 继续走。
- 建议: 当 commit 将任务从 `CREATE` 改判为 `RETAIN_EXISTING` 时，立即把 preview item 的 task id 替换为实际保留的 canonical task id，再统一渲染 sprint plan 和 receipt。

### 2.4 [P2] 已 `resolved` 的 review 仍然被留在 `review-verify` 的 queued 池里
- 位置: `apps/cli/src/commands/review-command.ts:110-124`、`apps/cli/src/runtime/artifacts/review-queue-runtime.ts:70-75`、`apps/cli/src/commands/review-verify-command.ts:100-145`
- 问题描述: `review` 即使已经生成 `resolved_code_review_*.md`，仍然无条件把 transport artifact 写成 `status: queued`。而 queued 请求收集与选择逻辑只看 `status === queued`，不会排除 `reviewArtifactStatus === resolved` 的请求。这样“无需 follow-up verify”的 no-op review 仍会进入后续 `review-verify` 的默认消费队列。
- 影响: 用户下一次直接执行 `review-verify`（尤其未带 `--task-id`）时，命令可能优先消费一个已经 resolved 的请求，而不是仍待复核的真实 pending review，导致真正的 review lifecycle 卡在队列里。
- 建议: 对无 finding 的 review 直接写成已消费状态，或至少在 queued 请求选择阶段显式跳过 `reviewArtifactStatus === resolved` 的请求。

## 3. Notes
1. 本次重点深读了 `review / review-verify / plan` 生命周期实现以及与 task ledger / current-context 路由直接耦合的代码面，因为这些改动最容易造成错误审计结论或错误写盘。
2. `upgrade` 与 task-ledger sqlite 切换也有较大变更量，但本轮没有继续扩到新的可复现 blocker；建议在修完本报告后再补一次 focused CR，专门盯 apply/rollback 与 sqlite bootstrap 的边界场景。
3. 这次是 review-only 窗口，没有宣称“全绿”；我没有运行 `pnpm run build` 或测试套件来给出完成态结论。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `sed -n '1,360p' apps/cli/src/commands/review-command.ts`、`sed -n '1,360p' apps/cli/src/commands/review-verify-command.ts`、`sed -n '1,260p' apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`、`sed -n '1,260p' apps/cli/src/runtime/review/cli-review-finding-generator.ts`、`sed -n '329,520p' apps/cli/src/commands/plan-command.ts` 等定向代码阅读命令（通过）
5. `node -e "const line=' M apps/cli/src/main.ts'; console.log(line.trim().slice(3));"`（通过，输出 `pps/cli/src/main.ts`，验证了 2.1 的路径截断问题）

## 复核结论（2026-04-04）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`collectGitChangedPaths()` 已改为保留 porcelain 固定状态列后再切路径 payload，`apps/cli/test/commands/review-command.test.ts` 新增了 ` M <path>` 的未暂存回归覆盖。
   - 处理：已修复。
2. `2.2`
   - 判定：**认可**
   - 证据：`review` / `review-verify` / `plan` 现已统一使用 `context.options.workspace.repositoryRoot` 解析 active-stream repo-relative 路径，并补了子目录调用回归测试。
   - 处理：已修复。
3. `2.3`
   - 判定：**认可**
   - 证据：`plan commit` 现在会在 preview-create 项目因为同标题漂移命中既有任务时，把 `finalTaskPackage` 的 `provisionalTaskId` 改写成真实 retained canonical task id；新集成测试覆盖了 preview 后漂移到 `TK-525` 的场景。
   - 处理：已修复。
4. `2.4`
   - 判定：**认可**
   - 证据：`review-verify` 默认选择已改为优先未解决或 `recordLedger=true` 的请求，resolved no-op 请求不会再抢占真实 pending review；相关回归仍保持通过。
   - 处理：已修复。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-04）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/review/cli-review-lifecycle-runtime.ts`、`apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：修正普通未暂存 porcelain 行的路径切片逻辑，避免首字符被吞掉。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/commands/review-command.ts`、`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/src/commands/plan-command.ts`、`apps/cli/test/commands/review-command.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：active-stream repo-relative 路由已绑定到真实仓库根，不再依赖调用时 cwd。
3. `2.3`：已完成
   - 变更文件：`apps/cli/src/commands/plan-command.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）、`pnpm run build`（通过）
   - 说明：当 preview-create 项在 commit 前因同标题漂移命中既有任务时，sprint plan 与 receipt 现在都会回写 retained canonical task id，而不是悬挂不存在的 provisional id。
4. `2.4`：已完成
   - 变更文件：`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/test/commands/review-verify-command.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：resolved no-op review 请求仍保留显式 closure/ledger 路径，但默认 `review-verify` 已不会优先消费它们。

## 复核结论（2026-04-04）

- 整体结论：**部分认可**

### 逐条复核
1. `follow-up-1`
   - 判定：**认可**
   - 证据：`review-verify` 默认选择阶段会对 queued request 再次读取 JSON；旧实现把 `safeReadJson()` 返回 `null` 的 payload 也当作优先候选，可能让并发损坏/改写的请求压过最新可读请求。现已改为只优先可读 payload，并在无高优先级时先回退到“最新可读请求”。
   - 处理：已修复。
2. `follow-up-2`
   - 判定：**部分认可**
   - 证据：`initGitRepository()` 已在前一修复窗口显式写入 `commit.gpgSign=false`，所以 GPG 子项不再成立；但 `commitAll()` 之前仍会继承全局 hook 校验，继续加 `--no-verify` 能消除这部分测试环境依赖。
   - 处理：接受 hooks 隔离子项并已修复。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-04）

1. `follow-up-1`：已完成
   - 变更文件：`apps/cli/src/commands/review-verify-command.ts`、`apps/cli/test/commands/review-verify-command.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：默认 `review-verify` 现在会先选择可读且值得优先处理的 queued request，再回退到最新可读请求，只有在没有任何可读 payload 时才兜底选取原始队列项。
2. `follow-up-2`：已完成
   - 变更文件：`apps/cli/test/commands/review-command.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/review-command.test.ts apps/cli/test/commands/review-verify-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）、`pnpm run build`（通过）
   - 说明：`commitAll()` 已改为使用 `git commit --no-verify`，与仓库级 `commit.gpgSign=false` 共同保证 fixture commit 不受本机 Git 环境影响。
