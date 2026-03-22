# Code Review: TK-075 working tree follow-up

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-075`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/cli-output-presenter.ts`
4. `apps/cli/src/constants/cli-command.constant.ts`
5. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
6. `apps/cli/src/constants/ide-command-wrapper.constant.ts`
7. `apps/cli/src/types/interfaces/cli-output.interface.ts`
8. `apps/cli/src/types/interfaces/index.ts`
9. `apps/cli/src/types/index.ts`
10. `apps/cli/test/cli-output-contract.integration.test.ts`
11. `apps/cli/test/cli-skeleton.integration.test.ts`
12. `apps/cli/README.md`
13. `apps/cli/package.json`
14. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-075-cli-command-deskeletonization-and-governance-chain.md`
15. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
16. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
17. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings
### 2.1 [P1] `run` keeps reporting success even when the policy gate requires intervention
- 位置: `apps/cli/src/cli-governance-runtime.ts:598`
- 问题描述: `policy` 检查只有在 `BLOCK` 时才会被标记为 `FAIL`，而且 `executeRunCommand()` 不会因为 `BLOCK/CONFIRM/ESCALATE` 中任何一种结果而中断；方法仍然返回成功消息并让 CLI 以 `0` 退出。这样一来，按产品约束本应进入 HITL 暂停或阻断的高风险运行，在调用方看来仍然是“执行成功”。
- 影响: 自动化链路会把需要人工确认或升级的运行继续当作成功结果消费，策略闸口形同虚设，Stage 9 的 `run -> policy -> HITL` 语义被绕过。
- 建议: 将所有 `ALLOW` 之外的策略结果都映射成显式的非成功分支；至少 `BLOCK` 应返回非零退出，`CONFIRM/ESCALATE` 也应暴露 pending/HITL-required 状态而不是 `success`。

### 2.2 [P1] 审计记录把项目和 sprint 固定写死为当前自托管仓库
- 位置: `apps/cli/src/cli-governance-runtime.ts:484`
- 问题描述: `run` 路径写 audit event 时把 `projectId` 和 `sprintId` 硬编码为 `project-009-production-readiness` / `sprint-001-local-adoption-and-install-readiness`，后面的 policy 事件也重复了同样的值。产品主目标是治理“接入本工具的目标仓库”，而不是把所有外部仓库执行都记成当前自托管 sprint。
- 影响: 一旦 CLI 在其他仓库中运行，导出的 audit/report/filter 会携带错误项目标签，直接污染追踪、汇总和回放结果。
- 建议: 从 workspace/context 中解析 project/sprint；若当前仓库没有这类上下文，就不要写入这两个字段。

### 2.3 [P2] `review-verify` 会把已有验证产物再次当成待验证请求
- 位置: `apps/cli/src/cli-governance-runtime.ts:692`
- 问题描述: 目录扫描条件是 `review-*.json`，这会同时匹配 `review-verify-*.json`。第一次执行 `review-verify` 后，第二次执行会选中最新的 `review-verify-*.json`，而不是最新排队的 `review-*.json` 请求。我用临时 git 仓库复现了 `review -> review-verify -> review-verify`，第二个验证产物里的 `sourceRequestPath` 已经指向前一个 `review-verify-*.json`。
- 影响: `review-verify` 生命周期会自我嵌套，后续命令不再反映真实待验证请求，自动化流程会累计错误的验证链条。
- 建议: 只筛选排队请求文件名或校验 payload 中的 `status=queued`，并且将验证结果与待验证请求分目录存放，避免相互污染。

## 3. Notes
1. `[apps/cli/README.md](apps/cli/README.md)` 原有 `Scope` 元数据存在历史漂移，本轮修复已同步收敛为 `project-009-production-readiness / TK-075`。
2. 当前 sprint 已有 `resolved_code_review_tk-075-cli-command-deskeletonization-and-governance-chain.md`；本报告用于追踪同任务后续工作树补充变更的 CR 与修复闭环。

## 4. Verification
1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test`（通过）
2. `node -e "const entries=['review-1.json','review-verify-2.json','foo.json'];console.log(entries.filter((n)=>n.startsWith('review-')&&n.endsWith('.json')).join(','))"`（通过）
3. `rg -n "projectId|sprintId|review-verify" apps/cli/src/cli-governance-runtime.ts`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] run keeps reporting success even when the policy gate requires intervention`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 在修复前仅对 `BLOCK` 标记失败，且始终返回成功消息。
   - 处理：纳入修复清单，收敛为 `ALLOW` 之外均非 success。

2. `2.2 [P1] 审计记录把项目和 sprint 固定写死为当前自托管仓库`
   - 判定：**认可**
   - 证据：`apps/cli/src/cli-governance-runtime.ts` 修复前存在硬编码 `project-009.../sprint-001...`。
   - 处理：纳入修复清单，改为从 workspace `current-context.md` 解析。

3. `2.3 [P2] review-verify 会把已有验证产物再次当成待验证请求`
   - 判定：**认可**
   - 证据：修复前过滤规则 `review-*.json` 会包含 `review-verify-*.json`。
   - 处理：纳入修复清单，改为仅消费 queued request 并隔离 request/result 目录。

## 修复执行记录（2026-03-22）

1. `2.1 [P1] run keeps reporting success even when the policy gate requires intervention`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test`（通过）
   - 说明：新增 `resolvePolicyCheckStatus`、`resolvePolicyAuditRecordStatus` 与 `throwForNonAllowPolicyOutcome`。`run` 仅在 `allow` 时返回成功；`block` 映射为阻断错误，`confirm/escalate` 映射为 HITL-required 非成功结果。

2. `2.2 [P1] 审计记录把项目和 sprint 固定写死为当前自托管仓库`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test`（通过）
   - 说明：新增 `resolveExecutionStreamMetadata`，从 `<workspace_root>/context/current-context.md` 解析 project/sprint；无法解析时省略字段，不再写死自托管值。

3. `2.3 [P2] review-verify 会把已有验证产物再次当成待验证请求`：已完成
   - 变更文件：`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/constants/cli-governance-runtime.constant.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`
   - 验证：`pnpm vitest run --config vitest.packages.config.ts apps/cli/test`（通过）
   - 说明：引入 `review-queue/requests` 与 `review-queue/results` 分层目录；`review-verify` 仅消费 `status=queued` 的 request artifact，并显式排除 `review-verify-*` 文件。

4. 额外收敛（非阻断项）：已完成
   - 变更文件：`apps/cli/README.md`
   - 验证：`pnpm run check`（通过）
   - 说明：修复 README 中 `Scope` 元数据漂移（`project-005/TK-050` -> `project-009/TK-075`）。

### 汇总验证

1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run check`（通过）
