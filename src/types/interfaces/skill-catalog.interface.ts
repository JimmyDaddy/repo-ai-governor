import type {
  SkillCatalogId,
  SkillCatalogKind,
  SkillCatalogSchemaVersion,
  SkillDistributionChannel,
  SkillManifestKind,
} from "../aliases/skill-catalog.type.js";
import type { SkillInstallMode, SkillSurface } from "../aliases/skill.type.js";

export interface SkillManifestEntry {
  skillFile: "SKILL.md";
  agentFiles: string[];
  scriptsDir: string;
  templatesDir: string;
  referencesDir: string;
}

export interface SkillManifest {
  schemaVersion: SkillCatalogSchemaVersion;
  id: string;
  version: string;
  kind: SkillManifestKind;
  displayName: string;
  description: string;
  surfaces: SkillSurface[];
  entry: SkillManifestEntry;
  triggers: {
    keywords: string[];
    intents: string[];
  };
  compatibility: {
    repoAiGovernor: string;
    installModes: Partial<Record<SkillSurface, SkillInstallMode>>;
  };
  distribution: {
    channel: SkillDistributionChannel;
    root: string;
  };
}

export interface SkillCatalogInstallTarget {
  repoLocal: string;
  userLocal: string;
  mode: SkillInstallMode;
}

export interface SkillCatalogEntry {
  id: string;
  manifestPath: string;
  surfaces: SkillSurface[];
  defaultInstallMode: SkillInstallMode;
}

export interface SkillCatalog {
  schemaVersion: SkillCatalogSchemaVersion;
  id: SkillCatalogId;
  version: string;
  kind: SkillCatalogKind;
  packageRoot: "skills";
  officialRoot: "skills/official";
  sharedRoot: "skills/shared";
  compatibility: {
    repoAiGovernor: string;
  };
  installTargets: Record<SkillSurface, SkillCatalogInstallTarget>;
  skills: SkillCatalogEntry[];
}

export interface OfficialSkillCatalogEntry extends SkillCatalogEntry {
  manifest: SkillManifest;
  manifestPath: string;
  skillRoot: string;
  skillFilePath: string;
}

export interface OfficialSkillCatalogState {
  cwd: string;
  catalogPath: string;
  packageRoot: string;
  catalog: SkillCatalog;
  skills: OfficialSkillCatalogEntry[];
}
