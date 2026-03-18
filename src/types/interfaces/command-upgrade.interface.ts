import type {
  UpdateFileAction,
  UpgradeCommandName,
  UpgradeStatus,
} from "../aliases/command.type.js";
import type { GenericRecord, ResolvedConfigState } from "../aliases/index.js";

export interface GovernorDocument extends GenericRecord {
  schemaVersion?: string;
}

export interface UpgradeFile {
  path: string;
  content: string;
  action: UpdateFileAction;
}

export interface UpgradePlan {
  cwd: string;
  locale: string;
  currentVersion: string;
  targetVersion: string;
  preview: boolean;
  backup: boolean;
  backupDir: string | null;
  resolvedConfig: ResolvedConfigState;
  upgradeFiles: UpgradeFile[];
  warnings: string[];
}

export interface UpgradeOperation {
  action: UpdateFileAction;
  path: string;
}

export interface UpgradePayload {
  command: UpgradeCommandName;
  status: UpgradeStatus;
  locale: string;
  cwd: string;
  currentVersion: string;
  targetVersion: string;
  preview: boolean;
  backup: boolean;
  backupDir: string | null;
  warnings: string[];
  operations: UpgradeOperation[];
  backups: string[];
}
