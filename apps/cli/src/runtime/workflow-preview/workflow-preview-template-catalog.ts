import {
  type ProcessDslDefinition,
  type ProcessDslNode,
  ProcessNodeType,
} from '@repo-ai-governor/core-process';
import { DefaultRoleProfileId } from '@repo-ai-governor/shared';
import { CliWorkflowTemplateId } from '../../constants/cli-workflow.constant.js';

/**
 * Owns built-in read-only workflow preview templates for the M2 preview surface.
 */
export class CliWorkflowPreviewTemplateCatalog {
  /**
   * Lists supported built-in workflow preview template identifiers.
   * @returns Stable template id list.
   */
  public listTemplateIds(): CliWorkflowTemplateId[] {
    return [
      CliWorkflowTemplateId.PARALLEL_REVIEW,
      CliWorkflowTemplateId.LOOP_GUARDED,
      CliWorkflowTemplateId.CONDITION_ROUTE,
    ];
  }

  /**
   * Creates one workflow preview DSL definition for the selected template.
   * @param templateId Built-in template id.
   * @param executionId Deterministic preview execution id.
   * @returns Process DSL definition consumed by the compiler.
   */
  public createPreviewDefinition(
    templateId: CliWorkflowTemplateId,
    executionId: string,
  ): ProcessDslDefinition {
    if (templateId === CliWorkflowTemplateId.PARALLEL_REVIEW) {
      return this.createParallelReviewDefinition(executionId);
    }

    if (templateId === CliWorkflowTemplateId.LOOP_GUARDED) {
      return this.createLoopGuardedDefinition(executionId);
    }

    return this.createConditionRouteDefinition(executionId);
  }

  /**
   * Creates the `parallel-review` preview template.
   * @param executionId Deterministic preview execution id.
   * @returns Process DSL definition.
   */
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
        templateId: CliWorkflowTemplateId.PARALLEL_REVIEW,
      },
    };
  }

  /**
   * Creates the `loop-guarded` preview template.
   * @param executionId Deterministic preview execution id.
   * @returns Process DSL definition.
   */
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
        templateId: CliWorkflowTemplateId.LOOP_GUARDED,
      },
    };
  }

  /**
   * Creates the `condition-route` preview template.
   * @param executionId Deterministic preview execution id.
   * @returns Process DSL definition.
   */
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
        templateId: CliWorkflowTemplateId.CONDITION_ROUTE,
      },
    };
  }

  /**
   * Creates one reusable node baseline for preview definitions.
   * @param nodeId Stable node identifier.
   * @param stageId Stable stage identifier.
   * @param nodeType Process node type.
   * @param routeKey Route key used by runtime/audit.
   * @param roleProfileId Role profile id.
   * @param limits Optional loop limits.
   * @returns Process DSL node.
   */
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
