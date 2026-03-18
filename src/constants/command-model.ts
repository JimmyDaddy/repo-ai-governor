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
  Report = "report",
  Review = "review",
  ReviewVerify = "review-verify",
  Skills = "skills",
  Doctor = "doctor",
  Upgrade = "upgrade",
}

export const COMMAND_NAMES = Object.freeze(
  Object.values(CommandNameEnum),
) as readonly `${CommandNameEnum}`[];

export const DOCTOR_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Doctor,
]) as readonly `${CommandNameEnum.Doctor}`[];

export const REPORT_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Report,
]) as readonly `${CommandNameEnum.Report}`[];

export const REVIEW_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Review,
]) as readonly `${CommandNameEnum.Review}`[];

export const REVIEW_VERIFY_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.ReviewVerify,
]) as readonly `${CommandNameEnum.ReviewVerify}`[];

export const SKILLS_COMMAND_NAMES = Object.freeze([
  CommandNameEnum.Skills,
]) as readonly `${CommandNameEnum.Skills}`[];

export enum ReportCommandStatusEnum {
  Rendered = "rendered",
}

export const REPORT_COMMAND_STATUSES = Object.freeze(
  Object.values(ReportCommandStatusEnum),
) as readonly `${ReportCommandStatusEnum}`[];

export enum SkillsInstallCommandStatusEnum {
  Planned = "planned",
  Installed = "installed",
}

export const SKILLS_INSTALL_COMMAND_STATUSES = Object.freeze(
  Object.values(SkillsInstallCommandStatusEnum),
) as readonly `${SkillsInstallCommandStatusEnum}`[];

export enum SkillsListCommandStatusEnum {
  Listed = "listed",
}

export const SKILLS_LIST_COMMAND_STATUSES = Object.freeze(
  Object.values(SkillsListCommandStatusEnum),
) as readonly `${SkillsListCommandStatusEnum}`[];

export enum InstalledSkillStatusEnum {
  Installed = "installed",
  External = "external",
  Invalid = "invalid",
}

export const INSTALLED_SKILL_STATUSES = Object.freeze(
  Object.values(InstalledSkillStatusEnum),
) as readonly `${InstalledSkillStatusEnum}`[];

export enum SkillInstallOperationStatusEnum {
  Installed = "installed",
  Planned = "planned",
  Skipped = "skipped",
}

export const SKILL_INSTALL_OPERATION_STATUSES = Object.freeze(
  Object.values(SkillInstallOperationStatusEnum),
) as readonly `${SkillInstallOperationStatusEnum}`[];

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
