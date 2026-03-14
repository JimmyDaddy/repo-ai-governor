import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { loadResolvedConfig } from "../config/load-config.js";
import { buildDefaultGovernorConfig } from "../config/schema/validator.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import {
  applyConfigRootOverrides,
  applyInitDefaults,
  buildGeneratedWorkspaceFiles,
  formatDate,
  toRelativePath
} from "./bootstrap-shared.js";

const SUPPORTED_SCHEMA_VERSIONS = new Set(["1"]);

function parseGovernorDocument(filePath) {
  try {
    const rawContent = fs.readFileSync(filePath, "utf8");
    const document = YAML.parse(rawContent);
    return {
      rawContent,
      document: document && typeof document === "object" ? document : {}
    };
  } catch (error) {
    throw new ConfigError(`Failed to read upgrade source config: ${filePath}`, {
      code: "cli.upgrade_read_failed",
      details: {
        filePath,
        cause: error instanceof Error ? error.message : String(error)
      }
    });
  }
}

function buildBackupDirectory(cwd, timestamp) {
  return path.resolve(cwd, ".repo-ai-governor", "backups", `upgrade-${timestamp}`);
}

function listUpgradeFiles(workspaceFiles) {
  return [
    workspaceFiles.filesByKey.config,
    workspaceFiles.filesByKey.agentEntry,
    workspaceFiles.filesByKey.currentContext
  ];
}

function buildUpgradePlan(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const targetVersion = commandContext.commandOptions.toVersion ?? "1";

  if (!SUPPORTED_SCHEMA_VERSIONS.has(targetVersion)) {
    throw new InputError(`Unsupported upgrade target version: ${targetVersion}`, {
      code: "cli.upgrade_unsupported_target",
      details: {
        targetVersion,
        supportedVersions: [...SUPPORTED_SCHEMA_VERSIONS]
      }
    });
  }

  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: commandContext.globalOptions.config,
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions
    }
  });

  if (!fs.existsSync(resolvedConfig.paths.configFile)) {
    throw new ConfigError("Upgrade requires an existing repository config file.", {
      code: "cli.upgrade_missing_config",
      details: {
        configFile: resolvedConfig.paths.configFile
      }
    });
  }

  const { document: currentDocument } = parseGovernorDocument(resolvedConfig.paths.configFile);
  const currentVersion = currentDocument.schemaVersion ?? "unversioned";
  const dateStamp = formatDate();
  const upgradedConfig = applyConfigRootOverrides(
    applyInitDefaults(structuredClone(resolvedConfig.config), cwd),
    cwd,
    resolvedConfig.paths.configFile
  );
  upgradedConfig.schemaVersion = targetVersion;

  const workspaceFiles = buildGeneratedWorkspaceFiles({
    cwd,
    config: upgradedConfig,
    configFilePath: resolvedConfig.paths.configFile,
    dateStamp
  });
  const upgradeFiles = listUpgradeFiles(workspaceFiles);
  const preview = commandContext.commandOptions.preview === true || commandContext.globalOptions.dryRun === true;
  const backup = commandContext.commandOptions.backup === true;
  const backupDir = backup ? buildBackupDirectory(cwd, new Date().toISOString().replace(/[:.]/g, "-")) : null;
  const warnings = [];

  if (currentVersion === targetVersion) {
    warnings.push(
      `Schema version is already ${targetVersion}; upgrade will normalize config and regenerate generated entry files.`
    );
  }

  if (currentDocument.schemaVersion === undefined) {
    warnings.push("Current config did not declare schemaVersion explicitly; upgrade will write schemaVersion=1.");
  }

  return {
    cwd,
    currentVersion,
    targetVersion,
    preview,
    backup,
    backupDir,
    resolvedConfig,
    upgradedConfig,
    upgradeFiles,
    warnings,
    currentDefaults: buildDefaultGovernorConfig()
  };
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeBackupFiles(plan) {
  if (!plan.backupDir) {
    return [];
  }

  const backupTargets = [];

  for (const file of plan.upgradeFiles) {
    if (!fs.existsSync(file.path)) {
      continue;
    }

    const backupPath = path.resolve(plan.backupDir, toRelativePath(plan.cwd, file.path));
    ensureParentDirectory(backupPath);
    fs.copyFileSync(file.path, backupPath);
    backupTargets.push(backupPath);
  }

  return backupTargets;
}

function writeUpgradeFiles(plan) {
  for (const file of plan.upgradeFiles) {
    ensureParentDirectory(file.path);
    fs.writeFileSync(file.path, file.content, "utf8");
  }
}

function createUpgradePayload(plan, backupTargets) {
  return {
    command: "upgrade",
    status: plan.preview ? "planned" : "upgraded",
    cwd: plan.cwd,
    currentVersion: plan.currentVersion,
    targetVersion: plan.targetVersion,
    preview: plan.preview,
    backup: plan.backup,
    backupDir: plan.backupDir ? toRelativePath(plan.cwd, plan.backupDir) : null,
    warnings: plan.warnings,
    operations: plan.upgradeFiles.map((file) => ({
      action: "update",
      path: toRelativePath(plan.cwd, file.path)
    })),
    backups: backupTargets.map((backupPath) => toRelativePath(plan.cwd, backupPath))
  };
}

function writeUpgradeSummary(logger, payload, format) {
  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# upgrade",
        "",
        `- Status: ${payload.status}`,
        `- Current version: \`${payload.currentVersion}\``,
        `- Target version: \`${payload.targetVersion}\``,
        `- Preview: ${payload.preview}`,
        `- Backup: ${payload.backup}`,
        `- Backup dir: \`${payload.backupDir ?? "none"}\``,
        `- Operations: \`${JSON.stringify(payload.operations)}\``,
        `- Warnings: \`${JSON.stringify(payload.warnings)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  logger.success(payload.preview ? "upgrade plan is ready" : "repository upgrade completed");
  logger.keyValue("Current version", payload.currentVersion);
  logger.keyValue("Target version", payload.targetVersion);
  logger.keyValue("Preview", String(payload.preview));
  logger.keyValue("Backup", String(payload.backup));

  if (payload.backupDir) {
    logger.keyValue("Backup dir", payload.backupDir);
  }

  logger.keyValue("Operations", JSON.stringify(payload.operations));

  for (const warning of payload.warnings) {
    logger.warn(warning);
  }
}

export async function executeUpgradeCommand(commandContext, logger) {
  const plan = buildUpgradePlan(commandContext);
  const backupTargets = plan.preview ? [] : writeBackupFiles(plan);

  if (!plan.preview) {
    writeUpgradeFiles(plan);
  }

  const payload = createUpgradePayload(plan, backupTargets);
  writeUpgradeSummary(logger, payload, commandContext.format);
  return 0;
}
