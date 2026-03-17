export enum SkillActionEnum {
  Install = "install",
  List = "list",
  Doctor = "doctor"
}

export type SkillAction = `${SkillActionEnum}`;

export const SUPPORTED_SKILL_ACTIONS = Object.freeze(
  Object.values(SkillActionEnum),
) as readonly SkillAction[];
