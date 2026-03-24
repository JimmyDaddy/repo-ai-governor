import type { ProcessDslDefinition } from "@repo-ai-governor/core-process";
import type { RuntimeStageInputMap } from "@repo-ai-governor/core-runtime";
import type {
  CliTaskDrivenRunAssemblyMode,
  CliTaskDrivenRunAssemblyReason,
} from "../../constants/cli-task-driven-run.constant.js";

/**
 * Defines one artifact input reference parsed from a task card.
 */
export interface CliTaskInputArtifactReference {
  artifactId: string;
  artifactPath: string | null;
}

/**
 * Defines one raw input reference parsed from a task card input section.
 */
export interface CliTaskInputReference {
  artifactId: string | null;
  referencePath: string | null;
  referenceText: string;
}

/**
 * Defines normalized task-card context consumed by task-driven run assembly.
 */
export interface CliTaskCardContext {
  taskId: string;
  taskCardPath: string;
  title: string;
  goal: string;
  dependsOnTaskIds: string[];
  inputReferences: CliTaskInputReference[];
  inputArtifacts: CliTaskInputArtifactReference[];
  tracebackReferences: CliTaskInputReference[];
}

/**
 * Defines one assembled run payload combining process DSL and stage inputs.
 */
export interface CliTaskDrivenRunAssembly {
  assemblyMode: CliTaskDrivenRunAssemblyMode;
  assemblyReason: CliTaskDrivenRunAssemblyReason;
  processDefinition: ProcessDslDefinition;
  stageInputs: RuntimeStageInputMap;
  taskContext: CliTaskCardContext | null;
  executionRoleProfileId: string;
  verificationRoleProfileId: string | null;
}
