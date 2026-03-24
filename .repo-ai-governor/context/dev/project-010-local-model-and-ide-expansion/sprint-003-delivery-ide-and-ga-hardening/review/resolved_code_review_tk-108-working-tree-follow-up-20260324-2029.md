# Code Review: TK-108 Working Tree Follow-Up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-108`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `package.json`
2. `turbo.json`
3. `scripts/ci/run-stage9-blackbox-ga-baseline.js`
4. `scripts/ci/stage9-blackbox-ga-lib.js`
5. `scripts/release/check-ga-candidate-unified-gate.js`
6. `scripts/release/check-release-ready.js`
7. `scripts/release/release-governance-policy.json`
8. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`
9. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`

## 2. Findings

### 2.1 [P1] `minimumAuditEvidence` 新增 Stage 9 key 后，rollback rehearsal / unified gate 会稳定失败

- 位置: `scripts/release/release-governance-policy.json:34`, `scripts/release/run-rollback-rehearsal.js:14`, `scripts/release/run-rollback-rehearsal.js:151`
- 问题描述: 本轮把 `stage9_blackbox_ga_report` 加入了 `minimumAuditEvidence`，但 rollback rehearsal 仍只为 `release_check_report`、`distribution_verify_result`、`channel_promotion_record` 三类证据建立 scenario mapping。`run-rollback-rehearsal.js` 在所有场景成功后会逐项校验 `minimumAuditEvidence`，因此现在会命中 `rollback rehearsal evidence is missing "stage9_blackbox_ga_report"`。而 `release:ga-candidate-unified-gate` 又把 `rollback-rehearsal` 作为必跑 step，这会让 TK-108 声称已经加固的 unified gate 在真实执行时落入失败路径。
- 影响: Stage 9 GA 证据要求一旦被 release chain 真正消费，GA candidate unified gate 将无法通过，release baseline 与任务结论不一致。
- 建议: 要么为 `stage9_blackbox_ga_report` 增加对应 rehearsal evidence 采集/映射，要么在 rollback rehearsal 能消费该证据前，不要把它并入共享的 `minimumAuditEvidence` 集合。

### 2.2 [P2] release governance spec 没有同步 Stage 9 GA 证据新基线

- 位置: `scripts/release/release-governance-policy.json:20`, `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md:59`, `.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md:78`
- 问题描述: policy JSON 已把 GA promotion criteria 扩展为包含 `stage9 blackbox ga baseline report available`，并把 `stage9_blackbox_ga_report` 纳入 `minimumAuditEvidence`；但 release governance spec 仍只描述旧的 GA criteria 和三类 audit evidence。该规范自己的 `Update Protocol` 明确要求 release channels / rollback policy 变更时同步更新 spec，因此当前变更已经形成正式规范漂移。
- 影响: 后续按 spec 做发布检查、审计回放或人工复核时，会漏掉 Stage 9 这条新的 GA 约束，导致实现、台账与规范不一致。
- 建议: 同步更新 spec 的 `3.3 GA`、`4.2 Minimum Audit Evidence`、`4.3 Rehearsal Execution Baseline`，或者回退 policy 里的新增条目，直到规范和执行面一起落地。

## 3. Notes

1. 你贴出来的旧 finding（`approve` 不恢复 deferred inline review stages）不属于本轮 `TK-108` working tree 的主要风险点；当前 Stage 9 blackbox 场景已经在专门覆盖 HITL resume 路径。

## 4. Verification

1. `git diff -- package.json turbo.json scripts/release/check-ga-candidate-unified-gate.js scripts/release/check-release-ready.js scripts/release/release-governance-policy.json test/e2e/blackbox-governance-flow.e2e.test.ts`
2. `git diff -- .repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md .repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md .repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/checklist.md .repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/tasks.csv .repo-ai-governor/context/artifact-registry/artifacts.csv .repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`
3. `rg -n "stage9_blackbox_ga|minimumAuditEvidence|promotionCriteria" -S .repo-ai-governor scripts test package.json`
4. `node --input-type=module -e "<policy.minimumAuditEvidence vs rollback rehearsal requiredEvidence mapping>"`（输出确认缺少 `stage9_blackbox_ga_report` 映射）

## 复核结论（2026-03-24）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P1] minimumAuditEvidence 新增 Stage 9 key 后，rollback rehearsal / unified gate 会稳定失败`
   - 判定：**认可**
   - 证据：`scripts/release/run-rollback-rehearsal.js` 原先只接受 scenario-produced evidence，无法消费新增的 `stage9_blackbox_ga_report`；实跑 `pnpm run release:rollback-rehearsal` 会因此落入缺证据失败路径。
   - 处理：在 `release-governance-policy.json` 增加 `auditEvidenceSources.stage9_blackbox_ga_report`，并让 `run-rollback-rehearsal.js` / `check-ga-candidate-unified-gate.js` 共同消费同一 report source，且统一要求 `status=passed`。

2. `2.2 [P2] release governance spec 没有同步 Stage 9 GA 证据新基线`
   - 判定：**认可**
   - 证据：`release-governance-policy.json` 已引入 Stage 9 GA criteria 与 `minimumAuditEvidence`，而 `release-governance-spec.md` 仍停留在旧的三类 evidence 口径。
   - 处理：同步更新 `release-governance-spec.md` 的 GA criteria、Minimum Audit Evidence、Rehearsal Baseline 与 Unified Gate Supporting Report 说明。

### 验证命令

1. `pnpm run release:rollback-rehearsal`（通过）
2. `pnpm run release:ga-candidate-unified-gate`（通过）

## 修复执行记录（2026-03-24）

1. `2.1 [P1] minimumAuditEvidence 新增 Stage 9 key 后，rollback rehearsal / unified gate 会稳定失败`：已完成
   - 变更文件：`scripts/release/release-governance-policy.json`、`scripts/release/run-rollback-rehearsal.js`、`scripts/release/check-ga-candidate-unified-gate.js`、`scripts/release/check-release-ready.js`
   - 验证：`pnpm run release:rollback-rehearsal`、`pnpm run release:ga-candidate-unified-gate`（通过）
   - 说明：`rollback rehearsal` 已能读取外部 Stage 9 report 证据，unified gate 也会校验同一份 supporting report 的 `passed` 状态。

2. `2.2 [P2] release governance spec 没有同步 Stage 9 GA 证据新基线`：已完成
   - 变更文件：`.repo-ai-governor/normative_knowledge_sources/governance/release-governance-spec.md`、`.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/TK-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`、`.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/tasks/DA-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`
   - 验证：`pnpm run release:ga-candidate-unified-gate`（通过）
   - 说明：规范、任务卡、产物文档与 release policy 已回到统一口径，不再存在 Stage 9 GA evidence 漂移。
