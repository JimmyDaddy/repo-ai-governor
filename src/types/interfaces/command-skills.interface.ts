import type {
  OfficialSkillCatalogEntry,
  OfficialSkillCatalogState,
  loadSkillManifest,
} from "../../skills/catalog.js";
import type { SkillInstallMode, SkillSurface } from "../../skills/package-layout.js";
import type { ResolvedSkillInstallTarget, SkillScope } from "../../skills/runtime.js";
import type {
  CommandResultStatus,
  FindingSeverity,
  FindingStatus,
  InstallOperationStatus,
  InstalledSkillStatus,
  SkillInstallCommandStatus,
  SkillListCommandStatus,
  SkillsCommandName,
} from "../aliases/command.type.js";
import type { ExitCode } from "../aliases/index.js";
import type {
  DoctorSkillAction,
  InstallSkillAction,
  ListSkillAction,
  SkillAction,
} from "../aliases/skill-action.type.js";

export interface SkillFinding {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target?: string;
  suggestion?: string;
}

export interface SkillFindingInput {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target?: string;
  suggestion?: string;
}

export interface InstalledSkill {
  id: string;
  skillRoot: string;
  manifestPath: string;
  skillFilePath: string;
  status: InstalledSkillStatus;
  issues: string[];
  manifest: ReturnType<typeof loadSkillManifest> | null;
}

export interface SkillState {
  cwd: string;
  locale: string;
  action: SkillAction;
  surface: SkillSurface | null;
  scope: SkillScope;
  strict: boolean;
  dryRun: boolean;
  force: boolean;
  targetPath: string | undefined;
  selectedSkillIds: string[];
  catalogState: OfficialSkillCatalogState;
}

export interface SkillDiscovery {
  target: ResolvedSkillInstallTarget;
  installedSkills: InstalledSkill[];
}

export interface SkillSummary {
  errors: number;
  warnings: number;
}

export interface SkillsSummary extends SkillSummary {
  surfaces: SkillSurface[];
}

export interface AvailableSkillItem {
  id: string;
  displayName: string;
  version: string;
  surfaces: SkillSurface[];
  defaultInstallMode: SkillInstallMode;
}

export interface InstalledSkillItem {
  id: string;
  surface: SkillSurface;
  scope: SkillScope;
  status: InstalledSkillStatus;
  path: string;
  version: string | null;
  displayName: string | null;
  issues: string[];
}

export interface InstallOperation {
  id: string;
  status: InstallOperationStatus;
  path: string;
  reason?: string;
  mode?: SkillInstallMode;
}

export interface ListPayload {
  command: SkillsCommandName;
  action: ListSkillAction;
  locale: string;
  status: SkillListCommandStatus;
  cwd: string;
  scope: SkillScope;
  surface: SkillSurface | null;
  catalogFile: string;
  summary: {
    available: number;
    installed: number;
    surfaces: SkillSurface[];
  };
  availableSkills: AvailableSkillItem[];
  installedSkills: InstalledSkillItem[];
}

export interface InstallPayload {
  command: SkillsCommandName;
  action: InstallSkillAction;
  locale: string;
  status: SkillInstallCommandStatus;
  cwd: string;
  scope: SkillScope;
  surface: SkillSurface;
  dryRun: boolean;
  force: boolean;
  catalogFile: string;
  targetRoot: string;
  summary: {
    selected: number;
    installed: number;
    planned: number;
    skipped: number;
  };
  operations: InstallOperation[];
  warnings: string[];
}

export interface SkillsDoctorPayload {
  command: SkillsCommandName;
  action: DoctorSkillAction;
  locale: string;
  status: CommandResultStatus;
  cwd: string;
  scope: SkillScope;
  surface: SkillSurface | null;
  strict: boolean;
  catalogFile: string;
  findings: SkillFinding[];
  summary: SkillsSummary;
  exitCode: ExitCode;
}

export interface SkillsRenderPayload {
  action: SkillAction;
  status: string;
  locale: string;
  surface?: SkillSurface | null;
  scope?: SkillScope;
  catalogFile?: string;
  targetRoot?: string;
  summary?: unknown;
  availableSkills?: AvailableSkillItem[];
  installedSkills?: InstalledSkillItem[];
  operations?: InstallOperation[];
  warnings?: string[];
  findings?: SkillFinding[];
}

export interface SkillCatalogFilterOptions {
  state: SkillState;
  entries: OfficialSkillCatalogEntry[];
  surface: SkillSurface | null;
}
