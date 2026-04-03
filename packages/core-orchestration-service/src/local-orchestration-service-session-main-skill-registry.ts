import { type AdapterSurface, GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  SESSION_MAIN_CAPABILITY_ID,
  SESSION_MAIN_HANDOFF_EXECUTION_MODE,
} from './constants/index.js';
import { LocalOrchestrationServiceSessionMainCapabilityCatalog } from './local-orchestration-service-session-main-capability-catalog.js';
import type {
  SessionMainCapabilityId,
  SessionMainHandoffExecutionMode,
  SessionMainSupervisorCommandBatch,
  SessionMainSupervisorTurnBacklink,
} from './types/index.js';

const SESSION_MAIN_CONNECT_KEYWORDS = ['connect', '连接', '连一下', '接上', '接好'];
const SESSION_MAIN_DOCTOR_KEYWORDS = [
  'doctor',
  'diagnose',
  'health',
  'check environment',
  '体检',
  '诊断',
];
const SESSION_MAIN_DOCTOR_PATTERNS = [
  /(?:帮我|请)?(?:诊断|检查|体检|排查)(?:一下)?(?:当前|这个)?(?:项目|仓库|workspace|repo)(?:环境|状态|接入|配置)?/iu,
  /(?:diagnose|health check|inspect|troubleshoot|check)\s+(?:the\s+)?(?:current\s+)?(?:project|repo|repository|workspace)(?:\s+(?:health|environment|setup|adapters?))?/iu,
];
const SESSION_MAIN_VERIFY_KEYWORDS = ['verify', 'validation', 'validate', '验证', '校验'];
const SESSION_MAIN_WORKFLOW_KEYWORDS = ['workflow', '流程', 'workflow preview', '流程预览'];
const SESSION_MAIN_PLAN_KEYWORDS = ['plan', 'planning', 'break down', 'task breakdown', '拆任务'];
const SESSION_MAIN_PLAN_PATTERNS = [
  /(?:帮我|请)?(?:拆|做|生成|整理)?(?:一下)?(?:任务|执行)?计划/iu,
  /(?:帮我|请)?拆一下任务/iu,
  /(?:帮我|请)?规划(?:一下)?(?:任务|执行)?/iu,
];
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
  private readonly capabilityCatalog = new LocalOrchestrationServiceSessionMainCapabilityCatalog();

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
      return this.createPlanFromInlineBundle({
        skillId: 'skill.onboard.adapters',
        skillVersion: '2026-04-01',
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
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
        routerDecisionReason: 'session.main.router.command_handoff_preview.review_verify',
        commandBatches: [
          this.createCommandBatch('/review verify', ['review-verify'], options.preferredSurface),
        ],
      });
    }

    if (
      this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_DOCTOR_PATTERNS) ||
      this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_DOCTOR_KEYWORDS)
    ) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
        routerDecisionReason: 'session.main.router.direct_execute.doctor',
        commandBatches: [
          this.createCommandBatch(
            '/doctor',
            ['doctor', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_CONNECT_KEYWORDS)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.CONNECT,
        routerDecisionReason: 'session.main.router.command_handoff_preview.connect',
        commandBatches: [
          this.createCommandBatch(
            '/connect',
            ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_VERIFY_KEYWORDS)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.VERIFY,
        routerDecisionReason: 'session.main.router.direct_execute.verify',
        commandBatches: [
          this.createCommandBatch(
            '/verify',
            ['verify', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_WORKFLOW_KEYWORDS)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
        routerDecisionReason: 'session.main.router.direct_execute.workflow',
        commandBatches: [
          this.createCommandBatch('/workflow', ['workflow', 'preview'], options.preferredSurface),
        ],
      });
    }

    if (
      !options.configuredRoleMentionPresent &&
      (this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_PLAN_KEYWORDS) ||
        this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_PLAN_PATTERNS))
    ) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.PLAN,
        routerDecisionReason: 'session.main.router.direct_execute.plan',
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
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
        routerDecisionReason: 'session.main.router.direct_execute.review',
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
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
        routerDecisionReason: 'session.main.router.command_handoff_preview.run',
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

  private createPlanFromCapabilityId(options: {
    capabilityId: SessionMainCapabilityId;
    routerDecisionReason: string;
    commandBatches: SessionMainSupervisorCommandBatch[];
  }): SessionMainForegroundSkillPlan {
    const descriptorSeed = this.capabilityCatalog.getDescriptorSeed(options.capabilityId);
    if (descriptorSeed === null) {
      throw new RuntimeError(
        GovernorErrorCode.AGENT_PROTOCOL_INVALID,
        `Missing capability descriptor seed for capabilityId="${options.capabilityId}".`,
        { capabilityId: options.capabilityId },
      );
    }

    return this.createPlanFromInlineBundle({
      skillId: descriptorSeed.skillId,
      skillVersion: descriptorSeed.skillVersion,
      executionIntent: descriptorSeed.executionIntent,
      suggestedSlashCommand: descriptorSeed.suggestedSlashCommand,
      routerDecisionReason: options.routerDecisionReason,
      handoffExecutionMode: descriptorSeed.handoffExecutionMode,
      commandBatches: options.commandBatches,
    });
  }

  private createPlanFromInlineBundle(options: {
    skillId: string;
    skillVersion: string;
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
      skillVersion: options.skillVersion,
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
