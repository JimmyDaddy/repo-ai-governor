import type {
  DeclarativeSlotDefinition,
  ScriptSlotDefinition,
  SlotSecurityEvaluation,
} from "../interfaces/index.js";

/**
 * Defines union alias for slot definitions.
 */
export type SlotDefinition = DeclarativeSlotDefinition | ScriptSlotDefinition;

/**
 * Defines ordered slot-definition collection type.
 */
export type SlotDefinitionList = SlotDefinition[];

/**
 * Defines map shape for script security lookup by slot id.
 */
export type SlotSecurityEvaluationBySlotId = Map<string, SlotSecurityEvaluation>;
