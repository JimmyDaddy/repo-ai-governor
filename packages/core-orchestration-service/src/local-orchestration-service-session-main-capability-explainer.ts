import {
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_RUNTIME_CONFIG,
  GovernorErrorCode,
  I18nRuntime,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  SESSION_MAIN_CAPABILITY_ANSWER_KIND,
  SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS,
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_HANDOFF_EXECUTION_MODE,
} from './constants/index.js';
import { LocalOrchestrationServiceSessionMainCapabilityCatalog } from './local-orchestration-service-session-main-capability-catalog.js';
import type {
  SessionMainCapabilityAnswer,
  SessionMainCapabilityAvailability,
  SessionMainCapabilityId,
  SessionMainCapabilitySuggestedAction,
} from './types/index.js';

const SESSION_MAIN_OVERVIEW_PATTERNS = [
  /what can you do(?: here)?/iu,
  /what can i ask(?: here)?/iu,
  /which (?:commands|capabilities) (?:are available|can i use)/iu,
  /有哪些(?:能力|命令|功能)/u,
  /能做什么/u,
  /可以做什么/u,
  /有什么(?:能力|功能)/u,
] as const;

const SESSION_MAIN_DETAIL_PATTERNS = [
  /tell me about/iu,
  /what is/iu,
  /explain/iu,
  /how does/iu,
  /介绍一下/u,
  /说说/u,
  /讲讲/u,
  /解释一下/u,
] as const;

const SESSION_MAIN_EXAMPLE_PATTERNS = [
  /example/iu,
  /examples/iu,
  /how to use/iu,
  /sample prompt/iu,
  /示例/u,
  /例子/u,
  /怎么用/u,
  /如何使用/u,
] as const;

const SESSION_MAIN_COMPARISON_PATTERNS = [
  /compare/iu,
  /difference/iu,
  /different/iu,
  /versus/iu,
  /\bvs\b/iu,
  /区别/u,
  /不同/u,
  /对比/u,
] as const;

const SESSION_MAIN_CAPABILITY_REFERENCE_RULES = [
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
    patterns: [/review[- ]verify/iu, /\/review verify/iu, /复核/u, /cr verify/iu],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
    patterns: [/\bcode review\b/iu, /(?<![/\w-])review(?![-\w])/iu, /评审/u, /审查/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.CONNECT,
    patterns: [/\bconnect\b/iu, /接入/u, /接上/u, /连接/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
    patterns: [/\bdoctor\b/iu, /\bdiagnose\b/iu, /诊断/u, /体检/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.VERIFY,
    patterns: [/\bverify\b/iu, /\bvalidate\b/iu, /验证/u, /校验/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
    patterns: [/\bworkflow\b/iu, /流程/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
    patterns: [/\bplan\b/iu, /计划/u, /拆任务/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
    patterns: [/\brun\b/iu, /\bexecute\b/iu, /执行/u, /开始做/u, /实现/u],
  },
  {
    capabilityId: SESSION_MAIN_CAPABILITY_ID.HELP,
    patterns: [/\bhelp\b/iu, /帮助/u],
  },
] as const;

const SESSION_MAIN_OVERVIEW_LIST_CAPABILITY_IDS = [
  SESSION_MAIN_CAPABILITY_ID.CONNECT,
  SESSION_MAIN_CAPABILITY_ID.DOCTOR,
  SESSION_MAIN_CAPABILITY_ID.VERIFY,
  SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
  SESSION_MAIN_CAPABILITY_ID.PLAN,
  SESSION_MAIN_CAPABILITY_ID.REVIEW,
  SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
  SESSION_MAIN_CAPABILITY_ID.RUN,
] as const;

const SESSION_MAIN_DETAIL_SUGGESTED_ACTION_LIMIT = 3;
const SESSION_MAIN_CAPABILITY_ASSISTANT_DELTA_MAX_LENGTH = 80;

/**
 * Owns deterministic capability explanation classification and answer generation for `session.main`.
 *
 * Why this exists:
 * capability explanation needs to be a first-class answer route that reuses the orchestration-owned
 * catalog truth, instead of being swallowed by skill-intent routing or ad-hoc help prose.
 */
export class LocalOrchestrationServiceSessionMainCapabilityExplainer {
  private readonly capabilityCatalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();
  private readonly translateRuntimeCache = new Map<
    string,
    Promise<{
      resolvedLocale: string;
      runtime: I18nRuntime;
    }>
  >();

  /**
   * Resolves one user message into a structured capability explanation answer when applicable.
   * @param userMessage Raw user message.
   * @param options Active locale plus optional runtime-exported availability overlays.
   * @returns Structured capability answer or `null` when the message should continue on other routes.
   */
  public async resolveAnswer(
    userMessage: string,
    options?: {
      locale?: string;
      availabilityOverlay?: readonly SessionMainCapabilityAvailability[];
    },
  ): Promise<SessionMainCapabilityAnswer | null> {
    const normalizedMessage = userMessage.trim();
    if (normalizedMessage.length === 0) {
      return null;
    }

    const translate = await this.resolveTranslate(options?.locale);
    const referencedCapabilityIds = this.resolveReferencedCapabilityIds(normalizedMessage);
    const availabilityByCapabilityId = new Map(
      (options?.availabilityOverlay ?? []).map((availability) => [
        availability.capabilityId,
        availability,
      ]),
    );

    if (
      referencedCapabilityIds.length === 0 &&
      !this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_OVERVIEW_PATTERNS)
    ) {
      return null;
    }

    if (
      this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_COMPARISON_PATTERNS) &&
      referencedCapabilityIds.length >= 2
    ) {
      return this.createComparisonAnswer(
        referencedCapabilityIds.slice(0, 2),
        translate,
        availabilityByCapabilityId,
      );
    }

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_EXAMPLE_PATTERNS)) {
      if (referencedCapabilityIds.length === 0) {
        return this.createOverviewAnswer(translate, availabilityByCapabilityId);
      }

      return this.createExamplesAnswer(
        referencedCapabilityIds[0],
        translate,
        availabilityByCapabilityId,
      );
    }

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_DETAIL_PATTERNS)) {
      if (referencedCapabilityIds.length === 0) {
        return this.createOverviewAnswer(translate, availabilityByCapabilityId);
      }

      return this.createDetailAnswer(
        referencedCapabilityIds[0],
        translate,
        availabilityByCapabilityId,
      );
    }

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_OVERVIEW_PATTERNS)) {
      if (referencedCapabilityIds.length === 0) {
        return this.createOverviewAnswer(translate, availabilityByCapabilityId);
      }

      return this.createDetailAnswer(
        referencedCapabilityIds[0],
        translate,
        availabilityByCapabilityId,
      );
    }

    return null;
  }

  private createOverviewAnswer(
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
  ): SessionMainCapabilityAnswer {
    const capabilityViews = SESSION_MAIN_OVERVIEW_LIST_CAPABILITY_IDS.map((capabilityId) =>
      this.requireDescriptorView(capabilityId, translate),
    );
    const assistantMessage = [
      translate(
        '__internal.heading.overview',
        '## Session Main Capability Overview',
        '## 主会话能力概览',
      ),
      '',
      translate(
        '__internal.overview.lead',
        'Here are the governed capabilities currently exposed from session.main:',
        '以下是 session.main 当前正式暴露的受治理能力：',
      ),
      '',
      ...capabilityViews.map(
        (capabilityView) =>
          `- \`${capabilityView.suggestedSlashCommand}\` ${capabilityView.title}: ${capabilityView.summary} ${this.formatOverviewAvailabilitySuffix(
            capabilityView.capabilityId,
            availabilityByCapabilityId,
            translate,
          )}`,
      ),
      '',
      translate(
        '__internal.overview.followUp',
        'Ask me to explain one capability in more detail, show examples, or compare two capabilities.',
        '你可以继续让我详细解释某个能力、给示例，或比较两个能力的区别。',
      ),
    ].join('\n');

    return {
      answerKind: SESSION_MAIN_CAPABILITY_ANSWER_KIND.OVERVIEW,
      referencedCapabilityIds: [...SESSION_MAIN_OVERVIEW_LIST_CAPABILITY_IDS],
      suggestedActions: this.createSuggestedActions(
        capabilityViews,
        3,
        availabilityByCapabilityId,
        translate,
      ),
      assistantMessage,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      routerDecisionReason: 'session.main.router.capability_answer.overview',
    };
  }

  private createDetailAnswer(
    capabilityId: SessionMainCapabilityId,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
  ): SessionMainCapabilityAnswer {
    const capabilityView = this.requireDescriptorView(capabilityId, translate);
    const relatedCapabilityViews = this.capabilityCatalog.getDescriptorView(capabilityId, translate)
      ? this.listRelatedCapabilityViews(capabilityId, translate)
      : [];
    const availabilityLines = this.buildAvailabilityLines(
      capabilityId,
      availabilityByCapabilityId,
      translate,
    );
    const executionPathSummary =
      capabilityView.handoffExecutionMode === SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE
        ? translate(
            '__internal.execution.direct',
            'direct execute (no extra confirmation)',
            '直接执行（无需额外确认）',
          )
        : translate(
            '__internal.execution.confirm',
            'preview first, then confirm',
            '先预览，再确认执行',
          );
    const assistantMessage = [
      `## ${capabilityView.title}`,
      '',
      capabilityView.summary,
      '',
      capabilityView.detail,
      '',
      `${translate(
        '__internal.label.slash',
        'Suggested slash command:',
        '建议的 slash command：',
      )} \`${capabilityView.suggestedSlashCommand}\``,
      `${translate('__internal.label.execution', 'Execution path:', '执行路径：')} ${executionPathSummary}`,
      ...(availabilityLines.length > 0 ? ['', ...availabilityLines] : []),
      '',
      translate('__internal.label.examples', 'Example prompts:', '示例提示词：'),
      ...capabilityView.examplePrompts.map((examplePrompt) => `- ${examplePrompt}`),
      ...(relatedCapabilityViews.length > 0
        ? [
            '',
            translate('__internal.label.related', 'Related capabilities:', '相关能力：'),
            ...relatedCapabilityViews.map(
              (relatedCapabilityView) =>
                `- \`${relatedCapabilityView.suggestedSlashCommand}\` ${relatedCapabilityView.title}: ${relatedCapabilityView.summary}`,
            ),
          ]
        : []),
    ].join('\n');

    return {
      answerKind: SESSION_MAIN_CAPABILITY_ANSWER_KIND.DETAIL,
      referencedCapabilityIds: [capabilityId],
      suggestedActions: this.createSuggestedActions(
        [capabilityView, ...relatedCapabilityViews],
        SESSION_MAIN_DETAIL_SUGGESTED_ACTION_LIMIT,
        availabilityByCapabilityId,
        translate,
      ),
      assistantMessage,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      routerDecisionReason: 'session.main.router.capability_answer.detail',
    };
  }

  private createExamplesAnswer(
    capabilityId: SessionMainCapabilityId,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
  ): SessionMainCapabilityAnswer {
    const capabilityView = this.requireDescriptorView(capabilityId, translate);
    const availabilityLines = this.buildAvailabilityLines(
      capabilityId,
      availabilityByCapabilityId,
      translate,
    );
    const assistantMessage = [
      `## ${capabilityView.title}`,
      '',
      translate(
        '__internal.examples.lead',
        'Here are example prompts you can use for this capability:',
        '下面是这个能力可直接复用的示例提示词：',
      ),
      '',
      ...capabilityView.examplePrompts.map((examplePrompt) => `- ${examplePrompt}`),
      '',
      `${translate(
        '__internal.label.slash',
        'Suggested slash command:',
        '建议的 slash command：',
      )} \`${capabilityView.suggestedSlashCommand}\``,
      ...(availabilityLines.length > 0 ? ['', ...availabilityLines] : []),
    ].join('\n');

    return {
      answerKind: SESSION_MAIN_CAPABILITY_ANSWER_KIND.EXAMPLES,
      referencedCapabilityIds: [capabilityId],
      suggestedActions: this.createSuggestedActions(
        [capabilityView],
        1,
        availabilityByCapabilityId,
        translate,
      ),
      assistantMessage,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      routerDecisionReason: 'session.main.router.capability_answer.examples',
    };
  }

  private createComparisonAnswer(
    capabilityIds: readonly SessionMainCapabilityId[],
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
  ): SessionMainCapabilityAnswer {
    const capabilityViews = capabilityIds.map((capabilityId) =>
      this.requireDescriptorView(capabilityId, translate),
    );
    const assistantMessage = [
      translate('__internal.heading.comparison', '## Capability Comparison', '## 能力对比'),
      '',
      `${capabilityViews[0]?.title ?? ''} vs ${capabilityViews[1]?.title ?? ''}`,
      '',
      ...capabilityViews.flatMap((capabilityView) => [
        `### ${capabilityView.title}`,
        capabilityView.summary,
        `${translate(
          '__internal.label.slash',
          'Suggested slash command:',
          '建议的 slash command：',
        )} \`${capabilityView.suggestedSlashCommand}\``,
        `${translate('__internal.label.execution', 'Execution path:', '执行路径：')} ${
          capabilityView.handoffExecutionMode === SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE
            ? translate(
                '__internal.execution.direct',
                'direct execute (no extra confirmation)',
                '直接执行（无需额外确认）',
              )
            : translate(
                '__internal.execution.confirm',
                'preview first, then confirm',
                '先预览，再确认执行',
              )
        }`,
        ...this.buildAvailabilityLines(
          capabilityView.capabilityId,
          availabilityByCapabilityId,
          translate,
        ),
        '',
      ]),
      translate(
        '__internal.comparison.followUp',
        'If you want, I can next show examples for one of them or help you run the governed command.',
        '如果你愿意，我接下来可以继续给其中一个能力举例，或直接帮你走受治理命令。',
      ),
    ].join('\n');

    return {
      answerKind: SESSION_MAIN_CAPABILITY_ANSWER_KIND.COMPARISON,
      referencedCapabilityIds: [...capabilityIds],
      suggestedActions: this.createSuggestedActions(
        capabilityViews,
        capabilityViews.length,
        availabilityByCapabilityId,
        translate,
      ),
      assistantMessage,
      assistantDelta: this.createAssistantDelta(assistantMessage),
      routerDecisionReason: 'session.main.router.capability_answer.comparison',
    };
  }

  private createSuggestedActions(
    capabilityViews: readonly {
      capabilityId: SessionMainCapabilityId;
      title: string;
      suggestedSlashCommand: string;
    }[],
    limit: number,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ): SessionMainCapabilitySuggestedAction[] {
    const connectView = this.capabilityCatalog.getDescriptorView(
      SESSION_MAIN_CAPABILITY_ID.CONNECT,
      translate,
    );
    const suggestions: SessionMainCapabilitySuggestedAction[] = [];
    const seenTargets = new Set<string>();

    for (const capabilityView of capabilityViews) {
      if (suggestions.length >= limit) {
        break;
      }

      const availability = availabilityByCapabilityId.get(capabilityView.capabilityId);
      const targetSlashCommand =
        availability?.status === SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED &&
        connectView
          ? connectView.suggestedSlashCommand
          : capabilityView.suggestedSlashCommand;
      const label =
        availability?.status === SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED &&
        connectView
          ? connectView.title
          : capabilityView.title;

      if (seenTargets.has(targetSlashCommand)) {
        continue;
      }
      seenTargets.add(targetSlashCommand);
      suggestions.push({
        label,
        target: targetSlashCommand,
        suggestedSlashCommand: targetSlashCommand,
      });
    }

    return suggestions;
  }

  private formatOverviewAvailabilitySuffix(
    capabilityId: SessionMainCapabilityId,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ): string {
    const availability = availabilityByCapabilityId.get(capabilityId);
    if (!availability) {
      return '';
    }

    if (availability.status === SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED) {
      return translate(
        '__internal.availability.setupRequiredSuffix',
        '(needs /connect first)',
        '（需要先 /connect）',
      );
    }
    if (availability.status === SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.UNAVAILABLE) {
      return translate(
        '__internal.availability.unavailableSuffix',
        '(currently unavailable)',
        '（当前不可用）',
      );
    }
    return translate('__internal.availability.availableSuffix', '(ready now)', '（现在可执行）');
  }

  private buildAvailabilityLines(
    capabilityId: SessionMainCapabilityId,
    availabilityByCapabilityId: ReadonlyMap<
      SessionMainCapabilityId,
      SessionMainCapabilityAvailability
    >,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ): string[] {
    const availability = availabilityByCapabilityId.get(capabilityId);
    if (!availability) {
      return [];
    }

    const translatedStatus = this.translateAvailabilityStatus(availability.status, translate);
    const detailLines = [
      translate('__internal.label.availability', 'Current availability:', '当前可用性：'),
      `- ${translate('__internal.label.status', 'Status:', '状态：')} ${translatedStatus}`,
    ];
    const selectedByLabel = this.translateAvailabilitySelectionSource(
      availability.selectedBy,
      translate,
    );

    if (availability.selectedSurface) {
      detailLines.push(
        `- ${translate('__internal.label.surface', 'Suggested surface:', '建议 surface：')} \`${availability.selectedSurface}\`${selectedByLabel ? ` (${selectedByLabel})` : ''}`,
      );
    }
    if (availability.reason) {
      detailLines.push(
        `- ${translate('__internal.label.reason', 'Reason:', '原因：')} ${availability.reason}`,
      );
    }
    if (availability.suggestedNextStep) {
      detailLines.push(
        `- ${translate('__internal.label.nextStep', 'Suggested next step:', '建议下一步：')} \`${availability.suggestedNextStep}\``,
      );
    }

    return detailLines;
  }

  private translateAvailabilitySelectionSource(
    selectedBy: string | undefined,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ): string | null {
    if (!selectedBy) {
      return null;
    }

    if (selectedBy.startsWith('session.main.preference')) {
      return translate(
        '__internal.availability.selection.preferred',
        'preferred surface',
        '首选 surface',
      );
    }
    if (selectedBy === 'session.main.availability.fallback') {
      return translate(
        '__internal.availability.selection.fallbackAfterProbe',
        'fallback after availability probe',
        'availability 探测后的回退选择',
      );
    }
    if (selectedBy === 'session.main.availability.default') {
      return translate(
        '__internal.availability.selection.defaultGovernedSurface',
        'first ready governed surface',
        '首个就绪的受治理 surface',
      );
    }
    if (selectedBy === 'session.main.intent_router') {
      return translate(
        '__internal.availability.selection.intentRouter',
        'default routing preference',
        '默认路由偏好',
      );
    }

    return null;
  }

  private translateAvailabilityStatus(
    status: SessionMainCapabilityAvailability['status'],
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ): string {
    switch (status) {
      case SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.AVAILABLE:
        return translate('__internal.availability.available', 'ready now', '现在可执行');
      case SESSION_MAIN_CAPABILITY_AVAILABILITY_STATUS.SETUP_REQUIRED:
        return translate(
          '__internal.availability.setupRequired',
          'setup required',
          '需要先完成接入',
        );
      default:
        return translate(
          '__internal.availability.unavailable',
          'currently unavailable',
          '当前不可用',
        );
    }
  }

  private listRelatedCapabilityViews(
    capabilityId: SessionMainCapabilityId,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ) {
    const descriptorSeed = this.capabilityCatalog.getDescriptorSeed(capabilityId);
    if (descriptorSeed === null) {
      return [];
    }

    return descriptorSeed.relatedCapabilityIds
      .map((relatedCapabilityId) =>
        this.capabilityCatalog.getDescriptorView(relatedCapabilityId, translate),
      )
      .filter((descriptorView) => descriptorView !== null);
  }

  private requireDescriptorView(
    capabilityId: SessionMainCapabilityId,
    translate: (
      translationKey: string,
      fallbackEnglish?: string,
      fallbackChinese?: string,
    ) => string,
  ) {
    const descriptorView = this.capabilityCatalog.getDescriptorView(capabilityId, translate);
    if (descriptorView === null) {
      throw new RuntimeError(
        GovernorErrorCode.AGENTS_PROJECTION_INVALID,
        `Missing governed capability descriptor view for ${capabilityId}.`,
        {
          capabilityId,
        },
      );
    }

    return descriptorView;
  }

  private resolveReferencedCapabilityIds(userMessage: string): SessionMainCapabilityId[] {
    return [
      ...new Set(
        SESSION_MAIN_CAPABILITY_REFERENCE_RULES.flatMap((rule) =>
          rule.patterns.some((pattern) => pattern.test(userMessage)) ? [rule.capabilityId] : [],
        ),
      ),
    ];
  }

  private async resolveTranslate(requestedLocale?: string) {
    const { resolvedLocale, runtime } = await this.resolveTranslateRuntime(requestedLocale);
    const prefersChinese = resolvedLocale.toLowerCase().startsWith('zh');
    return (
      translationKey: string,
      fallbackEnglish = translationKey,
      fallbackChinese = translationKey,
    ) => {
      const value = runtime.t(translationKey);
      if (value !== translationKey) {
        return value;
      }

      return prefersChinese ? fallbackChinese : fallbackEnglish;
    };
  }

  private resolveTranslateRuntime(requestedLocale?: string) {
    const cacheKey = requestedLocale?.trim() || DEFAULT_I18N_FALLBACK_LOCALE;
    const existingRuntime = this.translateRuntimeCache.get(cacheKey);
    if (existingRuntime) {
      return existingRuntime;
    }

    const runtimePromise = (async () => {
      const runtime = new I18nRuntime();
      const resolvedLocale = await runtime.initialize(
        DEFAULT_I18N_RUNTIME_CONFIG,
        requestedLocale ?? DEFAULT_I18N_FALLBACK_LOCALE,
      );
      return {
        resolvedLocale,
        runtime,
      };
    })().catch((error) => {
      this.translateRuntimeCache.delete(cacheKey);
      throw error;
    });

    this.translateRuntimeCache.set(cacheKey, runtimePromise);
    return runtimePromise;
  }

  private matchesAnyPattern(message: string, patterns: readonly RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(message));
  }

  private createAssistantDelta(assistantMessage: string): string {
    const firstNonEmptyLine = assistantMessage
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return firstNonEmptyLine
      ? firstNonEmptyLine.slice(0, SESSION_MAIN_CAPABILITY_ASSISTANT_DELTA_MAX_LENGTH)
      : 'capability_answer';
  }
}
