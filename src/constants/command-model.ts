export enum CommandFindingSeverityEnum {
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export const COMMAND_FINDING_SEVERITIES = Object.freeze(
  Object.values(CommandFindingSeverityEnum),
) as readonly `${CommandFindingSeverityEnum}`[];

export enum CommandFindingStatusEnum {
  Pass = "pass",
  Warn = "warn",
  Fail = "fail",
  Fixed = "fixed",
}

export const COMMAND_FINDING_STATUSES = Object.freeze(
  Object.values(CommandFindingStatusEnum),
) as readonly `${CommandFindingStatusEnum}`[];

export enum CommandResultStatusEnum {
  Pass = "pass",
  Warn = "warn",
  Fail = "fail",
}

export const COMMAND_RESULT_STATUSES = Object.freeze(
  Object.values(CommandResultStatusEnum),
) as readonly `${CommandResultStatusEnum}`[];

export enum CommandFindingKindEnum {
  Directory = "directory",
  File = "file",
}

export const COMMAND_FINDING_KINDS = Object.freeze(
  Object.values(CommandFindingKindEnum),
) as readonly `${CommandFindingKindEnum}`[];

export enum UpgradeStatusEnum {
  Planned = "planned",
  Upgraded = "upgraded",
}

export const UPGRADE_STATUSES = Object.freeze(
  Object.values(UpgradeStatusEnum),
) as readonly `${UpgradeStatusEnum}`[];

export enum CommandNameEnum {
  Doctor = "doctor",
  Upgrade = "upgrade",
}

export const COMMAND_NAMES = Object.freeze(
  Object.values(CommandNameEnum),
) as readonly `${CommandNameEnum}`[];

export const DOCTOR_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Doctor,
]) as readonly `${CommandNameEnum.Doctor}`[];

export const UPGRADE_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Upgrade,
]) as readonly `${CommandNameEnum.Upgrade}`[];

export enum CommandFileActionEnum {
  Update = "update",
}

export const COMMAND_FILE_ACTIONS = Object.freeze(
  Object.values(CommandFileActionEnum),
) as readonly `${CommandFileActionEnum}`[];

export const UPDATE_FILE_ACTIONS = Object.freeze([
  CommandFileActionEnum.Update,
]) as readonly `${CommandFileActionEnum.Update}`[];
