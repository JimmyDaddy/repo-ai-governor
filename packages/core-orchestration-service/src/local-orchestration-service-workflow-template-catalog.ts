import {
  type ProcessDslDefinition,
  type ProcessDslNode,
  ProcessNodeType,
} from '@repo-ai-governor/core-process';
import { DefaultRoleProfileId } from '@repo-ai-governor/shared';
import { LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID } from './constants/index.js';

/**
 * Owns the built-in service-native workflow draft templates used by direct workbench authoring.
 *
 * Why this exists:
 * sprint-002 needs service-owned draft seeding before richer graph editing lands, but the
 * orchestration service cannot depend on CLI-only template helpers.
 */
export class LocalOrchestrationServiceWorkflowTemplateCatalog {
  /**
   * Lists the built-in template identifiers supported by the service-owned draft runtime.
   * @returns Stable template identifier list.
   */
  public listTemplateIds(): string[] {
    return [
      LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID,
      'loop-guarded',
      'condition-route',
    ];
  }

  /**
   * Creates one normalized draft definition for the selected built-in template.
   * @param templateId Selected built-in template identifier.
   * @param executionId Deterministic execution id bound to the draft session.
   * @returns Service-owned draft definition.
   */
  public createDraftDefinition(templateId: string, executionId: string): ProcessDslDefinition {
    if (templateId === 'loop-guarded') {
      return this.createLoopGuardedDefinition(executionId);
    }

    if (templateId === 'condition-route') {
      return this.createConditionRouteDefinition(executionId);
    }

    return this.createParallelReviewDefinition(executionId);
  }

  private createParallelReviewDefinition(executionId: string): ProcessDslDefinition {
    return {
      processId: 'workflow-preview-parallel-review',
      executionId,
      entryNodeId: 'node-plan',
      nodes: [
        this.createNode(
          'node-plan',
          'stage-plan',
          ProcessNodeType.SEQUENTIAL,
          'plan',
          DefaultRoleProfileId.PLANNER,
        ),
        this.createNode(
          'node-review-fanout',
          'stage-review-fanout',
          ProcessNodeType.PARALLEL,
          'parallel-review',
          DefaultRoleProfileId.REVIEWER,
        ),
        this.createNode(
          'node-review-quality',
          'stage-review-quality',
          ProcessNodeType.SEQUENTIAL,
          'review-quality',
          DefaultRoleProfileId.REVIEWER,
        ),
        this.createNode(
          'node-review-risk',
          'stage-review-risk',
          ProcessNodeType.SEQUENTIAL,
          'review-risk',
          DefaultRoleProfileId.VERIFIER,
        ),
      ],
      edges: [
        {
          fromNodeId: 'node-plan',
          toNodeId: 'node-review-fanout',
        },
        {
          fromNodeId: 'node-review-fanout',
          toNodeId: 'node-review-quality',
        },
        {
          fromNodeId: 'node-review-fanout',
          toNodeId: 'node-review-risk',
        },
      ],
      globals: {
        templateId: LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID,
      },
    };
  }

  private createLoopGuardedDefinition(executionId: string): ProcessDslDefinition {
    return {
      processId: 'workflow-preview-loop-guarded',
      executionId,
      entryNodeId: 'node-intake',
      nodes: [
        this.createNode(
          'node-intake',
          'stage-intake',
          ProcessNodeType.SEQUENTIAL,
          'intake',
          DefaultRoleProfileId.PLANNER,
        ),
        this.createNode(
          'node-review-loop',
          'stage-review-loop',
          ProcessNodeType.LOOP,
          'review-loop',
          DefaultRoleProfileId.REVIEWER,
          {
            maxCycles: 3,
            maxWallTimeSeconds: 900,
          },
        ),
        this.createNode(
          'node-route',
          'stage-route',
          ProcessNodeType.CONDITION,
          'route-after-loop',
          DefaultRoleProfileId.ARCHITECT,
        ),
        this.createNode(
          'node-implement',
          'stage-implement',
          ProcessNodeType.SEQUENTIAL,
          'implement-fixes',
          DefaultRoleProfileId.CODER,
        ),
        this.createNode(
          'node-report',
          'stage-report',
          ProcessNodeType.SEQUENTIAL,
          'report-ready',
          DefaultRoleProfileId.VERIFIER,
        ),
      ],
      edges: [
        {
          fromNodeId: 'node-intake',
          toNodeId: 'node-review-loop',
        },
        {
          fromNodeId: 'node-review-loop',
          toNodeId: 'node-review-loop',
        },
        {
          fromNodeId: 'node-review-loop',
          toNodeId: 'node-route',
        },
        {
          fromNodeId: 'node-route',
          toNodeId: 'node-implement',
          conditionKey: 'retry',
        },
        {
          fromNodeId: 'node-route',
          toNodeId: 'node-report',
          conditionKey: 'done',
        },
      ],
      globals: {
        templateId: 'loop-guarded',
      },
    };
  }

  private createConditionRouteDefinition(executionId: string): ProcessDslDefinition {
    return {
      processId: 'workflow-preview-condition-route',
      executionId,
      entryNodeId: 'node-prepare',
      nodes: [
        this.createNode(
          'node-prepare',
          'stage-prepare',
          ProcessNodeType.SEQUENTIAL,
          'prepare',
          DefaultRoleProfileId.PLANNER,
        ),
        this.createNode(
          'node-route-policy',
          'stage-route-policy',
          ProcessNodeType.CONDITION,
          'policy-route',
          DefaultRoleProfileId.ARCHITECT,
        ),
        this.createNode(
          'node-fast-lane',
          'stage-fast-lane',
          ProcessNodeType.SEQUENTIAL,
          'fast-lane',
          DefaultRoleProfileId.CODER,
        ),
        this.createNode(
          'node-guarded-lane',
          'stage-guarded-lane',
          ProcessNodeType.SEQUENTIAL,
          'guarded-lane',
          DefaultRoleProfileId.REVIEWER,
        ),
      ],
      edges: [
        {
          fromNodeId: 'node-prepare',
          toNodeId: 'node-route-policy',
        },
        {
          fromNodeId: 'node-route-policy',
          toNodeId: 'node-fast-lane',
          conditionKey: 'allow',
        },
        {
          fromNodeId: 'node-route-policy',
          toNodeId: 'node-guarded-lane',
          conditionKey: 'confirm',
        },
      ],
      globals: {
        templateId: 'condition-route',
      },
    };
  }

  private createNode(
    nodeId: string,
    stageId: string,
    nodeType: ProcessNodeType,
    routeKey: string,
    roleProfileId: string,
    limits?: ProcessDslNode['limits'],
  ): ProcessDslNode {
    return {
      nodeId,
      stageId,
      nodeType,
      routeKey,
      roleProfileId,
      inputSchemaRef: `schemas/${stageId}-input.json`,
      outputSchemaRef: `schemas/${stageId}-output.json`,
      retryPolicyRef: 'policy/retry-default',
      timeoutPolicyRef: 'policy/timeout-default',
      budgetPolicyRef: 'policy/budget-default',
      ...(limits
        ? {
            limits,
          }
        : {}),
    };
  }
}
