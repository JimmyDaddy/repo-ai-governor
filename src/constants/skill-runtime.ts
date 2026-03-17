export enum SkillScopeEnum {
  Repo = "repo",
  User = "user",
}

export const SUPPORTED_SKILL_SCOPES = Object.freeze(
  Object.values(SkillScopeEnum),
) as readonly `${SkillScopeEnum}`[];
