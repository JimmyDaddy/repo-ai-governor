# Repo AI Governor `upgrade` 分析、受控提交与回滚契约（Draft）

- Status: draft
- Date: 2026-04-04
- Scope: CLI upgrade analyze preview / explicit confirm / controlled apply / rollback snapshot / post-apply verification
- Target Module IDs:
  - `runtime.cli-interactive-shell`
  - `runtime.durable-storage`
- Implementation Surfaces:
  - `apps/cli`
  - `packages/shared`
  - `packages/config`
- Related:
  - `.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/contracts/registry-and-ledger-projection-contract.md`
  - `apps/cli/src/commands/upgrade-command.ts`
  - `packages/config/src/upgrade-schema-diff-service.ts`

## 1. 背景与问题

当前 `upgrade` 已经具备一条 analyze-only 基线：

1. 读取现有 config
2. 计算 schema diff
3. 生成 report
4. 生成 auto-migrated candidate
5. 保留 rollback snapshot

但它还没有正式完成以下用户预期：

1. 在 analyze 之后进入受控 apply
2. 对高风险 diff 做显式 confirmation gating
3. 在 apply 后给出 verify 结论
4. 在 verify 失败或用户反悔时做 rollback

因此当前 `upgrade` 更像“升级分析器”，还不是“受控升级能力”。

## 2. 目标

本契约的目标是把 `upgrade` 从 analyze-only 升级为正式的双阶段能力：

1. `analyze preview`
2. `explicit confirm + controlled apply`

具体目标：

1. analyze 结果必须结构化表达 source/target 版本、diff、confirmation item 与 rollback reference。
2. apply 只能在 preview 之后、显式确认之后发生。
3. upgrade apply 必须自带 rollback snapshot，不允许裸写当前 config。
4. apply 后必须有 verify 结果，不能只写完就结束。
5. shell 只负责呈现 preview/confirm/result，不拥有 config mutation truth。

## 3. 非目标

1. 不在第一阶段做隐式 direct apply。
2. 不自动迁移工作区内所有衍生文件或用户自定义资产。
3. 不跳过 rollback snapshot。
4. 不让 React shell 自己决定是否 apply。
5. 不把 `upgrade` 扩展成新的通用配置编辑器。

## 4. 归属判断

当前这份契约更适合作为 `runtime.cli-interactive-shell` 与 `runtime.durable-storage` 的跨模块 draft。

原因：

1. `upgrade` 是显式 CLI command surface，而不是 `session.main` conversation capability。
2. shell 负责 preview / confirm / progress presenter，但不拥有 upgrade decision truth。
3. rollback snapshot、apply receipt、verify artifact 的持久化边界，应由 durable artifact seam 承接。

如果后续引入独立的 config-governance module，再考虑把 owner 上提到专门模块。

## 5. 理想中的用法

理想中的 `upgrade` 应是受控双阶段流程：

1. 用户执行 `upgrade`
2. runtime 返回 analyze preview：
   - source version
   - target version
   - diff summary
   - confirmation items
   - auto-migrated candidate
   - rollback snapshot reference
3. 若只是查看风险，流程停在 preview
4. 若用户明确要求 apply，则必须进入 confirmation
5. 只有 confirmation 通过后，runtime 才写回 config
6. apply 后立即给出 verify 结果
7. 若 verify 失败或用户选择回退，可使用 rollback snapshot 恢复

## 6. 输入契约

### 6.1 有限集合治理

按 `CS-009` 与 `CS-033`，这里的 closed-set contract value 在正式实现时不应以内联 string-literal union 分散定义，而应集中落入共享常量或 enum。

建议边界：

1. analyze / apply / rollback 相关状态值集中管理在 `packages/shared/src/constants/**` 或对应 package 的 `src/constants/**`。
2. runtime truth 只存 machine-readable value，例如 `preview_only`、`needs_confirmation`、`rolled_back`。
3. shell 若要展示 ready / blocked / rolled back 之类用户可见文案，应通过 i18n 渲染，不把本地化字符串写回 artifact truth；新增文案时同步更新 `packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts`。

建议枚举骨架如下：

```ts
enum CliUpgradeApplyIntent {
  PREVIEW_ONLY = 'preview_only',
  PREVIEW_THEN_CONFIRM = 'preview_then_confirm',
}

enum CliUpgradeConfirmationDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

enum CliUpgradeConfirmationRequirement {
  ALLOW = 'allow',
  CONFIRM = 'confirm',
}

enum CliUpgradeApplyReadiness {
  READY = 'ready',
  NEEDS_CONFIRMATION = 'needs_confirmation',
  BLOCKED = 'blocked',
}

enum CliUpgradeApplyStatus {
  APPLIED = 'applied',
  REJECTED = 'rejected',
  VERIFY_FAILED = 'verify_failed',
  ROLLED_BACK = 'rolled_back',
}
```

建议最小请求结构如下：

```ts
interface CliUpgradeAnalyzeRequest {
  upgradeId: string;
  sourceConfigPath: string;
  targetVersion: string;
  applyIntent: CliUpgradeApplyIntent;
}

interface CliUpgradeApplyRequest {
  applyId: string;
  sourceUpgradeId: string;
  sourceConfigPath: string;
  autoMigratedConfigPath: string;
  rollbackSnapshotPath: string;
  confirmationDecision: CliUpgradeConfirmationDecision;
}
```

约束建议：

1. preview 与 apply 必须由同一 `upgradeId` 链接。
2. 若 confirmation items 中存在 blocking item，则未确认前不得 apply。
3. 若 rollback snapshot 丢失或损坏，apply 必须直接 blocked。

## 7. 输出契约

### 7.1 analyze preview

```ts
interface CliUpgradeAnalyzePreview {
  upgradeId: string;
  sourceVersion: string;
  targetVersion: string;
  diffCount: number;
  suggestionCount: number;
  confirmationRequirement: CliUpgradeConfirmationRequirement;
  confirmationItems: Array<{
    title: string;
    blocking: boolean;
    summary: string;
  }>;
  reportPath: string;
  autoMigratedConfigPath: string;
  rollbackSnapshotPath: string;
  applyReadiness: CliUpgradeApplyReadiness;
}
```

### 7.2 apply result

```ts
interface CliUpgradeApplyResult {
  applyId: string;
  sourceUpgradeId: string;
  status: CliUpgradeApplyStatus;
  appliedConfigPath?: string;
  rollbackSnapshotPath: string;
  verifySummary?: string;
  applyReceiptPath: string;
}
```

## 8. Artifact 规则

`upgrade` 应继续保留 artifact-first 轨迹，但要区分“preview artifact”和“正式 apply truth”。

### 8.1 preview artifacts

1. `*.report.json`
2. `*.auto-migrated-config.json`
3. `*.rollback-snapshot.yaml`

### 8.2 apply / verify artifacts

建议在后续 phase 中新增：

1. `*.apply-receipt.json`
2. `*.verify.json`
3. 必要时 `*.rollback-receipt.json`

### 8.3 真值约束

1. 当前 config file 在确认 apply 前仍是唯一真值
2. auto-migrated candidate 只是候选，不是新真值
3. rollback snapshot 是 apply 的必要前置，不是可选附件

## 9. Confirmation 与回滚契约

`upgrade` 的 mutation path 默认必须走 `preview + explicit confirm`。

推荐规则：

1. analyze-only 是默认入口
2. 有 confirmation item 时，必须人工确认
3. apply 后若 verify 失败，应至少提供一键可执行的 rollback reference
4. rollback 应保留 receipt，而不是只让用户自己推断“已经恢复”

第一阶段不建议支持：

1. 无 preview 的 direct apply
2. 无 rollback snapshot 的 apply

## 10. 与现有实现的关系

当前 `apps/cli/src/commands/upgrade-command.ts` 已经完成：

1. analyze
2. report
3. auto-migrated candidate
4. rollback snapshot

这是正确的第一步。

但这些产物当前仍主要停留在“供人查看”的分析层，而不是正式的 apply/verify state machine。

因此后续不应推倒重来，而应在现有 analyze artifact 基础上继续补：

1. explicit confirm
2. controlled apply
3. post-apply verify
4. rollback receipt

## 11. 边界规则

### 11.1 与 `init` 的边界

1. `init` 负责创建初始 config / workspace baseline
2. `upgrade` 负责已有 config 的版本升级

两者不能混为“通用配置编辑命令”。

### 11.2 与 `workspace` 的边界

1. `workspace` 负责工作区迁移 / rollback
2. `upgrade` 负责 schema/config 升级

二者都需要 rollback，但 rollback 对象不同。

### 11.3 与 shell 的边界

1. shell 只呈现 preview、confirmation、apply result 与 rollback hint
2. shell 不拥有 schema diff truth、apply policy 或 rollback truth

## 12. 分阶段实现建议

### Phase A

冻结 analyze preview contract：

1. source/target version
2. diff / suggestion / confirmation items
3. rollback snapshot reference

### Phase B

补齐 explicit confirm + controlled apply：

1. 只有确认后才能 apply
2. apply 必须生成 receipt
3. apply 结果必须结构化返回

### Phase C

补齐 post-apply verify 与 rollback：

1. apply 后自动验证
2. verify 失败时支持 rollback
3. rollback 也生成正式 receipt

## 13. 与 CLI 能力成熟度分析 draft 的关系

这份 draft 是
`.repo-ai-governor/draft/cli-capability-maturity-and-baseline-enhancement-priority-analysis.md`
中 `upgrade` 薄基线判断的专项 follow-up。

两者分工如下：

1. 分析文回答：为什么 `upgrade` 在 ROI 上排第一。
2. 本文回答：既然要补 `upgrade`，第一批 contract 到底该补哪些 preview/apply/rollback 边界。

立项时建议至少核对：

1. 本期是否仍限定在 analyze/apply/rollback，而不是扩展成通用配置编辑器。
2. preview 是否仍然是 apply 的强前置。
3. rollback snapshot 与 apply receipt 是否被当作必备 artifact。
4. 是否把 shell presenter 与 config mutation truth 清楚分层。

## 14. 最终建议

`upgrade` 的理想形态应是：

1. 先 analyze preview
2. 再 explicit confirm
3. 再 controlled apply
4. 最后 verify / rollback

这样既能复用当前 analyze-only 基线，又不会把高风险升级动作过早做成隐式写回。
