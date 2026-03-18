export enum SkillActionEnum {
  Install = "install",
  List = "list",
  Doctor = "doctor",
}

export const SUPPORTED_SKILL_ACTIONS = Object.freeze(
  Object.values(SkillActionEnum),
) as readonly `${SkillActionEnum}`[];

export const LIST_SKILL_ACTIONS = Object.freeze([
  SkillActionEnum.List,
]) as readonly `${SkillActionEnum.List}`[];

export const INSTALL_SKILL_ACTIONS = Object.freeze([
  SkillActionEnum.Install,
]) as readonly `${SkillActionEnum.Install}`[];

export const DOCTOR_SKILL_ACTIONS = Object.freeze([
  SkillActionEnum.Doctor,
]) as readonly `${SkillActionEnum.Doctor}`[];
