import type { AdapterSurface } from '@repo-ai-governor/shared';
import { SESSION_MAIN_HANDOFF_EXECUTION_MODE } from './constants/index.js';
import type {
  SessionMainHandoffExecutionMode,
  SessionMainSupervisorCommandBatch,
  SessionMainSupervisorTurnBacklink,
} from './types/index.js';

const SESSION_MAIN_SKILL_VERSION = '2026-04-01';
const SESSION_MAIN_CONNECT_KEYWORDS = ['connect', '连接', '连一下', '接上', '接好'];
const SESSION_MAIN_DOCTOR_KEYWORDS = [
  'doctor',
  'diagnose',
  'health',
  'check environment',
  '体检',
  '诊断',
];
const SESSION_MAIN_VERIFY_KEYWORDS = ['verify', 'validation', 'validate', '验证', '校验'];
const SESSION_MAIN_PLAN_KEYWORDS = ['plan', 'planning', 'break down', 'task breakdown', '拆任务'];
const SESSION_MAIN_REVIEW_KEYWORDS = ['review', 'cr', 'code review', '审查'];
const SESSION_MAIN_REVIEW_VERIFY_KEYWORDS = ['review verify', 'verify review', '复核', 'cr verify'];
const SESSION_MAIN_RUN_KEYWORDS = ['run', 'execute', 'ship', 'implement', '开始做', '实现'];
const SESSION_MAIN_ONBOARDING_PATTERNS = [
  /adapter onboarding/iu,
  /connect\s+(?:and|then)\s+verify/iu,
  /接上.*验证/iu,
  /把.*connect.*verify.*走一遍/iu,
];

interface SessionMainForegroundSkillPlan {
  skillId: string;
  skillVersion: string;
  executionIntent: string;
  suggestedSlashCommand: string;
  routerDecisionReason: string;
  handoffExecutionMode: SessionMainHandoffExecutionMode;
  commandBatches: SessionMainSupervisorCommandBatch[];
  handoffCommandPreview: string;
  handoffBacklinks: SessionMainSupervisorTurnBacklink[];
}

/**
 * Owns deterministic natural-language skill matching for the foreground `session.main` route.
 *
 * Why this exists:
 * conversational skill routing should stay predictable and testable instead of being scattered
 * across ad-hoc keyword checks inside the dispatcher.
 */
export class LocalOrchestrationServiceSessionMainSkillRegistry {
  /**
   * Resolves one natural-language request into a deterministic foreground skill plan.
   * @param userMessage Raw user message after role-mention handling is applied by the dispatcher.
   * @param options Preference and routing context used to shape preview/argv output.
   * @returns Structured skill plan or `null` when the message should continue on the answer path.
   */
  public resolvePlan(
    userMessage: string,
    options: {
      preferredSurface: AdapterSurface | null;
      configuredRoleMentionPresent: boolean;
    },
  ): SessionMainForegroundSkillPlan | null {
    const normalizedMessage = userMessage.trim().toLowerCase();

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_ONBOARDING_PATTERNS)) {
      return this.createPlan({
        skillId: 'skill.onboard.adapters',
        executionIntent: 'skill.onboard.adapters',
        suggestedSlashCommand: 'adapter onboarding bundle',
        routerDecisionReason: 'session.main.router.command_bundle.onboard_adapters',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        commandBatches: [
          this.createCommandBatch(
            '/connect',
            ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
            options.preferredSurface,
          ),
          this.createCommandBatch(
            '/verify',
            ['verify', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_REVIEW_VERIFY_KEYWORDS)) {
      return this.createPlan({
        skillId: 'skill.review.verify',
        executionIntent: 'review.verify',
        suggestedSlashCommand: '/review verify',
        routerDecisionReason: 'session.main.router.command_handoff_preview.review_verify',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        commandBatches: [
          this.createCommandBatch('/review verify', ['review-verify'], options.preferredSurface),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_CONNECT_KEYWORDS)) {
      return this.createPlan({
        skillId: 'skill.connect.adapters',
        executionIntent: 'connect.adapters.bootstrap',
        suggestedSlashCommand: '/connect',
        routerDecisionReason: 'session.main.router.command_handoff_preview.connect',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        commandBatches: [
          this.createCommandBatch(
            '/connect',
            ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_DOCTOR_KEYWORDS)) {
      return this.createPlan({
        skillId: 'skill.doctor.environment',
        executionIntent: 'doctor.adapters',
        suggestedSlashCommand: '/doctor',
        routerDecisionReason: 'session.main.router.direct_execute.doctor',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        commandBatches: [
          this.createCommandBatch(
            '/doctor',
            ['doctor', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_VERIFY_KEYWORDS)) {
      return this.createPlan({
        skillId: 'skill.verify.adapters',
        executionIntent: 'verify.adapters',
        suggestedSlashCommand: '/verify',
        routerDecisionReason: 'session.main.router.direct_execute.verify',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        commandBatches: [
          this.createCommandBatch(
            '/verify',
            ['verify', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (
      !options.configuredRoleMentionPresent &&
      this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_PLAN_KEYWORDS)
    ) {
      return this.createPlan({
        skillId: 'skill.plan.task',
        executionIntent: 'plan.generate',
        suggestedSlashCommand: '/plan',
        routerDecisionReason: 'session.main.router.command_handoff_preview.plan',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        commandBatches: [
          this.createCommandBatch(
            '/plan',
            ['plan', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (
      !options.configuredRoleMentionPresent &&
      this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_REVIEW_KEYWORDS)
    ) {
      return this.createPlan({
        skillId: 'skill.review.code',
        executionIntent: 'review.start',
        suggestedSlashCommand: '/review',
        routerDecisionReason: 'session.main.router.direct_execute.review',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        commandBatches: [
          this.createCommandBatch(
            '/review',
            ['review', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_RUN_KEYWORDS)) {
      return this.createPlan({
        skillId: 'skill.run.task',
        executionIntent: 'run.task',
        suggestedSlashCommand: '/run',
        routerDecisionReason: 'session.main.router.command_handoff_preview.run',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.PREVIEW_CONFIRM,
        commandBatches: [
          this.createCommandBatch(
            '/run',
            ['run', '--dry-run', '--trace'],
            options.preferredSurface,
          ),
        ],
      });
    }

    return null;
  }

  private createPlan(options: {
    skillId: string;
    executionIntent: string;
    suggestedSlashCommand: string;
    routerDecisionReason: string;
    handoffExecutionMode: SessionMainHandoffExecutionMode;
    commandBatches: SessionMainSupervisorCommandBatch[];
  }): SessionMainForegroundSkillPlan {
    const handoffCommandPreview =
      options.commandBatches.length === 1
        ? (options.commandBatches[0]?.previewCommandLine ?? options.suggestedSlashCommand)
        : options.commandBatches
            .map(
              (commandBatch, index) => `${String(index + 1)}. ${commandBatch.previewCommandLine}`,
            )
            .join('\n');
    return {
      skillId: options.skillId,
      skillVersion: SESSION_MAIN_SKILL_VERSION,
      executionIntent: options.executionIntent,
      suggestedSlashCommand: options.suggestedSlashCommand,
      routerDecisionReason: options.routerDecisionReason,
      handoffExecutionMode: options.handoffExecutionMode,
      commandBatches: options.commandBatches.map((commandBatch) => ({
        ...commandBatch,
        bridgeArgv: [...commandBatch.bridgeArgv],
      })),
      handoffCommandPreview,
      handoffBacklinks: [
        ...options.commandBatches.map((commandBatch) => ({
          kind: 'slash_command' as const,
          label: `slash:${commandBatch.slashQuery}`,
          target: commandBatch.slashQuery,
        })),
        {
          kind: 'execution_intent' as const,
          label: `intent:${options.executionIntent}`,
          target: options.executionIntent,
        },
        {
          kind: 'command_preview' as const,
          label: 'preview',
          target: handoffCommandPreview,
        },
      ],
    };
  }

  private createCommandBatch(
    slashQuery: string,
    baseArgv: string[],
    preferredSurface: AdapterSurface | null,
  ): SessionMainSupervisorCommandBatch {
    const bridgeArgv =
      preferredSurface === null
        ? [...baseArgv]
        : [...baseArgv, '--single-tool-all-roles', preferredSurface];
    return {
      slashQuery,
      bridgeArgv,
      previewCommandLine: `repo-ai-governor ${bridgeArgv.join(' ')}`,
    };
  }

  private includesAnyKeyword(message: string, keywords: string[]): boolean {
    return keywords.some((keyword) => message.includes(keyword));
  }

  private matchesAnyPattern(message: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(message));
  }
}
