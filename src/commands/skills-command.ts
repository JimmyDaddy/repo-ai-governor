import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { CommandContext } from "../cli/runtime/context.js";
import { BusinessCheckError, InputError } from "../cli/runtime/errors.js";
import type { ExitCode } from "../cli/runtime/exit-codes.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import type { Logger } from "../cli/ui/logger.js";
import {
  SUPPORTED_SKILL_ACTIONS,
  type SkillAction,
} from "../constants/skill-actions.js";
import {
  type OfficialSkillCatalogEntry,
  type OfficialSkillCatalogState,
  loadOfficialSkillCatalog,
  loadSkillManifest,
} from "../skills/catalog.js";
import {
  SUPPORTED_SKILL_SURFACES,
  type SkillInstallMode,
  type SkillSurface,
} from "../skills/package-layout.js";
import {
  type ResolvedSkillInstallTarget,
  SUPPORTED_SKILL_SCOPES,
  type SkillScope,
  listInstalledSkillRoots,
  resolveSkillInstallTarget,
  validateSkillScope,
  validateSkillSurface,
} from "../skills/runtime.js";
import { doesVersionSatisfy } from "../skills/semver.js";
import { normalizeLocale, toRelativePath, translateLocale } from "../utils/common.js";

const require = createRequire(import.meta.url);
// dynamic-import-allowed: read package version for skills compatibility reporting
const packageJson = require("../../package.json") as {
  version: string;
};

type ParsedOptions = Record<string, unknown>;
type SkillManifest = ReturnType<typeof loadSkillManifest>;
type FindingSeverity = "info" | "warning" | "error";
type FindingStatus = "pass" | "warn" | "fail";
type InstalledSkillStatus = "installed" | "external" | "invalid";
type InstallOperationStatus = "installed" | "planned" | "skipped";

type SkillFinding = {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target?: string;
  suggestion?: string;
};

type SkillFindingInput = {
  id: string;
  severity: FindingSeverity;
  status: FindingStatus;
  message: string;
  target?: string;
  suggestion?: string;
};

type InstalledSkill = {
  id: string;
  skillRoot: string;
  manifestPath: string;
  skillFilePath: string;
  status: InstalledSkillStatus;
  issues: string[];
  manifest: SkillManifest | null;
};

type SkillState = {
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
};

type SkillDiscovery = {
  target: ResolvedSkillInstallTarget;
  installedSkills: InstalledSkill[];
};

type SkillSummary = {
  errors: number;
  warnings: number;
};

type SkillsSummary = SkillSummary & {
  surfaces: SkillSurface[];
};

type AvailableSkillItem = {
  id: string;
  displayName: string;
  version: string;
  surfaces: SkillSurface[];
  defaultInstallMode: SkillInstallMode;
};

type InstalledSkillItem = {
  id: string;
  surface: SkillSurface;
  scope: SkillScope;
  status: InstalledSkillStatus;
  path: string;
  version: string | null;
  displayName: string | null;
  issues: string[];
};

type InstallOperation = {
  id: string;
  status: InstallOperationStatus;
  path: string;
  reason?: string;
  mode?: SkillInstallMode;
};

type ListPayload = {
  command: "skills";
  action: "list";
  locale: string;
  status: "listed";
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
};

type InstallPayload = {
  command: "skills";
  action: "install";
  locale: string;
  status: "planned" | "installed";
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
};

type DoctorPayload = {
  command: "skills";
  action: "doctor";
  locale: string;
  status: "pass" | "warn" | "fail";
  cwd: string;
  scope: SkillScope;
  surface: SkillSurface | null;
  strict: boolean;
  catalogFile: string;
  findings: SkillFinding[];
  summary: SkillsSummary;
  exitCode: ExitCode;
};

type SkillsPayload = ListPayload | InstallPayload | DoctorPayload;

type SkillsRenderPayload = {
  action: SkillAction;
  status: string;
  locale: string;
  surface?: SkillSurface | null;
  scope?: SkillScope;
  catalogFile?: string;
  targetRoot?: string;
  summary?: Record<string, unknown>;
  availableSkills?: AvailableSkillItem[];
  installedSkills?: InstalledSkillItem[];
  operations?: InstallOperation[];
  warnings?: string[];
  findings?: SkillFinding[];
};

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function getStringOption(options: ParsedOptions, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function getStringArrayOption(options: ParsedOptions, key: string): string[] | undefined {
  const value = options[key];

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? (value as string[]) : undefined;
}

function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function readInstalledSkill(manifestPath: string): {
  manifest: SkillManifest;
  skillRoot: string;
  skillFilePath: string;
} {
  const manifest = loadSkillManifest(manifestPath);

  return {
    manifest,
    skillRoot: path.dirname(manifestPath),
    skillFilePath: path.resolve(path.dirname(manifestPath), manifest.entry.skillFile),
  };
}

function inspectInstalledSkill(
  skillRoot: string,
  surface: SkillSurface,
  locale = "zh-CN",
): InstalledSkill {
  const manifestPath = path.resolve(skillRoot, "skill.json");
  const installedSkill: InstalledSkill = {
    id: path.basename(skillRoot),
    skillRoot,
    manifestPath,
    skillFilePath: path.resolve(skillRoot, "SKILL.md"),
    status: "installed",
    issues: [],
    manifest: null,
  };

  if (!fs.existsSync(manifestPath)) {
    installedSkill.status = "external";
    installedSkill.issues.push(
      t(locale, "非 repo-ai-governor 管理", "not managed by repo-ai-governor"),
    );
    return installedSkill;
  }

  try {
    const { manifest, skillFilePath } = readInstalledSkill(manifestPath);
    installedSkill.manifest = manifest;
    installedSkill.id = manifest.id;
    installedSkill.skillFilePath = skillFilePath;
  } catch (error) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(error instanceof Error ? error.message : String(error));
    return installedSkill;
  }

  if (!fs.existsSync(installedSkill.skillFilePath)) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(t(locale, "缺少 SKILL.md", "missing SKILL.md"));
  }

  if (installedSkill.manifest && !installedSkill.manifest.surfaces.includes(surface)) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(
      t(locale, `surface 与 ${surface} 不匹配`, `surface mismatch for ${surface}`),
    );
  }

  if (
    installedSkill.manifest &&
    !doesVersionSatisfy(installedSkill.manifest.compatibility.repoAiGovernor, packageJson.version)
  ) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(
      t(
        locale,
        `repo-ai-governor ${packageJson.version} 不满足 ${installedSkill.manifest.compatibility.repoAiGovernor} 版本约束`,
        `repo-ai-governor ${packageJson.version} does not satisfy ${installedSkill.manifest.compatibility.repoAiGovernor}`,
      ),
    );
  }

  return installedSkill;
}

function createFinding(options: SkillFindingInput): SkillFinding {
  return {
    id: options.id,
    severity: options.severity,
    status: options.status,
    message: options.message,
    target: options.target,
    suggestion: options.suggestion,
  };
}

function summarizeFindings(
  findings: SkillFinding[],
  strict: boolean,
): {
  status: "pass" | "warn" | "fail";
  exitCode: ExitCode;
  errors: number;
  warnings: number;
} {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;

  if (errors > 0 || (strict && warnings > 0)) {
    return {
      status: "fail",
      exitCode: EXIT_CODES.businessCheckFailed,
      errors,
      warnings,
    };
  }

  if (warnings > 0) {
    return {
      status: "warn",
      exitCode: EXIT_CODES.success,
      errors,
      warnings,
    };
  }

  return {
    status: "pass",
    exitCode: EXIT_CODES.success,
    errors,
    warnings,
  };
}

function getSkillAction(commandContext: CommandContext): SkillAction {
  const action = commandContext.positionals[0] ?? "list";
  const locale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));

  if (!SUPPORTED_SKILL_ACTIONS.includes(action as SkillAction)) {
    throw new InputError(
      t(locale, `不支持的 skills 动作：${action}`, `Unsupported skills action: ${action}`),
      {
        code: "cli.skills_unsupported_action",
        details: {
          action,
          supportedActions: SUPPORTED_SKILL_ACTIONS,
        },
      },
    );
  }

  return action as SkillAction;
}

function getRequestedSurface(
  commandContext: CommandContext,
  action: SkillAction,
): SkillSurface | null {
  const surface = getStringOption(commandContext.commandOptions, "surface");
  const locale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));

  if (!surface) {
    if (action === "install") {
      throw new InputError(
        t(
          locale,
          "skills install 需要通过 --surface 指定目标适配器。",
          "skills install requires --surface to select an adapter target.",
        ),
        {
          code: "cli.skills_missing_surface",
        },
      );
    }

    return null;
  }

  try {
    return validateSkillSurface(surface);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new InputError(t(locale, `无效的 surface：${surface}`, message), {
      code: "cli.skills_invalid_surface",
      details: {
        surface,
        supportedSurfaces: SUPPORTED_SKILL_SURFACES,
      },
    });
  }
}

function getRequestedScope(commandContext: CommandContext): SkillScope {
  const scope = getStringOption(commandContext.commandOptions, "scope") ?? "repo";
  const locale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));

  try {
    return validateSkillScope(scope);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new InputError(t(locale, `无效的 scope：${scope}`, message), {
      code: "cli.skills_invalid_scope",
      details: {
        scope,
        supportedScopes: SUPPORTED_SKILL_SCOPES,
      },
    });
  }
}

function loadSkillState(commandContext: CommandContext, action: SkillAction): SkillState {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const surface = getRequestedSurface(commandContext, action);
  const scope = getRequestedScope(commandContext);
  const catalogState = loadOfficialSkillCatalog({
    cwd,
    catalogPath: getStringOption(commandContext.commandOptions, "catalog"),
  });

  return {
    cwd,
    locale: normalizeLocale(getStringOption(commandContext.globalOptions, "locale")),
    action,
    surface,
    scope,
    strict: commandContext.commandOptions.strict === true,
    dryRun: commandContext.globalOptions.dryRun === true,
    force: commandContext.commandOptions.force === true,
    targetPath: getStringOption(commandContext.commandOptions, "target"),
    selectedSkillIds: getStringArrayOption(commandContext.commandOptions, "skill") ?? [],
    catalogState,
  };
}

function filterCatalogSkills(
  state: SkillState,
  surface: SkillSurface | null = null,
): OfficialSkillCatalogEntry[] {
  const targetSurface = surface ?? state.surface;

  if (!targetSurface) {
    return state.catalogState.skills;
  }

  return state.catalogState.skills.filter((skill) => skill.surfaces.includes(targetSurface));
}

function resolveCatalogCompatibilityFinding(state: SkillState): SkillFinding {
  if (
    doesVersionSatisfy(state.catalogState.catalog.compatibility.repoAiGovernor, packageJson.version)
  ) {
    return createFinding({
      id: "skills.catalog.compatibility",
      severity: "info",
      status: "pass",
      message: t(
        state.locale,
        `内置 skill catalog 支持 repo-ai-governor ${packageJson.version}。`,
        `Bundled skill catalog supports repo-ai-governor ${packageJson.version}.`,
      ),
      target: toRelativePath(state.cwd, state.catalogState.catalogPath),
    });
  }

  return createFinding({
    id: "skills.catalog.compatibility",
    severity: "error",
    status: "fail",
    message: t(
      state.locale,
      `内置 skill catalog 需要 ${state.catalogState.catalog.compatibility.repoAiGovernor}，当前版本为 ${packageJson.version}。`,
      `Bundled skill catalog requires ${state.catalogState.catalog.compatibility.repoAiGovernor}, current version is ${packageJson.version}.`,
    ),
    target: toRelativePath(state.cwd, state.catalogState.catalogPath),
    suggestion: t(
      state.locale,
      "请升级 repo-ai-governor，或刷新已安装的 skill catalog。",
      "Upgrade repo-ai-governor or refresh the installed skill catalog.",
    ),
  });
}

function discoverInstalledSkills(state: SkillState, surface: SkillSurface): SkillDiscovery {
  const target = resolveSkillInstallTarget({
    cwd: state.cwd,
    surface,
    scope: state.scope,
    targetPath: state.targetPath,
  });
  const installedRoots = listInstalledSkillRoots(target.targetPath);
  const installedSkills = installedRoots.map((skillRoot) =>
    inspectInstalledSkill(skillRoot, surface, state.locale),
  );

  return {
    target,
    installedSkills,
  };
}

function renderSkillsOutput(
  logger: Logger,
  commandContext: CommandContext,
  payload: SkillsRenderPayload,
): void {
  const locale = normalizeLocale(payload.locale);

  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    const lines = [
      `# skills ${payload.action}`,
      "",
      `- ${t(locale, "状态", "Status")}: ${payload.status}`,
    ];

    if (payload.surface) {
      lines.push(`- ${t(locale, "Surface", "Surface")}: \`${payload.surface}\``);
    }

    if (payload.scope) {
      lines.push(`- ${t(locale, "范围", "Scope")}: \`${payload.scope}\``);
    }

    if (payload.catalogFile) {
      lines.push(`- ${t(locale, "目录索引", "Catalog")}: \`${payload.catalogFile}\``);
    }

    if (payload.targetRoot) {
      lines.push(`- ${t(locale, "目标目录", "Target")}: \`${payload.targetRoot}\``);
    }

    if (payload.summary) {
      lines.push(`- ${t(locale, "摘要", "Summary")}: \`${JSON.stringify(payload.summary)}\``);
    }

    if (payload.availableSkills) {
      lines.push(
        `- ${t(locale, "可用 skills", "Available skills")}: \`${JSON.stringify(payload.availableSkills)}\``,
      );
    }

    if (payload.installedSkills) {
      lines.push(
        `- ${t(locale, "已安装 skills", "Installed skills")}: \`${JSON.stringify(payload.installedSkills)}\``,
      );
    }

    if (payload.operations) {
      lines.push(
        `- ${t(locale, "执行操作", "Operations")}: \`${JSON.stringify(payload.operations)}\``,
      );
    }

    if (payload.findings) {
      lines.push(`- ${t(locale, "发现项", "Findings")}: \`${JSON.stringify(payload.findings)}\``);
    }

    logger.raw(lines.join("\n"), { ignoreQuiet: true });
    return;
  }

  const statusWriter =
    payload.status === "fail"
      ? logger.error.bind(logger)
      : payload.status === "warn"
        ? logger.warn.bind(logger)
        : logger.success.bind(logger);
  statusWriter(
    t(
      locale,
      `skills ${payload.action} 执行结果：${payload.status}`,
      `skills ${payload.action} ${payload.status}`,
    ),
  );

  if (payload.surface) {
    logger.keyValue(t(locale, "Surface", "Surface"), payload.surface);
  }

  if (payload.scope) {
    logger.keyValue(t(locale, "范围", "Scope"), payload.scope);
  }

  if (payload.catalogFile) {
    logger.keyValue(t(locale, "目录索引", "Catalog"), payload.catalogFile);
  }

  if (payload.targetRoot) {
    logger.keyValue(t(locale, "目标目录", "Target"), payload.targetRoot);
  }

  if (payload.summary) {
    logger.keyValue(t(locale, "摘要", "Summary"), JSON.stringify(payload.summary));
  }

  if (payload.availableSkills) {
    logger.keyValue(
      t(locale, "可用 skills", "Available skills"),
      JSON.stringify(payload.availableSkills),
    );
  }

  if (payload.installedSkills) {
    logger.keyValue(
      t(locale, "已安装 skills", "Installed skills"),
      JSON.stringify(payload.installedSkills),
    );
  }

  if (payload.operations) {
    logger.keyValue(t(locale, "执行操作", "Operations"), JSON.stringify(payload.operations));
  }

  if (payload.warnings) {
    for (const warning of payload.warnings) {
      logger.warn(warning);
    }
  }

  if (payload.findings) {
    for (const finding of payload.findings.filter((item: SkillFinding) => item.status !== "pass")) {
      const target = finding.target ? ` (${finding.target})` : "";
      const message = `${finding.message}${target}`;

      if (finding.severity === "error") {
        logger.error(message);
      } else {
        logger.warn(message);
      }
    }
  }
}

function buildListPayload(state: SkillState): ListPayload {
  const surfaces = state.surface ? [state.surface] : [...SUPPORTED_SKILL_SURFACES];
  const availableSkills = filterCatalogSkills(state).map(
    (skill): AvailableSkillItem => ({
      id: skill.id,
      displayName: skill.manifest.displayName,
      version: skill.manifest.version,
      surfaces: skill.surfaces,
      defaultInstallMode: skill.defaultInstallMode,
    }),
  );
  const installedSkills: InstalledSkillItem[] = [];

  for (const surface of surfaces) {
    const discovery = discoverInstalledSkills(state, surface);

    for (const installedSkill of discovery.installedSkills) {
      installedSkills.push({
        id: installedSkill.id,
        surface,
        scope: state.scope,
        status: installedSkill.status,
        path: toRelativePath(state.cwd, installedSkill.skillRoot),
        version: installedSkill.manifest?.version ?? null,
        displayName: installedSkill.manifest?.displayName ?? null,
        issues: installedSkill.issues,
      });
    }
  }

  return {
    command: "skills",
    action: "list",
    locale: state.locale,
    status: "listed",
    cwd: state.cwd,
    scope: state.scope,
    surface: state.surface,
    catalogFile: toRelativePath(state.cwd, state.catalogState.catalogPath),
    summary: {
      available: availableSkills.length,
      installed: installedSkills.length,
      surfaces,
    },
    availableSkills,
    installedSkills,
  };
}

function buildInstallPayload(state: SkillState): InstallPayload {
  const surface = state.surface;

  if (!surface) {
    throw new InputError(
      t(
        state.locale,
        "skills install 需要通过 --surface 指定目标适配器。",
        "skills install requires --surface to select an adapter target.",
      ),
      {
        code: "cli.skills_missing_surface",
      },
    );
  }

  const filteredSkills = filterCatalogSkills(state, surface);

  if (state.selectedSkillIds.length > 0) {
    const missingSkillIds = state.selectedSkillIds.filter(
      (skillId: string) => !filteredSkills.some((skill) => skill.id === skillId),
    );

    if (missingSkillIds.length > 0) {
      throw new InputError(
        t(
          state.locale,
          `以下 skills 在 ${surface} 上不可用：${missingSkillIds.join(", ")}`,
          `Requested skills are not available for ${surface}: ${missingSkillIds.join(", ")}`,
        ),
        {
          code: "cli.skills_missing_skill_ids",
          details: {
            surface,
            missingSkillIds,
          },
        },
      );
    }
  }

  const selectedSkills =
    state.selectedSkillIds.length > 0
      ? filteredSkills.filter((skill) => state.selectedSkillIds.includes(skill.id))
      : filteredSkills;
  const target = resolveSkillInstallTarget({
    cwd: state.cwd,
    surface,
    scope: state.scope,
    targetPath: state.targetPath,
  });
  const operations: InstallOperation[] = [];
  const warnings: string[] = [];

  if (selectedSkills.length === 0) {
    warnings.push(
      t(
        state.locale,
        `${surface} 当前没有可安装的官方 skills。`,
        `No official skills are currently available for ${surface}.`,
      ),
    );
  }

  if (!state.dryRun && selectedSkills.length > 0) {
    ensureDirectory(target.targetPath);
  }

  for (const skill of selectedSkills) {
    const destinationRoot = path.resolve(target.targetPath, skill.id);
    const destinationExists = fs.existsSync(destinationRoot);

    if (destinationExists && !state.force) {
      operations.push({
        id: skill.id,
        status: "skipped",
        reason: "already-installed",
        path: toRelativePath(state.cwd, destinationRoot),
      });
      continue;
    }

    if (!state.dryRun) {
      fs.rmSync(destinationRoot, { recursive: true, force: true });
      fs.cpSync(skill.skillRoot, destinationRoot, { recursive: true });
    }

    operations.push({
      id: skill.id,
      status: state.dryRun ? "planned" : "installed",
      path: toRelativePath(state.cwd, destinationRoot),
      mode: skill.defaultInstallMode,
    });
  }

  return {
    command: "skills",
    action: "install",
    locale: state.locale,
    status: state.dryRun ? "planned" : "installed",
    cwd: state.cwd,
    scope: state.scope,
    surface,
    dryRun: state.dryRun,
    force: state.force,
    catalogFile: toRelativePath(state.cwd, state.catalogState.catalogPath),
    targetRoot: toRelativePath(state.cwd, target.targetPath),
    summary: {
      selected: selectedSkills.length,
      installed: operations.filter((operation) => operation.status === "installed").length,
      planned: operations.filter((operation) => operation.status === "planned").length,
      skipped: operations.filter((operation) => operation.status === "skipped").length,
    },
    operations,
    warnings,
  };
}

function buildDoctorPayload(state: SkillState): DoctorPayload {
  const surfaces = state.surface ? [state.surface] : [...SUPPORTED_SKILL_SURFACES];
  const findings: SkillFinding[] = [resolveCatalogCompatibilityFinding(state)];

  for (const surface of surfaces) {
    const discovery = discoverInstalledSkills(state, surface);
    const targetRelativePath = toRelativePath(state.cwd, discovery.target.targetPath);

    if (!fs.existsSync(discovery.target.targetPath)) {
      findings.push(
        createFinding({
          id: `skills.${surface}.target`,
          severity: "warning",
          status: "warn",
          message: t(
            state.locale,
            `${surface} 的 skill 安装目标目录缺失。`,
            `Skill install target is missing for ${surface}.`,
          ),
          target: targetRelativePath,
          suggestion: t(
            state.locale,
            `请执行 \`repo-ai-governor skills install --surface ${surface}\` 初始化该目录。`,
            `Run \`repo-ai-governor skills install --surface ${surface}\` to bootstrap the target.`,
          ),
        }),
      );
      continue;
    }

    findings.push(
      createFinding({
        id: `skills.${surface}.target`,
        severity: "info",
        status: "pass",
        message: t(
          state.locale,
          `${surface} 的 skill 安装目标目录已存在。`,
          `Skill install target is present for ${surface}.`,
        ),
        target: targetRelativePath,
      }),
    );

    for (const installedSkill of discovery.installedSkills) {
      if (installedSkill.status === "installed") {
        findings.push(
          createFinding({
            id: `skills.${surface}.${installedSkill.id}`,
            severity: "info",
            status: "pass",
            message: t(
              state.locale,
              `已安装 skill ${installedSkill.id} 状态正常。`,
              `Installed skill ${installedSkill.id} is healthy.`,
            ),
            target: toRelativePath(state.cwd, installedSkill.skillRoot),
          }),
        );
        continue;
      }

      if (installedSkill.status === "external") {
        findings.push(
          createFinding({
            id: `skills.${surface}.${installedSkill.id}`,
            severity: "info",
            status: "pass",
            message: t(
              state.locale,
              `发现外部 skill ${installedSkill.id}，已跳过 manifest 校验。`,
              `Found external skill ${installedSkill.id}; skipped manifest validation.`,
            ),
            target: toRelativePath(state.cwd, installedSkill.skillRoot),
          }),
        );
        continue;
      }

      findings.push(
        createFinding({
          id: `skills.${surface}.${installedSkill.id}`,
          severity: "error",
          status: "fail",
          message: t(
            state.locale,
            `已安装 skill ${installedSkill.id} 无效：${installedSkill.issues.join("；")}`,
            `Installed skill ${installedSkill.id} is invalid: ${installedSkill.issues.join("; ")}`,
          ),
          target: toRelativePath(state.cwd, installedSkill.skillRoot),
          suggestion: t(
            state.locale,
            `请执行 \`repo-ai-governor skills install --surface ${surface} --skill ${installedSkill.id} --force\` 重新安装。`,
            `Reinstall ${installedSkill.id} with \`repo-ai-governor skills install --surface ${surface} --skill ${installedSkill.id} --force\`.`,
          ),
        }),
      );
    }
  }

  if (state.catalogState.skills.length === 0) {
    findings.push(
      createFinding({
        id: "skills.catalog.empty",
        severity: "warning",
        status: "warn",
        message: t(
          state.locale,
          "官方 skill catalog 当前为空。",
          "Official skill catalog is currently empty.",
        ),
        target: toRelativePath(state.cwd, state.catalogState.catalogPath),
        suggestion: t(
          state.locale,
          "请先补充官方 skill 资源，再使用 install 复制内置技能。",
          "Populate official skill assets before expecting install to copy bundled skills.",
        ),
      }),
    );
  }

  const summary = summarizeFindings(findings, state.strict);

  return {
    command: "skills",
    action: "doctor",
    locale: state.locale,
    status: summary.status,
    cwd: state.cwd,
    scope: state.scope,
    surface: state.surface,
    strict: state.strict,
    catalogFile: toRelativePath(state.cwd, state.catalogState.catalogPath),
    findings,
    summary: {
      errors: summary.errors,
      warnings: summary.warnings,
      surfaces,
    },
    exitCode: summary.exitCode,
  };
}

export async function executeSkillsCommand(
  commandContext: CommandContext,
  logger: Logger,
): Promise<number> {
  const action = getSkillAction(commandContext);
  const state = loadSkillState(commandContext, action);

  if (action === "list") {
    const payload = buildListPayload(state);
    renderSkillsOutput(logger, commandContext, payload);
    return EXIT_CODES.success;
  }

  if (action === "install") {
    const payload = buildInstallPayload(state);
    renderSkillsOutput(logger, commandContext, payload);
    return EXIT_CODES.success;
  }

  if (action === "doctor") {
    const payload = buildDoctorPayload(state);
    renderSkillsOutput(logger, commandContext, payload);

    if (payload.exitCode === EXIT_CODES.businessCheckFailed) {
      throw new BusinessCheckError(
        t(state.locale, "skills doctor 发现阻断问题。", "skills doctor found blocking issues."),
        {
          code: "cli.skills_doctor_failed",
          details: {
            summary: payload.summary,
          },
        },
      );
    }

    return payload.exitCode;
  }

  throw new InputError(
    t(state.locale, `不支持的 skills 动作：${action}`, `Unsupported skills action: ${action}`),
    {
      code: "cli.skills_unsupported_action",
    },
  );
}
