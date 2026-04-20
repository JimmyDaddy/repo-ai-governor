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
const SESSION_MAIN_BRANCH_SWITCH_KEYWORDS = [
  'switch branch',
  'checkout',
  'switch to',
  '切换分支',
  '切到',
  '切回',
];
const SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN = '[^\\s,，;；。！？!?]+';
const SESSION_MAIN_BRANCH_SWITCH_PATTERNS = [
  new RegExp(
    `(?:switch|move)(?:\\s+(?:me|us))?\\s+(?:the\\s+)?(?:(?:current|code)\\s+)?branch\\s+(?:to\\s+)?(?<branch>${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN})(?:\\s+branch)?(?:\\s*$|[.!?])`,
    'iu',
  ),
  new RegExp(
    `(?:switch|move)(?:\\s+(?:me|us))?\\s+to\\s+(?<branch>${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN})(?:\\s+branch)?(?:\\s*$|[.!?])`,
    'iu',
  ),
  new RegExp(
    `(?:git\\s+)?checkout\\s+(?<branch>${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN})(?:\\s+branch)?(?:\\s*$|[.!?])`,
    'iu',
  ),
  new RegExp(
    `(?:切(?:换)?(?:到)?|切回|换到)\\s*(?:当前|代码)?\\s*(?:分支)?\\s*(?:到)?\\s*(?<branch>${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN})(?:\\s*分支)?(?:\\s*$|[，。！？])`,
    'iu',
  ),
  new RegExp(
    `(?:把|将)\\s*(?:当前|代码)?\\s*(?:分支)?\\s*切(?:换)?到\\s*(?<branch>${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN})(?:\\s*分支)?(?:\\s*$|[，。！？])`,
    'iu',
  ),
];
const SESSION_MAIN_BRANCH_NAME_VALIDATOR = new RegExp(
  `^${SESSION_MAIN_BRANCH_NAME_TOKEN_PATTERN}$`,
  'u',
);
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
const SESSION_MAIN_VERIFY_ACTION_PATTERNS = [
  /\b(?:verify|validation|validate)\b/iu,
  /(?:验证|校验)/u,
] as const;
const SESSION_MAIN_VERIFY_READINESS_CONTEXT_PATTERNS = [
  /\b(?:adapters?|readiness|ready|setup|environment|routing|binding|onboarding|projection|connection)\b/iu,
  /(?:适配器|接入|就绪|环境|配置|路由|绑定|投影|连接)/u,
  /(?:adapter|adapters?|适配器).*(?:status|状态|health|健康)/iu,
  /(?:status|状态|health|健康).*(?:adapter|adapters?|适配器)/iu,
] as const;
const SESSION_MAIN_WORKFLOW_PATTERNS = [
  /\bworkflow preview\b/iu,
  /\bpreview\b.*\bworkflow\b/iu,
  /\bworkflow\b.*\bpreview\b/iu,
  /\bworkflow template\b/iu,
  /\btemplate\b.*\bworkflow\b/iu,
  /\bworkflow\b.*\btemplate\b/iu,
  /流程预览/u,
  /预览.*(?:流程|workflow)/iu,
  /(?:流程|workflow).*(?:预览)/iu,
  /流程模板/u,
  /模板.*(?:流程|workflow)/iu,
  /(?:流程|workflow).*(?:模板)/iu,
] as const;
const SESSION_MAIN_DELIVER_EXPLICIT_EXECUTION_PATTERNS = [
  /\bhelp(?:\s+me)?\s+deliver\b.*\b(?:requirement-to-cr|governed path)\b/iu,
  /\b(?:start|launch|begin|run)\b.*\b(?:governed path|governed delivery workflow|governed deliver workflow)\b/iu,
  /\b(?:start|launch|begin|run)\b.*\brequirement-to-cr\b.*\b(?:deliver|delivery|governed)\b.*\b(?:workflow|path)\b/iu,
  /(?:帮我|请)?(?:把|将)?.*(?:需求|requirement).*(?:按|走).*(?:交付|deliver|主路径|workflow|流程)/iu,
  /(?:帮我|请)?(?:启动|开始|发起).*(?:(?:受治理|governed).*(?:交付|deliver)|(?:交付|deliver|requirement-to-cr).*(?:受治理|主路径|workflow|流程))/iu,
] as const;
const SESSION_MAIN_DELIVER_FALLBACK_PATTERNS = [
  /\bdeliver\b.*\b(?:this|that|the|my|our)\b.*\b(?:requirement|brief|proposal|solution)\b.*\b(?:requirement-to-cr|governed path)\b/iu,
] as const;
const SESSION_MAIN_DELIVER_CHILD_RUN_PATTERNS = [
  /\b(?:task-driven execution flow|execution flow|task package|tk-\d+)\b/iu,
  /(?:任务驱动执行流|执行流|任务包|TK-\d+)/iu,
] as const;
const SESSION_MAIN_DELIVER_EXPLANATION_PATTERNS = [
  /\btell me about\b/iu,
  /\bwhat is\b/iu,
  /\bwhat does\b/iu,
  /\bwhat can\b.*\bdo\b/iu,
  /\btell me what\b.*\bdoes\b/iu,
  /\bwhen should (?:i|we) use\b/iu,
  /\bwhy should (?:i|we) use\b/iu,
  /\bhow should (?:i|we) use\b/iu,
  /\bhow do (?:i|we)\b/iu,
  /\bshow me how\b/iu,
  /\bwhat steps\b/iu,
  /\bwalk me through\b/iu,
  /\bexplain\b/iu,
  /\bhow does\b/iu,
  /\bshow me examples?\b/iu,
  /\bhow to use\b/iu,
  /\bsample prompt\b/iu,
  /介绍一下/u,
  /说说/u,
  /讲讲/u,
  /解释一下/u,
  /示例/u,
  /例子/u,
  /怎么用/u,
  /如何使用/u,
] as const;
const SESSION_MAIN_EXECUTION_EXCLUDED_PATTERNS = [
  /\bworkflow preview\b/iu,
  /\bpreview\b/iu,
  /\bcreate\b/iu,
  /\bedit\b/iu,
  /\btemplate\b/iu,
  /预览/u,
  /模板/u,
  /创建/u,
  /编辑/u,
];
const SESSION_MAIN_PLAN_KEYWORDS = ['plan', 'planning', 'break down', 'task breakdown', '拆任务'];
const SESSION_MAIN_PLAN_PATTERNS = [
  /(?:帮我|请)?(?:拆|做|生成|整理)?(?:一下)?(?:任务|执行)?计划/iu,
  /(?:帮我|请)?拆一下任务/iu,
  /(?:帮我|请)?规划(?:一下)?(?:任务|执行)?/iu,
];
const SESSION_MAIN_REVIEW_PATTERNS = [
  /\bcode[- ]review\b/iu,
  /(?<![/\w-])review(?![-\w])/iu,
  /(?<![/\w-])cr(?![-\w])/iu,
  /评审/u,
  /审查/u,
];
const SESSION_MAIN_REVIEW_VERIFY_KEYWORDS = [
  'review verify',
  'review verification',
  'review-verification',
  'verify review',
  '复核',
  'cr verify',
];
const SESSION_MAIN_REVIEW_VERIFY_PATTERNS = [
  /(?:verify|validate|recheck)\s+(?:that\s+)?(?:the\s+)?(?:current\s+)?(?:review\s+findings|review\s+report|cr\s+report|fixes?)/iu,
  /(?:review\s+findings|review\s+report|cr\s+report).*(?:verify|validate|recheck)/iu,
  /(?:验证|校验|复核).*(?:review findings|review report|cr 报告|评审报告|修复结果)/iu,
  /(?:复核|校验).*(?:当前)?(?:cr|review).*(?:报告|结果)/iu,
];
const SESSION_MAIN_RUN_PATTERNS = [
  /\brun\b(?:\s+the)?\s+(?:next\s+)?(?:governed\s+|reusable\s+)(?:workflow|flow|pipeline)\b/iu,
  /\b(?:start|launch|execute)\b(?:\s+the)?\s+(?:next\s+)?(?:governed\s+|reusable\s+)(?:workflow|flow|pipeline)\b/iu,
  /\b(?:run|execute|start|launch|begin)\b.*\b(?:task-driven execution flow|execution flow)\b/iu,
  /\b(?:run|execute|start)\b.*\b(?:tk-\d+|task package)\b/iu,
  /(?:运行|执行|启动|跑一下).*(?:(?:受治理|可复用).*(?:workflow|工作流|流程)|(?:执行流|任务驱动执行流|任务包))/iu,
  /(?:(?:受治理|可复用).*(?:workflow|工作流|流程)|(?:执行流|任务驱动执行流|任务包)).*(?:运行|执行|启动|跑一下)/iu,
  /(?:运行|执行|启动).*(?:TK-\d+)/iu,
];
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
    const rawMessage = userMessage.trim();
    const normalizedMessage = rawMessage.toLowerCase();

    // Explicit @role entry should stay on the raw collaboration path instead of being
    // re-captured by deterministic command routing after the dispatcher strips mentions.
    if (options.configuredRoleMentionPresent) {
      return null;
    }

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_ONBOARDING_PATTERNS)) {
      return this.createPlanFromInlineBundle({
        skillId: 'skill.onboard.adapters',
        skillVersion: '2026-04-01',
        executionIntent: 'skill.onboard.adapters',
        suggestedSlashCommand: 'adapter onboarding bundle',
        routerDecisionReason: 'session.main.router.command_bundle.onboard_adapters',
        handoffExecutionMode: SESSION_MAIN_HANDOFF_EXECUTION_MODE.DIRECT_EXECUTE,
        commandBatches: [
          this.createCommandBatch(
            '/connect',
            ['connect', '--preset', 'multi-tool-default', '--output', 'pretty'],
            options.preferredSurface,
          ),
          this.createCommandBatch(
            '/doctor',
            ['doctor', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.matchesReviewVerifyIntent(normalizedMessage)) {
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

    const targetBranch = this.resolveBranchSwitchTarget(rawMessage, normalizedMessage);
    if (targetBranch !== null) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.BRANCH_SWITCH,
        routerDecisionReason: 'session.main.router.command_handoff_preview.branch_switch',
        commandBatches: [
          this.createCommandBatch(
            `/workspace switch-branch ${targetBranch}`,
            ['workspace', 'switch-branch', targetBranch],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.matchesVerifyMigrationIntent(normalizedMessage)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.DOCTOR,
        routerDecisionReason: 'session.main.router.direct_execute.verify_migrated_doctor',
        commandBatches: [
          this.createCommandBatch(
            '/doctor',
            ['doctor', '--adapters', '--output', 'pretty'],
            options.preferredSurface,
          ),
        ],
      });
    }

    if (this.matchesPlanIntent(normalizedMessage)) {
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

    if (this.matchesReviewIntent(normalizedMessage)) {
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

    if (this.matchesDeliverIntent(rawMessage, normalizedMessage)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.DELIVER,
        routerDecisionReason: 'session.main.router.delivery_workflow.start',
        commandBatches: [],
      });
    }

    if (this.matchesRunIntent(rawMessage)) {
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

    if (this.matchesAnyPattern(normalizedMessage, SESSION_MAIN_WORKFLOW_PATTERNS)) {
      return this.createPlanFromCapabilityId({
        capabilityId: SESSION_MAIN_CAPABILITY_ID.WORKFLOW,
        routerDecisionReason: 'session.main.router.direct_execute.workflow',
        commandBatches: [
          this.createCommandBatch('/workflow', ['workflow', 'preview'], options.preferredSurface),
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

  private matchesReviewVerifyIntent(message: string): boolean {
    return (
      this.includesAnyKeyword(message, SESSION_MAIN_REVIEW_VERIFY_KEYWORDS) ||
      this.matchesAnyPattern(message, SESSION_MAIN_REVIEW_VERIFY_PATTERNS)
    );
  }

  private matchesReviewIntent(message: string): boolean {
    return this.matchesAnyPattern(message, SESSION_MAIN_REVIEW_PATTERNS);
  }

  private matchesPlanIntent(message: string): boolean {
    return (
      this.includesAnyKeyword(message, SESSION_MAIN_PLAN_KEYWORDS) ||
      this.matchesAnyPattern(message, SESSION_MAIN_PLAN_PATTERNS)
    );
  }

  private matchesVerifyMigrationIntent(message: string): boolean {
    return (
      this.matchesAnyPattern(message, SESSION_MAIN_VERIFY_ACTION_PATTERNS) &&
      this.matchesAnyPattern(message, SESSION_MAIN_VERIFY_READINESS_CONTEXT_PATTERNS)
    );
  }

  private matchesDeliverIntent(rawMessage: string, normalizedMessage: string): boolean {
    const hasExplicitDeliverExecutionIntent = this.matchesAnyPattern(
      rawMessage,
      SESSION_MAIN_DELIVER_EXPLICIT_EXECUTION_PATTERNS,
    );
    const hasFallbackDeliverExecutionIntent = this.matchesAnyPattern(
      rawMessage,
      SESSION_MAIN_DELIVER_FALLBACK_PATTERNS,
    );
    const referencesDeliverExplanation = this.matchesAnyPattern(
      rawMessage,
      SESSION_MAIN_DELIVER_EXPLANATION_PATTERNS,
    );
    return (
      !this.matchesReviewVerifyIntent(normalizedMessage) &&
      !this.matchesReviewIntent(normalizedMessage) &&
      !this.matchesPlanIntent(normalizedMessage) &&
      !this.matchesAnyPattern(rawMessage, SESSION_MAIN_EXECUTION_EXCLUDED_PATTERNS) &&
      !this.matchesAnyPattern(rawMessage, SESSION_MAIN_DELIVER_CHILD_RUN_PATTERNS) &&
      (hasExplicitDeliverExecutionIntent ||
        (hasFallbackDeliverExecutionIntent && !referencesDeliverExplanation))
    );
  }

  private matchesRunIntent(message: string): boolean {
    return (
      this.matchesAnyPattern(message, SESSION_MAIN_RUN_PATTERNS) &&
      !this.matchesAnyPattern(message, SESSION_MAIN_EXECUTION_EXCLUDED_PATTERNS)
    );
  }

  private matchesAnyPattern(message: string, patterns: readonly RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(message));
  }

  private resolveBranchSwitchTarget(rawMessage: string, normalizedMessage: string): string | null {
    const explicitPatternTarget = this.resolveBranchNameFromPatterns(rawMessage);
    if (explicitPatternTarget !== null) {
      return explicitPatternTarget;
    }

    if (!this.includesAnyKeyword(normalizedMessage, SESSION_MAIN_BRANCH_SWITCH_KEYWORDS)) {
      return null;
    }

    return this.resolveBranchNameFromPatterns(rawMessage);
  }

  private resolveBranchNameFromPatterns(message: string): string | null {
    for (const pattern of SESSION_MAIN_BRANCH_SWITCH_PATTERNS) {
      const match = pattern.exec(message);
      const branchCandidate = this.normalizeBranchCandidate(match?.groups?.branch);
      if (branchCandidate && this.isSafeBranchName(branchCandidate)) {
        return branchCandidate;
      }
    }

    return null;
  }

  /**
   * Allows Git-valid dots inside branch names while stripping sentence-ending punctuation
   * from natural-language requests such as `checkout release/1.2.3.`.
   */
  private normalizeBranchCandidate(rawBranchCandidate: string | undefined): string | null {
    const trimmedBranchCandidate = rawBranchCandidate?.trim();
    if (!trimmedBranchCandidate) {
      return null;
    }

    const normalizedBranchCandidate = trimmedBranchCandidate.replace(/[.!?。！？]+$/u, '').trim();
    return normalizedBranchCandidate.length > 0 ? normalizedBranchCandidate : null;
  }

  private isSafeBranchName(branchCandidate: string): boolean {
    return SESSION_MAIN_BRANCH_NAME_VALIDATOR.test(branchCandidate);
  }
}
