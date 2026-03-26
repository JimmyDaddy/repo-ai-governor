# Code Review: Working Tree Optional Plugin Mode And Release Gate Alignment

- Status: verified
- Date: 2026-03-26
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
1. `package.json`
2. `scripts/release/check-release-ready.js`
3. `scripts/release/verify-local-distribution.js`
4. `scripts/release/verify-cleanroom-local-install.js`
5. `scripts/build/copy-runtime-assets.js`
6. `packages/memory-provider-registry/src/memory-provider-registry.ts`
7. `.repo-ai-governor/context/current-context.md`
8. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md`
9. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/plan.md`
10. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-173-plugin-enabled-distribution-cleanroom-examples-and-release-gate-expansion.md`
11. `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-174-sprint-003-exit-acceptance-and-sprint-004-service-reuse-input-constraints.md`

## 2. Findings
### 2.1 [P1] GA release path still does not enforce the new plugin-enabled verification chain
- 位置: `package.json:109`, `package.json:117`, `scripts/release/check-release-ready.js:29`, `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-173-plugin-enabled-distribution-cleanroom-examples-and-release-gate-expansion.md:10`, `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-174-sprint-003-exit-acceptance-and-sprint-004-service-reuse-input-constraints.md:16`
- 问题描述: 这批改动已经把 `plugin-enabled distribution` 描述成正式独立验证面，并新增了 `release:verify-local:plugin-enabled` 与 `release:verify-cleanroom-local-install:plugin-enabled`。但真正的 GA 候选入口 `release:candidate` 仍只跑 default distribution 的 `release:verify-local` 和 default clean-room 校验，完全没有调用任何 plugin-enabled 验证脚本；`check-release-ready.js` 也只是检查脚本名存在，不会强制 GA 路径使用它们。
- 影响: 当前 release 流程仍然可以在没有任何 plugin-enabled 回归验证的情况下通过并产出候选版本，和 `DA-173/DA-174` 中“plugin-enabled distribution 已建立正式 release gate” 的结论不一致。这样后续对 optional plugin mode 的回归会直接绕过真正的发布门禁。
- 建议: 把 plugin-enabled local verify 与 clean-room verify 纳入 `release:candidate` / `release:ga-check` 的必跑链路，或者明确收窄对外契约，把 plugin-enabled 验证降级为非 GA 强制项，避免文档继续宣称它已经进入正式 release gate。

### 2.2 [P2] Completed sprint remains the active primary stream
- 位置: `.repo-ai-governor/context/current-context.md:5`, `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/plan.md:3`
- 问题描述: `current-context.md` 仍把 `project-015 / sprint-003-optional-plugin-mode-and-policy-hardening` 作为 active primary stream，但 sprint plan 和 project plan 都已经把这轮写成 `completed`。这和 `current-context` 自己的 update rule 冲突：completed stream 应移出 `Active Streams`，除非另有显式 `Worktree Review Target` 或 follow-up stream。
- 影响: 后续默认任务台账、CR 路由和执行记录会继续落到一个已收尾 sprint 上，重新引入仓库前面刚修过的 stream ownership drift。
- 建议: 二选一收口。要么在当前交付窗口内把 sprint-003 保持为 active，直到下一个 sprint 真正切流；要么立刻把 `current-context` 切到新的 active/planned stream，并把 sprint-003 迁入 completed history。

## 3. Notes
1. 按用户显式要求，本次报告继续写入 `project-015 / sprint-002` 的 `review/` 目录，不使用 `current-context` 中的默认 `sprint-003` 路由。
2. 本次没有把 plugin module allowlist、factory contract 或 clean-room plugin scenario 本身列为问题；当前看到的主要风险在于“声明为正式 release gate”与“真实 GA 门禁链路”之间仍有断层。

## 4. Verification
1. `git status --short`（通过）
2. `git diff --stat`（通过）
3. `git diff --name-only --diff-filter=ACMR`（通过）
4. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
5. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts packages/config/test/config.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-26）

- 整体结论：**不认可**

### 逐条复核
1. `2.1`
   - 判定：**不认可**
   - 证据：`package.json:118` 现在已经把 `release:verify-local:plugin-enabled`、`release:verify-cleanroom-local-install:plugin-enabled` 和对应 tgz 校验串进 `release:candidate`；[check-release-ready.js](/Users/jimmydaddy/study/ai-governor/scripts/release/check-release-ready.js) 也同步要求这些脚本存在。
   - 处理：plugin-enabled distribution 的验证链路已经进入当前 GA candidate 路径，原 finding 描述的 release-gate 缺口不再成立。

2. `2.2`
   - 判定：**不认可**
   - 证据：`current-context.md:5-14` 当前 primary 已切到 `project-015 / sprint-004-shared-loader-and-service-reuse`；同时 [project-015 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md#L38) 仍把 `sprint-003` 保持为 `completed`。
   - 处理：active stream 已经从 completed sprint 迁出，原 finding 描述的 stream ownership drift 现在也不成立。

### 验证命令
1. `nl -ba package.json | sed -n '108,120p'`（通过）
2. `nl -ba scripts/release/check-release-ready.js | sed -n '29,46p'`（通过）
3. `nl -ba .repo-ai-governor/context/current-context.md | sed -n '1,20p'`（通过）
4. `nl -ba .repo-ai-governor/context/dev/project-015-memory-provider-pluginization/plan.md | sed -n '36,46p'`（通过）
