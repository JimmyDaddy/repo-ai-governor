# Code Review: sprint-002 deprecated compact and archive integrity automation

- Status: resolved
- Date: 2026-04-11
- Reviewer: AI-Agent delegated reviewer
- Task: `CR-001`
- Review Type: sprint boundary review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `scripts/governance/normative-loading-manifest-canonical.js`
2. `scripts/governance/check-normative-loading-manifest-archive.js`
3. `scripts/governance/compact-normative-loading-manifest.js`
4. `scripts/governance/run-normative-loading-manifest-gate.js`
5. `scripts/governance/check-code-standards.js`
6. `test/normative-loading-manifest-lifecycle.integration.test.ts`
7. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
8. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
9. `.repo-ai-governor/normative_knowledge_sources/governance/normative-loading-manifest-lifecycle-governance.md`
10. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
11. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/plan.md`
12. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/tasks/`

## 2. Findings

### 2.1 [P2] Malformed `--today` falls back to the current date

- 位置: `scripts/governance/compact-normative-loading-manifest.js:55`
- 问题描述: `resolveToday()` 在 `parseIsoDate(value)` 失败时会静默退回到 `parseIsoDate(formatIsoDate(new Date()))`，因此非法 `--today` 仍会进入 compaction 规划/写入路径，而不是 fail fast。
- 影响: `--apply` 模式可能用操作者未预期的 wall-clock 日期归档文档，并把 `generated_at` 与 compaction notes 写成错误日期，破坏 monthly audit 与 `CS-025` 要求的时间真值。
- 建议: 非法 `--today` 应直接报错退出，并补充覆盖 dry-run / apply CLI 行为的回归测试。

## 3. Notes

1. delegated reviewer 未提出其他 actionable finding。
2. reviewer 额外提醒部分 archive-integrity 分支覆盖仍可继续加厚，但本轮不构成阻止 sprint-002 closeout 的独立 finding。

## 4. Verification

1. `pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）

## 复核结论（2026-04-11）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Malformed --today falls back to the current date`
   - 判定：**认可**
   - 证据：`scripts/governance/compact-normative-loading-manifest.js` 当前 `resolveToday()` 会在非法 `today` 输入下退回到当天日期；主代理已用临时 fixture 复现实验确认 `today='not-a-date'` 仍返回 `movedDocumentCount=1`，说明 write-path 不会 fail fast。
   - 处理：已将 strict date parsing 收敛为 shared helper，非法 `--today` 直接失败；同时补充 dry-run / apply CLI regression coverage，并清理新增 CLI 脚本的 import-time execution side effect。

### 验证命令

1. `node --input-type=module <<'NODE' ... compactNormativeLoadingManifest({ dryRun: false, today: 'not-a-date', writeOutputs: false }) ... NODE`（通过，复现当前缺陷）
2. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 修复执行记录（2026-04-11）

1. `2.1 [P2] Malformed --today falls back to the current date`：已完成
   - 变更文件：`scripts/governance/normative-loading-manifest-canonical.js`、`scripts/governance/compact-normative-loading-manifest.js`、`scripts/governance/check-normative-loading-manifest-archive.js`、`test/normative-loading-manifest-lifecycle.integration.test.ts`
   - 验证：`pnpm run build`（通过）；`pnpm exec vitest run test/normative-loading-manifest-lifecycle.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）；`node ./scripts/governance/check-normative-loading-manifest-archive.js --mode block`（通过）
   - 说明：非法 `--today` 现在会 fail fast，不再 silently 回退到 wall-clock date；shared date helper 同时保护 compaction 与 archive audit 路径，新增 CLI 入口只会在 direct execution 时运行，避免 import 时偷偷触发 gate。
