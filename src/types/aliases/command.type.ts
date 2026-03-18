import type {
  COMMAND_FILE_ACTIONS,
  COMMAND_FINDING_KINDS,
  COMMAND_FINDING_SEVERITIES,
  COMMAND_FINDING_STATUSES,
  COMMAND_NAMES,
  COMMAND_RESULT_STATUSES,
  DOCTOR_COMMAND_NAMES,
  UPDATE_FILE_ACTIONS,
  UPGRADE_COMMAND_NAMES,
  UPGRADE_STATUSES,
} from "../../constants/command-model.js";

// biome-ignore lint/suspicious/noExplicitAny: transitional command migration still relies on loose records
export type AnyRecord = Record<string, any>;

export type VersionParts = [number, number, number];

export type FindingSeverity = (typeof COMMAND_FINDING_SEVERITIES)[number];

export type FindingStatus = (typeof COMMAND_FINDING_STATUSES)[number];

export type CommandResultStatus = (typeof COMMAND_RESULT_STATUSES)[number];

export type FindingKind = (typeof COMMAND_FINDING_KINDS)[number];

export type UpgradeStatus = (typeof UPGRADE_STATUSES)[number];

export type CommandName = (typeof COMMAND_NAMES)[number];

export type DoctorCommandName = (typeof DOCTOR_COMMAND_NAMES)[number];

export type UpgradeCommandName = (typeof UPGRADE_COMMAND_NAMES)[number];

export type CommandFileAction = (typeof COMMAND_FILE_ACTIONS)[number];

export type UpdateFileAction = (typeof UPDATE_FILE_ACTIONS)[number];
