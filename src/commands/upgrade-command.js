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
import { normalizeLocale, translateLocale } from "../utils/common.js";

const SUPPORTED_SCHEMA_VERSIONS = new Set(["1"]);

function t(locale, zhCN, enUS) {
  return translateLocale(locale, zhCN, enUS);
}

function parseGovernorDocument(filePath, locale = "zh-CN") {
  try {
    const rawContent = fs.readFileSync(filePath, "utf8");
    const document = YAML.parse(rawContent);
    return {
      rawContent,
      document: document && typeof document === "object" ? document : {}
    };
  } catch (error) {
    throw new ConfigError(
      t(locale, `读取升级来源配置失败：${filePath}`, `Failed to read upgrade source config: ${filePath}`),
      {
        code: "cli.upgrade_read_failed",
        details: {
          filePath,
          cause: error instanceof Error ? error.message : String(error)
        }
      }
    );
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
  const requestedLocale = normalizeLocale(commandContext.globalOptions.locale);
  const targetVersion = commandContext.commandOptions.toVersion ?? "1";

  if (!SUPPORTED_SCHEMA_VERSIONS.has(targetVersion)) {
    throw new InputError(
      t(
        requestedLocale,
        `不支持的升级目标版本：${targetVersion}`,
        `Unsupported upgrade target version: ${targetVersion}`
      ),
      {
        code: "cli.upgrade_unsupported_target",
        details: {
          targetVersion,
          supportedVersions: [...SUPPORTED_SCHEMA_VERSIONS]
        }
      }
    );
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
    throw new ConfigError(
      t(
        requestedLocale,
        "upgrade 命令需要仓库中已有配置文件。",
        "Upgrade requires an existing repository config file."
      ),
      {
        code: "cli.upgrade_missing_config",
        details: {
          configFile: resolvedConfig.paths.configFile
        }
      }
    );
  }

  const { document: currentDocument } = parseGovernorDocument(
    resolvedConfig.paths.configFile,
    requestedLocale
  );
  const currentVersion = currentDocument.schemaVersion ?? "unversioned";
  const dateStamp = formatDate();
  const upgradedConfig = applyConfigRootOverrides(
    applyInitDefaults(structuredClone(resolvedConfig.config), cwd),
    cwd,
    resolvedConfig.paths.configFile
  );
  upgradedConfig.schemaVersion = targetVersion;
  const locale = normalizeLocale(upgradedConfig.standards.locales.default);

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
      t(
        locale,
        `当前 schemaVersion 已是 ${targetVersion}；upgrade 将执行配置归一化并重建入口生成文件。`,
        `Schema version is already ${targetVersion}; upgrade will normalize config and regenerate generated entry files.`
      )
    );
  }

  if (currentDocument.schemaVersion === undefined) {
    warnings.push(
      t(
        locale,
        "当前配置未显式声明 schemaVersion；upgrade 将写入 schemaVersion=1。",
        "Current config did not declare schemaVersion explicitly; upgrade will write schemaVersion=1."
      )
    );
  }

  return {
    cwd,
    locale,
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
    locale: plan.locale,
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
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# upgrade",
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "当前版本", "Current version")}: \`${payload.currentVersion}\``,
        `- ${t(locale, "目标版本", "Target version")}: \`${payload.targetVersion}\``,
        `- ${t(locale, "预览模式", "Preview")}: ${payload.preview}`,
        `- ${t(locale, "备份", "Backup")}: ${payload.backup}`,
        `- ${t(locale, "备份目录", "Backup dir")}: \`${payload.backupDir ?? t(locale, "无", "none")}\``,
        `- ${t(locale, "变更操作", "Operations")}: \`${JSON.stringify(payload.operations)}\``,
        `- ${t(locale, "告警", "Warnings")}: \`${JSON.stringify(payload.warnings)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  logger.success(
    payload.preview
      ? t(locale, "upgrade 预览已就绪", "upgrade plan is ready")
      : t(locale, "仓库升级完成", "repository upgrade completed")
  );
  logger.keyValue(t(locale, "当前版本", "Current version"), payload.currentVersion);
  logger.keyValue(t(locale, "目标版本", "Target version"), payload.targetVersion);
  logger.keyValue(t(locale, "预览模式", "Preview"), String(payload.preview));
  logger.keyValue(t(locale, "备份", "Backup"), String(payload.backup));

  if (payload.backupDir) {
    logger.keyValue(t(locale, "备份目录", "Backup dir"), payload.backupDir);
  }

  logger.keyValue(t(locale, "变更操作", "Operations"), JSON.stringify(payload.operations));

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
