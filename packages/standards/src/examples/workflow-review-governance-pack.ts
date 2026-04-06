import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsPackStatus,
  StandardsRenderTarget,
  StandardsRuleSeverity,
} from '../constants/index.js';
import type { StandardsPack } from '../types/index.js';

/**
 * Provides one minimal reusable review-governance pack for adopters.
 */
export const workflowReviewGovernancePack: StandardsPack = {
  packId: 'pack.official.workflow-review',
  packVersion: '1.0.0',
  packSource: StandardsPackSource.OFFICIAL,
  scope: StandardsPackScope.GLOBAL,
  mergePrecedence: 10,
  status: StandardsPackStatus.ACTIVE,
  rules: [
    {
      ruleId: 'rule.workflow.review.cr-task-card',
      semanticKey: 'rule.workflow.review.cr-task-card',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '命中治理化 code review 时，必须为每一轮评审分配独立 `CR-xxx` 任务卡；不要复用实现任务 `TK-xxx`，并使用 `review_pending -> verified -> resolved` 状态空间。',
          [StandardsRenderTarget.AI]:
            'When review is governed, allocate a dedicated `CR-xxx` task card for each review round instead of reusing `TK-xxx`, and use the `review_pending -> verified -> resolved` lifecycle.',
          [StandardsRenderTarget.AGENTS]:
            'Allocate one dedicated `CR-xxx` task card for each governed review round; never reuse `TK-xxx`, and use `review_pending -> verified -> resolved`.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'When code review is governed, allocate a dedicated `CR-xxx` task card for each review round instead of reusing `TK-xxx`, and keep the lifecycle in `review_pending -> verified -> resolved`.',
          [StandardsRenderTarget.AI]:
            'When review is governed, allocate a dedicated `CR-xxx` task card for each review round instead of reusing `TK-xxx`, and use the `review_pending -> verified -> resolved` lifecycle.',
          [StandardsRenderTarget.AGENTS]:
            'Allocate one dedicated `CR-xxx` task card for each governed review round; never reuse `TK-xxx`, and use `review_pending -> verified -> resolved`.',
        },
      },
    },
    {
      ruleId: 'rule.workflow.review.lifecycle-sync',
      semanticKey: 'rule.workflow.review.lifecycle-sync',
      severity: StandardsRuleSeverity.REQUIRED,
      enabled: true,
      localizedTemplates: {
        'zh-CN': {
          [StandardsRenderTarget.HUMAN]:
            '推进评审状态时，需在同一变更中同步 `CR-xxx` 任务卡、review 文档、`tasks/checklist.md` 与 `tasks/tasks.csv`；若开启新一轮 fresh review，必须分配新的 `CR-xxx`，不要重开已 `resolved` 的旧 CR。',
          [StandardsRenderTarget.AI]:
            'Sync the `CR-xxx` task card, review document, `tasks/checklist.md`, and `tasks/tasks.csv` in the same change; allocate a new `CR-xxx` for each fresh review round instead of reopening a resolved one.',
          [StandardsRenderTarget.AGENTS]:
            'Sync `CR-xxx`, review docs, `tasks/checklist.md`, and `tasks/tasks.csv` in the same change; allocate a new `CR-xxx` for each fresh round instead of reopening a resolved one.',
        },
        'en-US': {
          [StandardsRenderTarget.HUMAN]:
            'When review state advances, sync the `CR-xxx` task card, review document, `tasks/checklist.md`, and `tasks/tasks.csv` in the same change; if a fresh review round starts, allocate a new `CR-xxx` instead of reopening a resolved one.',
          [StandardsRenderTarget.AI]:
            'Sync the `CR-xxx` task card, review document, `tasks/checklist.md`, and `tasks/tasks.csv` in the same change; allocate a new `CR-xxx` for each fresh review round instead of reopening a resolved one.',
          [StandardsRenderTarget.AGENTS]:
            'Sync `CR-xxx`, review docs, `tasks/checklist.md`, and `tasks/tasks.csv` in the same change; allocate a new `CR-xxx` for each fresh round instead of reopening a resolved one.',
        },
      },
    },
  ],
};
