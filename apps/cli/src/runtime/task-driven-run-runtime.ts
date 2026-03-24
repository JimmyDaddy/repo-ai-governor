import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { AgentCapability } from "@repo-ai-governor/adapter-sdk";
import type { AdaptersConfig } from "@repo-ai-governor/config";
import { type ProcessDslNode, ProcessNodeType } from "@repo-ai-governor/core-process";
import type { ProcessDslDefinition } from "@repo-ai-governor/core-process";
import type { RuntimeStageInputMap } from "@repo-ai-governor/core-runtime";
import { DefaultRoleProfileId } from "@repo-ai-governor/shared";
import {
  CLI_TASK_DRIVEN_RUN_KEYWORDS,
  CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS,
  CliTaskDrivenRunAssemblyMode,
  CliTaskDrivenRunAssemblyReason,
} from "../constants/cli-task-driven-run.constant.js";
import type {
  CliTaskCardContext,
  CliTaskDrivenRunAssembly,
  CliTaskInputArtifactReference,
  CliTaskInputReference,
} from "../types/index.js";

const PROCESS_POLICY_RETRY_REF = "policy/retry-default";
const PROCESS_POLICY_TIMEOUT_REF = "policy/timeout-default";
const PROCESS_POLICY_BUDGET_REF = "policy/budget-default";

/**
 * Owns task-driven `run` assembly so CLI can translate `--task-id` context into process DSL/stage inputs.
 *
 * Why this exists:
 * `CliGovernanceRuntime` should orchestrate execution, not parse task cards or hardcode
 * dynamic DAG-shaping rules for task goal, dependency artifacts, and role selection.
 */
export class CliTaskDrivenRunRuntime {
  public constructor(private readonly workspaceRoot: string) {}

  /**
   * Builds one run assembly payload from optional task context.
   * @param options Execution id, optional task id, and adapters config.
   * @returns Assembled process definition and stage-input payloads.
   */
  public async buildRunAssembly(options: {
    executionId: string;
    taskId: string | null;
    adaptersConfig: AdaptersConfig;
  }): Promise<CliTaskDrivenRunAssembly> {
    if (!options.taskId) {
      return this.createBaselineAssembly(
        options.executionId,
        CliTaskDrivenRunAssemblyReason.NO_TASK_ID,
      );
    }

    const taskContext = await this.resolveTaskCardContext(options.taskId);
    if (!taskContext) {
      return this.createBaselineAssembly(
        options.executionId,
        CliTaskDrivenRunAssemblyReason.TASK_CARD_NOT_FOUND,
      );
    }

    return this.createTaskDrivenAssembly(options.executionId, taskContext, options.adaptersConfig);
  }

  /**
   * Resolves one task card from workspace context tree and extracts normalized metadata.
   * @param taskId Task id passed via CLI runtime debug options.
   * @returns Parsed task-card context when found.
   */
  private async resolveTaskCardContext(taskId: string): Promise<CliTaskCardContext | null> {
    const taskCardPath = await this.findTaskCardPath(taskId);
    if (!taskCardPath) {
      return null;
    }

    const content = await readFile(taskCardPath, "utf8");
    const title = this.readTaskTitle(content, taskId);
    const goal = this.extractSection(content, "任务目标");
    const dependsOnTaskIds = this.extractTaskIds(this.extractSection(content, "Depends On"));
    const requiredInputReferences = this.extractInputReferences(
      this.extractSection(content, "Required Inputs"),
    );
    const legacyInputReferences = this.extractInputReferences(
      this.extractSection(content, "Input References"),
    );
    const inputReferences =
      requiredInputReferences.length > 0 ? requiredInputReferences : legacyInputReferences;
    const inputArtifacts = this.extractInputArtifacts(inputReferences);
    const tracebackReferences = this.extractInputReferences(
      this.extractSection(content, "Traceback References"),
    );

    return {
      taskId,
      taskCardPath,
      title,
      goal,
      dependsOnTaskIds,
      inputReferences,
      inputArtifacts,
      tracebackReferences,
    };
  }

  /**
   * Recursively finds one canonical task card path under workspace context tree.
   * @param taskId Task id.
   * @returns Absolute task-card path when present.
   */
  private async findTaskCardPath(taskId: string): Promise<string | null> {
    const rootDirectory = resolve(this.workspaceRoot, "context", "dev");
    const pendingDirectories = [rootDirectory];

    while (pendingDirectories.length > 0) {
      const currentDirectory = pendingDirectories.pop();
      if (!currentDirectory) {
        continue;
      }

      try {
        const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
        for (const entry of directoryEntries) {
          const entryPath = resolve(currentDirectory, entry.name);
          if (entry.isDirectory()) {
            pendingDirectories.push(entryPath);
            continue;
          }

          if (entry.isFile() && entry.name.startsWith(`${taskId}-`) && entry.name.endsWith(".md")) {
            return entryPath;
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Reads task title from canonical markdown heading.
   * @param content Task-card markdown content.
   * @param taskId Task id used for fallback.
   * @returns Human-readable task title.
   */
  private readTaskTitle(content: string, taskId: string): string {
    const headingMatch = content.match(/^#\s*(TK-\d{3})\s+(.+?)\s*$/mu);
    return headingMatch?.[2]?.trim() || taskId;
  }

  /**
   * Extracts one markdown section body using semantic heading text rather than fixed numbering.
   * @param content Task-card markdown content.
   * @param headingText Section heading semantic label.
   * @returns Trimmed section body or empty string.
   */
  private extractSection(content: string, headingText: string): string {
    const normalizedHeadingText = this.normalizeSectionHeading(headingText);
    const headingPattern = /^##\s+([^\n]+)$/gmu;
    const headingMatches = Array.from(content.matchAll(headingPattern));

    for (let index = 0; index < headingMatches.length; index += 1) {
      const currentHeadingMatch = headingMatches[index];
      const rawHeadingText = currentHeadingMatch[1]?.trim() ?? "";
      const currentHeadingIndex = currentHeadingMatch.index;
      if (typeof currentHeadingIndex !== "number") {
        continue;
      }
      if (this.normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText) {
        continue;
      }

      const sectionStart = currentHeadingIndex + currentHeadingMatch[0].length;
      const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
      return content.slice(sectionStart, sectionEnd).trim();
    }

    return "";
  }

  /**
   * Normalizes one section heading by stripping numbering drift and casing differences.
   * @param headingText Raw heading text.
   * @returns Semantic heading label.
   */
  private normalizeSectionHeading(headingText: string): string {
    return headingText
      .replace(/^\d+(?:\.\d+)*\.?\s*/u, "")
      .trim()
      .toLowerCase();
  }

  /**
   * Extracts task ids from markdown section content.
   * @param sectionContent Section content.
   * @returns Deduplicated task id list.
   */
  private extractTaskIds(sectionContent: string): string[] {
    const taskIdMatches = Array.from(sectionContent.matchAll(/TK-\d{3}/gu)).map(
      (matched) => matched[0],
    );
    return Array.from(new Set(taskIdMatches));
  }

  /**
   * Extracts raw input references from one input-reference section.
   * @param sectionContent Section content.
   * @returns Deduplicated input references.
   */
  private extractInputReferences(sectionContent: string): CliTaskInputReference[] {
    const referencesByKey = new Map<string, CliTaskInputReference>();

    for (const rawLine of sectionContent.split(/\r?\n/u)) {
      const line = rawLine.replace(/^\s*(?:\d+\.\s+|[-*]\s+)/u, "").trim();
      if (line.length === 0) {
        continue;
      }

      const artifactId = line.match(/DA-\d{3}/u)?.[0] ?? null;
      const referencePath = line.match(/`([^`]+)`/u)?.[1] ?? null;
      const dedupeKey = [artifactId ?? "no-artifact", referencePath ?? line].join("::");

      referencesByKey.set(dedupeKey, {
        artifactId,
        referencePath,
        referenceText: line,
      });
    }

    return Array.from(referencesByKey.values());
  }

  /**
   * Extracts artifact-only references from raw input-reference rows.
   * @param inputReferences Raw input references.
   * @returns Deduplicated artifact references.
   */
  private extractInputArtifacts(
    inputReferences: CliTaskInputReference[],
  ): CliTaskInputArtifactReference[] {
    const artifactById = new Map<string, CliTaskInputArtifactReference>();

    for (const inputReference of inputReferences) {
      if (!inputReference.artifactId) {
        continue;
      }

      artifactById.set(inputReference.artifactId, {
        artifactId: inputReference.artifactId,
        artifactPath: inputReference.referencePath?.includes("DA-")
          ? inputReference.referencePath
          : null,
      });
    }

    return Array.from(artifactById.values());
  }

  /**
   * Creates baseline three-stage sequential assembly used when task context is unavailable.
   * @param executionId Runtime execution id.
   * @param assemblyReason Reason for baseline selection.
   * @returns Baseline run assembly.
   */
  private createBaselineAssembly(
    executionId: string,
    assemblyReason: CliTaskDrivenRunAssemblyReason,
  ): CliTaskDrivenRunAssembly {
    const prepareNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE,
      DefaultRoleProfileId.PLANNER,
    );
    const executeNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE,
      DefaultRoleProfileId.CODER,
    );
    const reportNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REPORT,
      DefaultRoleProfileId.REVIEWER,
    );

    return {
      assemblyMode:
        assemblyReason === CliTaskDrivenRunAssemblyReason.NO_TASK_ID
          ? CliTaskDrivenRunAssemblyMode.BASELINE
          : CliTaskDrivenRunAssemblyMode.TASK_ID_FALLBACK,
      assemblyReason,
      processDefinition: {
        processId: "cli-minimal-governance-run",
        executionId,
        entryNodeId: prepareNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId,
        nodes: [prepareNode, executeNode, reportNode],
        edges: [
          {
            fromNodeId: prepareNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId,
            toNodeId: executeNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE.nodeId,
          },
          {
            fromNodeId: executeNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE.nodeId,
            toNodeId: reportNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REPORT.nodeId,
          },
        ],
        globals: {
          assemblyMode:
            assemblyReason === CliTaskDrivenRunAssemblyReason.NO_TASK_ID
              ? CliTaskDrivenRunAssemblyMode.BASELINE
              : CliTaskDrivenRunAssemblyMode.TASK_ID_FALLBACK,
          assemblyReason,
        },
      },
      stageInputs: {
        [CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId]: {
          phase: "prepare",
          assemblyMode:
            assemblyReason === CliTaskDrivenRunAssemblyReason.NO_TASK_ID
              ? CliTaskDrivenRunAssemblyMode.BASELINE
              : CliTaskDrivenRunAssemblyMode.TASK_ID_FALLBACK,
        },
        [CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE.nodeId]: {
          phase: "execute",
        },
        [CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REPORT.nodeId]: {
          phase: "report",
        },
      },
      taskContext: null,
      executionRoleProfileId: DefaultRoleProfileId.CODER,
      verificationRoleProfileId: null,
    };
  }

  /**
   * Creates task-driven assembly when task card metadata is available.
   * @param executionId Runtime execution id.
   * @param taskContext Parsed task-card context.
   * @param adaptersConfig Active adapters config.
   * @returns Task-driven run assembly.
   */
  private createTaskDrivenAssembly(
    executionId: string,
    taskContext: CliTaskCardContext,
    adaptersConfig: AdaptersConfig,
  ): CliTaskDrivenRunAssembly {
    const prepareRoleProfileId = this.resolveAvailableRoleProfileId(
      adaptersConfig,
      DefaultRoleProfileId.PLANNER,
      DefaultRoleProfileId.CODER,
    );
    const reportRoleProfileId = this.resolveAvailableRoleProfileId(
      adaptersConfig,
      DefaultRoleProfileId.REVIEWER,
      DefaultRoleProfileId.PLANNER,
      DefaultRoleProfileId.CODER,
    );
    const executionRoleProfileId = this.resolveExecutionRoleProfileId(taskContext, adaptersConfig);
    const verificationRoleProfileId = this.resolveVerificationRoleProfileId(
      taskContext,
      adaptersConfig,
    );
    const includeArtifactContextStage = taskContext.inputArtifacts.length > 0;
    const includeVerificationStage = Boolean(verificationRoleProfileId);

    const nodes: ProcessDslNode[] = [];
    const stageInputs: RuntimeStageInputMap = {};
    const commonTaskContextPayload = {
      taskId: taskContext.taskId,
      taskTitle: taskContext.title,
      taskGoal: taskContext.goal,
      taskCardPath: taskContext.taskCardPath,
      dependsOnTaskIds: taskContext.dependsOnTaskIds,
      inputReferences: taskContext.inputReferences,
      inputArtifacts: taskContext.inputArtifacts,
      tracebackReferences: taskContext.tracebackReferences,
    };

    const prepareNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE,
      prepareRoleProfileId,
    );
    nodes.push(prepareNode);
    stageInputs[prepareNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId] = {
      phase: "prepare",
      ...commonTaskContextPayload,
    };

    let previousNodeId = prepareNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId;
    const edges: ProcessDslDefinition["edges"] = [];

    if (includeArtifactContextStage) {
      const artifactContextNode = this.createNode(
        CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.ARTIFACT_CONTEXT,
        prepareRoleProfileId,
      );
      nodes.push(artifactContextNode);
      const artifactContextNodeId =
        artifactContextNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.ARTIFACT_CONTEXT.nodeId;
      edges.push({
        fromNodeId: previousNodeId,
        toNodeId: artifactContextNodeId,
      });
      stageInputs[artifactContextNodeId] = {
        phase: "artifact_context",
        ...commonTaskContextPayload,
      };
      previousNodeId = artifactContextNodeId;
    }

    const executeNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE,
      executionRoleProfileId,
    );
    nodes.push(executeNode);
    const executeNodeId = executeNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.EXECUTE.nodeId;
    edges.push({
      fromNodeId: previousNodeId,
      toNodeId: executeNodeId,
    });
    stageInputs[executeNodeId] = {
      phase: "execute",
      executionRoleProfileId,
      ...commonTaskContextPayload,
    };
    previousNodeId = executeNodeId;

    if (includeVerificationStage && verificationRoleProfileId) {
      const verifyNode = this.createNode(
        CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.VERIFY,
        verificationRoleProfileId,
      );
      nodes.push(verifyNode);
      const verifyNodeId = verifyNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.VERIFY.nodeId;
      edges.push({
        fromNodeId: previousNodeId,
        toNodeId: verifyNodeId,
      });
      stageInputs[verifyNodeId] = {
        phase: "verify",
        verificationRoleProfileId,
        ...commonTaskContextPayload,
      };
      previousNodeId = verifyNodeId;
    }

    const reportNode = this.createNode(
      CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REPORT,
      reportRoleProfileId,
    );
    nodes.push(reportNode);
    const reportNodeId = reportNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.REPORT.nodeId;
    edges.push({
      fromNodeId: previousNodeId,
      toNodeId: reportNodeId,
    });
    stageInputs[reportNodeId] = {
      phase: "report",
      executionRoleProfileId,
      verificationRoleProfileId,
      ...commonTaskContextPayload,
    };

    return {
      assemblyMode: CliTaskDrivenRunAssemblyMode.TASK_DRIVEN,
      assemblyReason: CliTaskDrivenRunAssemblyReason.TASK_CONTEXT_LOADED,
      processDefinition: {
        processId: "cli-task-driven-governance-run",
        executionId,
        entryNodeId: prepareNode.nodeId ?? CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS.PREPARE.nodeId,
        nodes,
        edges,
        globals: {
          assemblyMode: CliTaskDrivenRunAssemblyMode.TASK_DRIVEN,
          assemblyReason: CliTaskDrivenRunAssemblyReason.TASK_CONTEXT_LOADED,
          executionRoleProfileId,
          verificationRoleProfileId,
          taskContext: commonTaskContextPayload,
        },
      },
      stageInputs,
      taskContext,
      executionRoleProfileId,
      verificationRoleProfileId,
    };
  }

  /**
   * Resolves execution role profile from task title/goal keywords and configured role bindings.
   * @param taskContext Parsed task-card context.
   * @param adaptersConfig Active adapters config.
   * @returns Selected execution role profile id.
   */
  private resolveExecutionRoleProfileId(
    taskContext: CliTaskCardContext,
    adaptersConfig: AdaptersConfig,
  ): string {
    const normalizedText = `${taskContext.title} ${taskContext.goal}`.toLowerCase();
    if (
      this.matchesAnyKeyword(normalizedText, CLI_TASK_DRIVEN_RUN_KEYWORDS.TESTER) &&
      this.hasRoleBinding(adaptersConfig, DefaultRoleProfileId.TESTER)
    ) {
      return DefaultRoleProfileId.TESTER;
    }

    if (
      this.matchesAnyKeyword(normalizedText, CLI_TASK_DRIVEN_RUN_KEYWORDS.REVIEWER) &&
      this.hasRoleBinding(adaptersConfig, DefaultRoleProfileId.REVIEWER)
    ) {
      return DefaultRoleProfileId.REVIEWER;
    }

    return this.resolveAvailableRoleProfileId(
      adaptersConfig,
      DefaultRoleProfileId.CODER,
      DefaultRoleProfileId.TESTER,
      DefaultRoleProfileId.PLANNER,
    );
  }

  /**
   * Resolves optional dedicated verification role from task context and configured bindings.
   * @param taskContext Parsed task-card context.
   * @param adaptersConfig Active adapters config.
   * @returns Verification role id or null when not needed/available.
   */
  private resolveVerificationRoleProfileId(
    taskContext: CliTaskCardContext,
    adaptersConfig: AdaptersConfig,
  ): string | null {
    const normalizedText = `${taskContext.title} ${taskContext.goal}`.toLowerCase();
    const requiresVerification =
      taskContext.inputArtifacts.length > 0 ||
      taskContext.dependsOnTaskIds.length > 0 ||
      this.matchesAnyKeyword(normalizedText, CLI_TASK_DRIVEN_RUN_KEYWORDS.TESTER) ||
      this.matchesAnyKeyword(normalizedText, CLI_TASK_DRIVEN_RUN_KEYWORDS.VERIFIER) ||
      this.matchesAnyKeyword(normalizedText, CLI_TASK_DRIVEN_RUN_KEYWORDS.REVIEWER);

    if (!requiresVerification) {
      return null;
    }

    if (this.hasRoleBinding(adaptersConfig, DefaultRoleProfileId.VERIFIER)) {
      return DefaultRoleProfileId.VERIFIER;
    }

    if (this.hasRoleBinding(adaptersConfig, DefaultRoleProfileId.TESTER)) {
      return DefaultRoleProfileId.TESTER;
    }

    return null;
  }

  /**
   * Resolves first available role profile id from ordered candidates.
   * @param adaptersConfig Active adapters config.
   * @param roleProfileIds Preferred role profile ids in priority order.
   * @returns Selected role profile id.
   */
  private resolveAvailableRoleProfileId(
    adaptersConfig: AdaptersConfig,
    ...roleProfileIds: string[]
  ): string {
    for (const roleProfileId of roleProfileIds) {
      if (this.hasRoleBinding(adaptersConfig, roleProfileId)) {
        return roleProfileId;
      }
    }

    return roleProfileIds[0] ?? DefaultRoleProfileId.PLANNER;
  }

  /**
   * Checks whether one role profile id has both role row and routing binding.
   * @param adaptersConfig Active adapters config.
   * @param roleProfileId Role profile id candidate.
   * @returns True when the role can participate in run-stage routing.
   */
  private hasRoleBinding(adaptersConfig: AdaptersConfig, roleProfileId: string): boolean {
    const roleConfig = adaptersConfig.roles.find((role) => role.roleProfileId === roleProfileId);
    if (!roleConfig) {
      return false;
    }

    return Boolean(adaptersConfig.routing.roleBindings[roleConfig.roleId]);
  }

  /**
   * Creates one normalized process node for task-driven assembly.
   * @param nodeDefinition Stable node metadata.
   * @param roleProfileId Role profile id selected for this stage.
   * @returns Process DSL node.
   */
  private createNode(
    nodeDefinition: (typeof CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS)[keyof typeof CLI_TASK_DRIVEN_RUN_NODE_DEFINITIONS],
    roleProfileId: string,
  ): ProcessDslNode {
    return {
      nodeId: nodeDefinition.nodeId,
      stageId: nodeDefinition.stageId,
      nodeType: ProcessNodeType.SEQUENTIAL,
      routeKey: nodeDefinition.routeKey,
      roleProfileId,
      inputSchemaRef: `schemas/${nodeDefinition.stageId}-input.json`,
      outputSchemaRef: `schemas/${nodeDefinition.stageId}-output.json`,
      retryPolicyRef: PROCESS_POLICY_RETRY_REF,
      timeoutPolicyRef: PROCESS_POLICY_TIMEOUT_REF,
      budgetPolicyRef: PROCESS_POLICY_BUDGET_REF,
    };
  }

  /**
   * Checks whether normalized text contains any configured keyword.
   * @param normalizedText Lowercased text.
   * @param keywords Keyword bucket.
   * @returns True when any keyword matches.
   */
  private matchesAnyKeyword(normalizedText: string, keywords: readonly string[]): boolean {
    return keywords.some((keyword) => normalizedText.includes(keyword.toLowerCase()));
  }
}
