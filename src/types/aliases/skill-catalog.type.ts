import type {
  SKILL_CATALOG_IDS,
  SKILL_CATALOG_KINDS,
  SKILL_CATALOG_SCHEMA_VERSIONS,
  SKILL_DISTRIBUTION_CHANNELS,
  SKILL_MANIFEST_KINDS,
} from "../../constants/skill-catalog.js";

export type SkillManifestKind = (typeof SKILL_MANIFEST_KINDS)[number];

export type SkillDistributionChannel = (typeof SKILL_DISTRIBUTION_CHANNELS)[number];

export type SkillCatalogKind = (typeof SKILL_CATALOG_KINDS)[number];

export type SkillCatalogId = (typeof SKILL_CATALOG_IDS)[number];

export type SkillCatalogSchemaVersion = (typeof SKILL_CATALOG_SCHEMA_VERSIONS)[number];
