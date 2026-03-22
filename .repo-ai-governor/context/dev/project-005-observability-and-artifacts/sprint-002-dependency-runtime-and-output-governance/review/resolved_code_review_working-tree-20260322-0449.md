# Code Review: Working Tree Audit Privacy Governance Baseline

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/core-session/src/audit-recorder.ts`
2. `packages/core-session/src/constants/audit-privacy-governance.constant.ts`
3. `packages/core-session/src/constants/index.ts`
4. `packages/core-session/src/types/interfaces/audit-recorder.interface.ts`
5. `packages/core-session/src/types/interfaces/index.ts`
6. `packages/core-session/src/types/index.ts`
7. `packages/core-session/src/index.ts`
8. `packages/core-session/test/audit-recorder.unit.test.ts`
9. `packages/core-session/README.md`
10. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-052-audit-privacy-governance-retention-masking-export-delete-baseline.md`

## 2. Findings
### 2.1 [P1] Default masking breaks valid audit events that include token usage metrics
- 位置: `packages/core-session/src/audit-recorder.ts:556`
- 问题描述: `maskSensitiveValue()` 先按字段名做子串匹配，只要字段名里含有 `token` 就直接替换成 `[REDACTED]`。这会把合法 schema 字段 `tokenBudget` 和 `tokenUsed` 一并命中；随后 `applySensitiveDataMasking()` 又把被替换后的结果重新走 `normalizeAuditEvent()`，最终在 `readOptionalNumber("tokenBudget")` / `readOptionalNumber("tokenUsed")` 处抛 `AUDIT_RECORD_INVALID`。我用当前 `dist` 构建产物复现过：只要事件里带 `tokenBudget: 100`，`recordEvent()` 就会失败。
- 影响: 任何写入 token 用量统计的调用方，在默认开启 masking 的情况下都无法持久化审计事件；这会直接破坏已有审计 schema 的兼容性，并让后续 reporting/replay 看不到这些执行记录。
- 建议: 将字段名规则从宽泛子串匹配收敛到真正的敏感键名，或至少显式排除 `tokenBudget` / `tokenUsed` 这类已定义的业务字段，并补一条覆盖 token 用量字段的回归测试。

### 2.2 [P2] One malformed historical audit row blocks scoped export/delete/retention for unrelated executions
- 位置: `packages/core-session/src/audit-recorder.ts:472`
- 问题描述: `exportEvents()`、`deleteEvents()` 和 `applyRetentionPolicy()` 都会先调用 `loadAuditStorageRows()`，这里对 `queryEntries({ tag: "audit-record" })` 返回的所有行直接 `map(parsePersistedAuditRecord)`，在过滤前就把全量历史记录都强制解析。结果只要执行记忆里存在一条损坏的审计 payload，即使目标 `executionId` 对应的记录完全正常，导出/删除/保留策略也会先被那条坏数据打断。我用一条 `event: "not-an-object"` 的坏记录加一条正常记录复现过，`exportEvents({ executionId: "good-exec" })` 直接抛 `AUDIT_RECORD_INVALID`。
- 影响: 新增的隐私治理 API 对坏数据的 blast radius 变成“全局级”；一个历史坏行就可能阻断后续按 execution/project/sprint 的合规导出、定向删除和 retention 清理。
- 建议: 先按请求范围缩小候选集，再解析 payload；或者在全量扫描时隔离/跳过坏行并把异常记录单独上报，避免无关 execution 的合规处置被整体卡死。

## 3. Notes
1. 这轮没有在 `projectId/sprintId` 新增字段的导出面、README 同步和 task ledger 同步上发现第二组阻断性问题。
2. 本次评审重点放在新增隐私治理 API 的运行时行为与边界条件，没有对未改动的旧审计读取路径重复展开全量复核。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts`（通过）
3. `pnpm run check:task-ledger-sync`（通过）
4. `pnpm run check:sprint-plan-status-sync`（通过）
5. `pnpm run check:artifact-lifecycle`（通过）
6. `node --input-type=module <<'EOF' ... tokenBudget reproduction ... EOF`（复现 `recordEvent()` 因 `tokenBudget` 被脱敏成字符串而抛 `AUDIT_RECORD_INVALID`）
7. `node --input-type=module <<'EOF' ... malformed historical row reproduction ... EOF`（复现无关坏记录阻断 `exportEvents({ executionId: "good-exec" })`）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] Default masking breaks valid audit events that include token usage metrics`
   - 判定：**认可**
   - 证据：`AUDIT_SENSITIVE_FIELD_NAME_MARKERS` 原有宽泛 `token` 子串规则会命中 `tokenBudget/tokenUsed`；`applySensitiveDataMasking -> normalizeAuditEvent` 会在数字字段被替换为字符串后抛 `AUDIT_RECORD_INVALID`。
   - 处理：已将字段名脱敏从“子串正则匹配”改为“规范化字段名 + 明确敏感键/后缀 + 非敏感白名单例外”，并显式排除 `tokenBudget/tokenUsed`。
2. `2.2 [P2] One malformed historical audit row blocks scoped export/delete/retention for unrelated executions`
   - 判定：**认可**
   - 证据：`loadAuditStorageRows()` 原实现先全量 `map(parsePersistedAuditRecord)`，在过滤前就可能被坏行打断。
   - 处理：已将导出/删除/保留策略改为“请求范围优先 + 可跳过坏行”策略：支持按 `executionId` 预缩小 keyPrefix 查询，并在隐私治理 API 中隔离坏行，不让无关 execution 的合规操作被全局阻断。

### 验证命令
1. `pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run check`（通过）

## 修复执行记录（2026-03-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-session/src/constants/audit-privacy-governance.constant.ts`、`packages/core-session/src/constants/index.ts`、`packages/core-session/src/audit-recorder.ts`、`packages/core-session/test/audit-recorder.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts`（通过）
   - 说明：新增 `AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTIONS` 与后缀敏感规则，避免误伤 token 用量指标并保持敏感 token 键仍被脱敏。
2. `2.2`：已完成
   - 变更文件：`packages/core-session/src/audit-recorder.ts`、`packages/core-session/test/audit-recorder.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts`、`pnpm run check`（通过）
   - 说明：`loadAuditStorageRows` 支持 `executionId` 预过滤和 `skipInvalidRows`，导出/删除/保留策略改为容错读取，坏行不再阻断无关范围操作。
