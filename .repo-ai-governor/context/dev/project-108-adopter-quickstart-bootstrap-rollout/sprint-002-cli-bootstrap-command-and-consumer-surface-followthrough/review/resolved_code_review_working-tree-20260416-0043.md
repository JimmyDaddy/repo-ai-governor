# Code Review: sprint-002 cli bootstrap command and consumer surface follow-through

- Status: resolved
- Date: 2026-04-16
- Reviewer: Hume (delegated AI-Agent sub-agent)
- Task: `CR-001`
- Review Type: delegated sprint review round 1
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`

## 1. Review Scope

1. `apps/cli/src/commands/adopt-command.ts`
2. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
3. `apps/cli/src/runtime/adoption-pack-runtime.ts`
4. `apps/cli/test/adopt-command.integration.test.ts`
5. `apps/cli/test/cli-skeleton.integration.test.ts`
6. `packages/shared/src/i18n/locales/en-us.ts`
7. `packages/shared/src/i18n/locales/zh-cn.ts`
8. `README.md`
9. `docs/local-adoption-playbook.md`
10. `docs/support-matrix.md`

## 2. Findings

### 2.1 [P2] Bootstrap success payload over-reported selected hosts

- 位置: `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts:597`
- 问题描述: round-1 implementation 在 bootstrap 成功结果中直接回填 `selection.profile.hostTargets`，没有沿用 `adopt apply` 后真实生效的 host target 集合。对于 host subset、partial materialization 或后续 staged host seams，这会让成功 payload 和 summary 对外宣称的目标多于实际写出的目标。
- 影响: quickstart summary、CLI result details 与后续 evidence packet 会高估实际命中的 host surface，破坏 installer quickstart 的 truthfulness 边界。
- 建议: 将实际生效的 host targets 从 apply/verify seam 贯穿回 bootstrap 结果，而不是始终回显 profile 默认值。

### 2.2 [P2] Ambiguous selector failure hid the actionable reason and leaked generic copy

- 位置: `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts:167`、`apps/cli/src/commands/adopt-command.ts:267`、`packages/shared/src/i18n/locales/en-us.ts:174`、`packages/shared/src/i18n/locales/zh-cn.ts:142`
- 问题描述: round-1 implementation 在 explicit selector 歧义导致 bootstrap fail-closed 时，没有把 standardized error 的具体原因透传给 CLI 输出，而是落回一个依赖 `packId` 插值的通用 blocker 文案。这样既隐藏了“为什么被阻断”的可执行原因，也让没有 `packId` 的场景只能显示泛化 copy。
- 影响: adopter 无法直接看到 ambiguity 的可执行处理方向，fail-closed 语义虽然保住了，但可诊断性明显不足。
- 建议: 在 bootstrap selection-failure 路径显式回传 standardized error message 作为 user-facing message，并补一个不依赖 `packId` 的 blocker i18n fallback。

### 2.3 [P3] Support matrix still positioned host export beneath preferred `adopt apply`

- 位置: `docs/support-matrix.md:75`
- 问题描述: support matrix 仍把 staged host export surface 描述成位于首选 `adopt apply` 之下，但当前 sprint 已经把对外 quickstart boundary 提升到 `adopt bootstrap`。文档口径落后于实际 public command truth。
- 影响: adopter 可能误解 host export 与 installer quickstart 的层级关系，进而在 public command surfaces 里选择错误入口。
- 建议: 将 support matrix 文案改为“位于首选 `adopt bootstrap` quickstart 之下，并与显式 `adopt apply` 安装面并列”。

## 3. Notes

1. 本报告记录 delegated reviewer round 1 的原始发现；主 agent 将在同一文件中追加复核结论与修复记录。
2. `pnpm -s tsc -p tsconfig.json --noEmit` 仍存在仓库级既有 test typing drift，本轮未观察到新的 sprint-002 source-surface 类型错误。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
5. `pnpm -s tsc -p tsconfig.json --noEmit`（失败：仓库既有 test typing drift，未见 sprint-002 新增 source-surface 错误）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：bootstrap result 现已通过 `effectiveHostTargets` 把实际命中的 host targets 从 apply seam 回传到最终 payload，`buildBootstrapResult()` 不再无条件回显 profile 默认 targets。
   - 处理：主 agent 接受该 finding，并将真实生效的 host target 集合贯穿回 bootstrap 成功结果。

2. `2.2`
   - 判定：**认可**
   - 证据：selection-failure 路径现已把 `standardizedError.message` 填入 `userFacingMessage`，`AdoptionOperationResult` 与 `CliAdoptCommand.resolveMessage()` 会优先展示该 message；同时新增了不依赖 `packId` 的 generic blocker i18n fallback。
   - 处理：主 agent 接受该 finding，并将 ambiguity fail-closed 的可执行原因恢复到 CLI 用户输出。

3. `2.3`
   - 判定：**认可**
   - 证据：support matrix 已把 host export / verify / pack 重新定位为位于首选 `adopt bootstrap` quickstart 之下，并与显式 `adopt apply` 安装面并列。
   - 处理：主 agent 接受该 finding，并同步修正文档 truthfulness 表述。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-docs-triad-sync.js`（通过）
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）
5. `pnpm -s tsc -p tsconfig.json --noEmit`（失败：仓库既有 test typing drift，未见 sprint-002 新增 source-surface 错误）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm -s tsc -p tsconfig.json --noEmit`（失败：仓库既有 test typing drift，未见本 finding 新引入的 source-surface 类型错误）
   - 说明：bootstrap 成功结果已改为优先回传 `effectiveHostTargets`，避免把 profile 默认 host targets 误报为实际已命中目标。

2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/adoption-pack-runtime.ts`、`apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`、`apps/cli/src/commands/adopt-command.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/adopt-command.integration.test.ts apps/cli/test/commands/adopt-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）；`pnpm -s tsc -p tsconfig.json --noEmit`（失败：仓库既有 test typing drift，未见本 finding 新引入的 source-surface 类型错误）
   - 说明：bootstrap fail-closed blocker 现已优先透传 standardized error message，并为缺失 `packId` 插值的场景补齐 generic i18n fallback。

3. `2.3`：已完成
   - 变更文件：`docs/support-matrix.md`
   - 验证：`node ./scripts/governance/check-docs-triad-sync.js`、`node ./scripts/governance/check-normative-loading-manifest.js --mode block`（通过）；同窗口 `pnpm run build` 与定向 vitest 已提供本轮 code-affecting closeout 所需 build/test 证据
   - 说明：support matrix 已改为把 host export / verify / pack 放在首选 `adopt bootstrap` quickstart 之下，并与显式 `adopt apply` 并列。
