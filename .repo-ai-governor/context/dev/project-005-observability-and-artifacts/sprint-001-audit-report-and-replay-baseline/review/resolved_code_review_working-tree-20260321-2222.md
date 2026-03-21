# Code Review: Working Tree Observability / Audit-Report-Replay Baseline

- Status: resolved
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
1. `pnpm-lock.yaml`
2. `packages/artifact-registry/package.json`
3. `packages/artifact-registry/src/artifact-registry.ts`
4. `packages/artifact-registry/src/dependency-resolver.ts`
5. `packages/core-session/src/audit-recorder.ts`
6. `packages/core-session/src/constants/audit-recorder.constant.ts`
7. `packages/core-session/src/types/interfaces/audit-recorder.interface.ts`
8. `packages/reporting/package.json`
9. `packages/reporting/src/report-builder.ts`
10. `packages/reporting/src/replay-explainer.ts`
11. `packages/reporting/src/types/interfaces/reporting.interface.ts`
12. `tsconfig.json`
13. `vitest.internal-alias.ts`

## 2. Findings
### 2.1 [P1] New workspace packages are missing from the lockfile
- 位置: `pnpm-lock.yaml:7`
- 问题描述: 本次变更新增了 `packages/artifact-registry/package.json` 和 `packages/reporting/package.json`，但 `pnpm-lock.yaml` 的 `importers` 里还没有这两个 workspace package 的 importer 条目。实测 `pnpm install --frozen-lockfile --ignore-scripts` 已失败，并报出 `ERR_PNPM_OUTDATED_LOCKFILE`，当前首个失败点是 `<ROOT>/packages/artifact-registry/package.json` 新增了 `@repo-ai-governor/shared@workspace:*` 但 lockfile 未同步。
- 影响: 干净环境和默认启用 frozen lockfile 的 CI 无法安装当前变更，交付不可复现。
- 建议: 重新生成并提交 `pnpm-lock.yaml`，确保两个新增 workspace package 的 importer 和依赖条目都落盘。

### 2.2 [P1] Dependency resolution status contract is inconsistent across artifact runtime and audit/report packages
- 位置: `packages/core-session/src/constants/audit-recorder.constant.ts:22`
- 问题描述: `core-session`/`reporting` 仍把 `dependencyResolutionStatus` 声明为 `resolved|missing|conflicted|skipped`，但 `ArtifactDependencyResolver` 实际写入审计字段的是 `resolved|warned|escalated|blocked`（见 `packages/artifact-registry/src/dependency-resolver.ts:91-92` 与 `packages/artifact-registry/src/dependency-resolver.ts:338-353`）。与此同时，`AuditRecorder` 在 `packages/core-session/src/audit-recorder.ts:224-229` 对该字段做了未校验的字符串强转，所以运行时会静默持久化一组不属于导出类型契约的值。
- 影响: 下游如果按 `core-session`/`reporting` 暴露的类型做分支，根本无法覆盖 resolver 真正输出的 `warned/escalated/blocked` 语义；这直接破坏了 TK-048 里要求的 “block/escalate/warn 语义与审计字段对齐”。
- 建议: 统一 `dependencyResolutionStatus` 的唯一枚举来源，并在 `AuditRecorder` 写入前对该字段按共享字面量集合做严格校验。

### 2.3 [P2] Report ordering becomes backend-dependent when multiple audit records share the same second
- 位置: `packages/reporting/src/report-builder.ts:166`
- 问题描述: `ReportBuilder` 只按 `recordedAt` 排序，而 `AuditRecorder` 默认把时间戳截断到秒（`packages/core-session/src/audit-recorder.ts:467-469`）。一旦同一秒内落多条记录，排序就退化为底层 reader 返回顺序；但不同 provider 的顺序并不一致，`fs-csv` 直接保留读取顺序（`packages/memory-providers/fs-csv/src/fs-csv-memory-store-provider.ts:115-123`），`sqlite-fs` 则按 `updated_at DESC` 返回（`packages/memory-providers/sqlite-fs/src/sqlite-fs-memory-store-provider.ts:135-154`）。这会让相同输入在不同存储后端下生成不同的 `records`、failure id 列表和 `replayPointers` 顺序。
- 影响: 报告与 replay 输出失去“确定性快照”特性，尤其在 bursty execution 场景下会出现跨环境不一致。
- 建议: 在所有 audit/report/replay 排序路径里增加稳定的二级排序键，例如 `recordId`，避免把结果顺序绑定到底层存储实现。

## 3. Notes
1. 本轮重点审查了新增的 `core-session`/`artifact-registry`/`reporting` 基线实现，以及这些新增 workspace package 对安装链路的影响。
2. 上述问题之外，`pnpm run typecheck`、定向 package tests、`check-task-ledger-sync` 和 `check-artifact-registry-lifecycle` 均通过。
3. 我没有重跑全量 `pnpm run check`，所以结论主要覆盖当前改动涉及的包、依赖台账与安装链路。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts packages/artifact-registry/test/artifact-registry.unit.test.ts`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm install --frozen-lockfile --ignore-scripts`（失败，复现 lockfile 问题）

## 复核结论（2026-03-21）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] New workspace packages are missing from the lockfile`
   - 判定：**认可**
   - 证据：`pnpm-lock.yaml` 已包含新增 importer（`packages/artifact-registry` 与 `packages/reporting`，见 `pnpm-lock.yaml:78`、`pnpm-lock.yaml:189`），且 `pnpm install --frozen-lockfile --ignore-scripts` 已通过。
   - 处理：已重新执行 `pnpm install --ignore-scripts` 并同步 lockfile。
2. `2.2 [P1] Dependency resolution status contract is inconsistent across artifact runtime and audit/report packages`
   - 判定：**认可**
   - 证据：新增 shared 单一枚举源 `packages/shared/src/constants/dependency-resolution-status.constant.ts`；`artifact-registry` 改为从 shared 转发导出（`packages/artifact-registry/src/constants/artifact-registry.constant.ts:1`、`:33`）；`AuditRecorder` 已对该字段做严格枚举校验（`packages/core-session/src/audit-recorder.ts:374-392`）。
   - 处理：已完成契约统一与写入前校验，消除静默字符串强转。
3. `2.3 [P2] Report ordering becomes backend-dependent when multiple audit records share the same second`
   - 判定：**认可**
   - 证据：排序链路已补齐同秒二级键 `recordId`：
     - `packages/core-session/src/audit-recorder.ts:83`、`:315-325`
     - `packages/reporting/src/report-builder.ts:200`、`:209-220`
     - `packages/reporting/src/replay-explainer.ts:167`、`:178-186`
     并新增同秒场景单测覆盖。
   - 处理：已完成稳定排序修复并补充测试。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts packages/artifact-registry/test/artifact-registry.unit.test.ts`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm install --frozen-lockfile --ignore-scripts`（通过）

## 修复执行记录（2026-03-21）

1. `2.1`：已完成
   - 变更文件：`pnpm-lock.yaml`
   - 验证：`pnpm install --frozen-lockfile --ignore-scripts`（通过）
   - 说明：锁文件已与新增 workspace package importer 对齐。
2. `2.2`：已完成
   - 变更文件：`packages/shared/src/constants/dependency-resolution-status.constant.ts`、`packages/shared/src/constants/index.ts`、`packages/shared/src/index.ts`、`packages/artifact-registry/src/constants/artifact-registry.constant.ts`、`packages/core-session/src/constants/audit-recorder.constant.ts`、`packages/core-session/src/audit-recorder.ts`
   - 验证：`pnpm run typecheck`（通过）
   - 说明：统一状态枚举来源并新增 `AuditRecorder` 运行时校验。
3. `2.3`：已完成
   - 变更文件：`packages/core-session/src/audit-recorder.ts`、`packages/reporting/src/report-builder.ts`、`packages/reporting/src/replay-explainer.ts`、`packages/core-session/test/audit-recorder.unit.test.ts`、`packages/reporting/test/report-builder.unit.test.ts`、`packages/reporting/test/replay-explainer.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts packages/artifact-registry/test/artifact-registry.unit.test.ts`（通过）
   - 说明：同秒多记录场景已稳定排序并补齐回归测试。
