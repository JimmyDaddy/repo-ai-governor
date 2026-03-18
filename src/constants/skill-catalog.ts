export enum SkillManifestKindEnum {
  GovernorSkill = "governor-skill",
}

export const SKILL_MANIFEST_KINDS = Object.freeze(
  Object.values(SkillManifestKindEnum),
) as readonly `${SkillManifestKindEnum}`[];

export enum SkillDistributionChannelEnum {
  Official = "official",
  ProjectLocal = "project-local",
  TeamShared = "team-shared",
}

export const SKILL_DISTRIBUTION_CHANNELS = Object.freeze(
  Object.values(SkillDistributionChannelEnum),
) as readonly `${SkillDistributionChannelEnum}`[];

export enum SkillCatalogKindEnum {
  SkillCatalog = "skill-catalog",
}

export const SKILL_CATALOG_KINDS = Object.freeze(
  Object.values(SkillCatalogKindEnum),
) as readonly `${SkillCatalogKindEnum}`[];

export enum SkillCatalogIdEnum {
  Official = "repo-ai-governor-official",
}

export const SKILL_CATALOG_IDS = Object.freeze(
  Object.values(SkillCatalogIdEnum),
) as readonly `${SkillCatalogIdEnum}`[];

export enum SkillCatalogSchemaVersionEnum {
  V1 = "1",
}

export const SKILL_CATALOG_SCHEMA_VERSIONS = Object.freeze(
  Object.values(SkillCatalogSchemaVersionEnum),
) as readonly `${SkillCatalogSchemaVersionEnum}`[];
