import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import { BusinessCheckError, InputError } from "../cli/runtime/errors.js";
import { loadOfficialSkillCatalog, loadSkillManifest } from "../skills/catalog.js";
import { SUPPORTED_SKILL_SURFACES } from "../skills/package-layout.js";
import { doesVersionSatisfy } from "../skills/semver.js";
import {
  listInstalledSkillRoots,
  resolveSkillInstallTarget,
  SUPPORTED_SKILL_SCOPES,
  validateSkillScope,
  validateSkillSurface
} from "../skills/runtime.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");
const SUPPORTED_SKILL_ACTIONS = Object.freeze(["install", "list", "doctor"]);

function toRelativePath(cwd, targetPath) {
  const relativePath = path.relative(cwd, targetPath).split(path.sep).join("/");
  return relativePath || ".";
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function readInstalledSkill(manifestPath) {
  const manifest = loadSkillManifest(manifestPath);

  return {
    manifest,
    skillRoot: path.dirname(manifestPath),
    skillFilePath: path.resolve(path.dirname(manifestPath), manifest.entry.skillFile)
  };
}

function inspectInstalledSkill(skillRoot, surface) {
  const manifestPath = path.resolve(skillRoot, "skill.json");
  const installedSkill = {
    id: path.basename(skillRoot),
    skillRoot,
    manifestPath,
    skillFilePath: path.resolve(skillRoot, "SKILL.md"),
    status: "installed",
    issues: [],
    manifest: null
  };

  if (!fs.existsSync(manifestPath)) {
    installedSkill.status = "external";
    installedSkill.issues.push("not managed by repo-ai-governor");
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
    installedSkill.issues.push("missing SKILL.md");
  }

  if (!installedSkill.manifest.surfaces.includes(surface)) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(`surface mismatch for ${surface}`);
  }

  if (
    !doesVersionSatisfy(installedSkill.manifest.compatibility.repoAiGovernor, packageJson.version)
  ) {
    installedSkill.status = "invalid";
    installedSkill.issues.push(
      `repo-ai-governor ${packageJson.version} does not satisfy ${installedSkill.manifest.compatibility.repoAiGovernor}`
    );
  }

  return installedSkill;
}

function createFinding(options) {
  return {
    id: options.id,
    severity: options.severity,
    status: options.status,
    message: options.message,
    target: options.target,
    suggestion: options.suggestion
  };
}

function summarizeFindings(findings, strict) {
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;

  if (errors > 0 || (strict && warnings > 0)) {
    return {
      status: "fail",
      exitCode: EXIT_CODES.businessCheckFailed,
      errors,
      warnings
    };
  }

  if (warnings > 0) {
    return {
      status: "warn",
      exitCode: EXIT_CODES.success,
      errors,
      warnings
    };
  }

  return {
    status: "pass",
    exitCode: EXIT_CODES.success,
    errors,
    warnings
  };
}

function getSkillAction(commandContext) {
  const action = commandContext.positionals[0] ?? "list";

  if (!SUPPORTED_SKILL_ACTIONS.includes(action)) {
    throw new InputError(`Unsupported skills action: ${action}`, {
      code: "cli.skills_unsupported_action",
      details: {
        action,
        supportedActions: SUPPORTED_SKILL_ACTIONS
      }
    });
  }

  return action;
}

function getRequestedSurface(commandContext, action) {
  const surface = commandContext.commandOptions.surface;

  if (!surface) {
    if (action === "install") {
      throw new InputError("skills install requires --surface to select an adapter target.", {
        code: "cli.skills_missing_surface"
      });
    }

    return null;
  }

  try {
    return validateSkillSurface(surface);
  } catch (error) {
    throw new InputError(error.message, {
      code: "cli.skills_invalid_surface",
      details: {
        surface,
        supportedSurfaces: SUPPORTED_SKILL_SURFACES
      }
    });
  }
}

function getRequestedScope(commandContext) {
  const scope = commandContext.commandOptions.scope ?? "repo";

  try {
    return validateSkillScope(scope);
  } catch (error) {
    throw new InputError(error.message, {
      code: "cli.skills_invalid_scope",
      details: {
        scope,
        supportedScopes: SUPPORTED_SKILL_SCOPES
      }
    });
  }
}

function loadSkillState(commandContext, action) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const surface = getRequestedSurface(commandContext, action);
  const scope = getRequestedScope(commandContext);
  const catalogState = loadOfficialSkillCatalog({
    cwd,
    catalogPath: commandContext.commandOptions.catalog
  });

  return {
    cwd,
    action,
    surface,
    scope,
    strict: commandContext.commandOptions.strict === true,
    dryRun: commandContext.globalOptions.dryRun === true,
    force: commandContext.commandOptions.force === true,
    targetPath: commandContext.commandOptions.target,
    selectedSkillIds: commandContext.commandOptions.skill ?? [],
    catalogState
  };
}

function filterCatalogSkills(state, surface) {
  const targetSurface = surface ?? state.surface;

  if (!targetSurface) {
    return state.catalogState.skills;
  }

  return state.catalogState.skills.filter((skill) => skill.surfaces.includes(targetSurface));
}

function resolveCatalogCompatibilityFinding(state) {
  if (
    doesVersionSatisfy(state.catalogState.catalog.compatibility.repoAiGovernor, packageJson.version)
  ) {
    return createFinding({
      id: "skills.catalog.compatibility",
      severity: "info",
      status: "pass",
      message: `Bundled skill catalog supports repo-ai-governor ${packageJson.version}.`,
      target: toRelativePath(state.cwd, state.catalogState.catalogPath)
    });
  }

  return createFinding({
    id: "skills.catalog.compatibility",
    severity: "error",
    status: "fail",
    message: `Bundled skill catalog requires ${state.catalogState.catalog.compatibility.repoAiGovernor}, current version is ${packageJson.version}.`,
    target: toRelativePath(state.cwd, state.catalogState.catalogPath),
    suggestion: "Upgrade repo-ai-governor or refresh the installed skill catalog."
  });
}

function discoverInstalledSkills(state, surface) {
  const target = resolveSkillInstallTarget({
    cwd: state.cwd,
    surface,
    scope: state.scope,
    targetPath: state.targetPath
  });
  const installedRoots = listInstalledSkillRoots(target.targetPath);
  const installedSkills = installedRoots.map((skillRoot) => inspectInstalledSkill(skillRoot, surface));

  return {
    target,
    installedSkills
  };
}

function renderSkillsOutput(logger, commandContext, payload) {
  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    const lines = [`# skills ${payload.action}`, "", `- Status: ${payload.status}`];

    if (payload.surface) {
      lines.push(`- Surface: \`${payload.surface}\``);
    }

    if (payload.scope) {
      lines.push(`- Scope: \`${payload.scope}\``);
    }

    if (payload.catalogFile) {
      lines.push(`- Catalog: \`${payload.catalogFile}\``);
    }

    if (payload.targetRoot) {
      lines.push(`- Target: \`${payload.targetRoot}\``);
    }

    if (payload.summary) {
      lines.push(`- Summary: \`${JSON.stringify(payload.summary)}\``);
    }

    if (payload.availableSkills) {
      lines.push(`- Available skills: \`${JSON.stringify(payload.availableSkills)}\``);
    }

    if (payload.installedSkills) {
      lines.push(`- Installed skills: \`${JSON.stringify(payload.installedSkills)}\``);
    }

    if (payload.operations) {
      lines.push(`- Operations: \`${JSON.stringify(payload.operations)}\``);
    }

    if (payload.findings) {
      lines.push(`- Findings: \`${JSON.stringify(payload.findings)}\``);
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
  statusWriter(`skills ${payload.action} ${payload.status}`);

  if (payload.surface) {
    logger.keyValue("Surface", payload.surface);
  }

  if (payload.scope) {
    logger.keyValue("Scope", payload.scope);
  }

  if (payload.catalogFile) {
    logger.keyValue("Catalog", payload.catalogFile);
  }

  if (payload.targetRoot) {
    logger.keyValue("Target", payload.targetRoot);
  }

  if (payload.summary) {
    logger.keyValue("Summary", JSON.stringify(payload.summary));
  }

  if (payload.availableSkills) {
    logger.keyValue("Available skills", JSON.stringify(payload.availableSkills));
  }

  if (payload.installedSkills) {
    logger.keyValue("Installed skills", JSON.stringify(payload.installedSkills));
  }

  if (payload.operations) {
    logger.keyValue("Operations", JSON.stringify(payload.operations));
  }

  if (payload.warnings) {
    for (const warning of payload.warnings) {
      logger.warn(warning);
    }
  }

  if (payload.findings) {
    for (const finding of payload.findings.filter((item) => item.status !== "pass")) {
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

function buildListPayload(state) {
  const surfaces = state.surface ? [state.surface] : SUPPORTED_SKILL_SURFACES;
  const availableSkills = filterCatalogSkills(state).map((skill) => ({
    id: skill.id,
    displayName: skill.manifest.displayName,
    version: skill.manifest.version,
    surfaces: skill.surfaces,
    defaultInstallMode: skill.defaultInstallMode
  }));
  const installedSkills = [];

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
        issues: installedSkill.issues
      });
    }
  }

  return {
    command: "skills",
    action: "list",
    status: "listed",
    cwd: state.cwd,
    scope: state.scope,
    surface: state.surface,
    catalogFile: toRelativePath(state.cwd, state.catalogState.catalogPath),
    summary: {
      available: availableSkills.length,
      installed: installedSkills.length,
      surfaces
    },
    availableSkills,
    installedSkills
  };
}

function buildInstallPayload(state) {
  const filteredSkills = filterCatalogSkills(state, state.surface);

  if (state.selectedSkillIds.length > 0) {
    const missingSkillIds = state.selectedSkillIds.filter(
      (skillId) => !filteredSkills.some((skill) => skill.id === skillId)
    );

    if (missingSkillIds.length > 0) {
      throw new InputError(
        `Requested skills are not available for ${state.surface}: ${missingSkillIds.join(", ")}`,
        {
          code: "cli.skills_missing_skill_ids",
          details: {
            surface: state.surface,
            missingSkillIds
          }
        }
      );
    }
  }

  const selectedSkills =
    state.selectedSkillIds.length > 0
      ? filteredSkills.filter((skill) => state.selectedSkillIds.includes(skill.id))
      : filteredSkills;
  const target = resolveSkillInstallTarget({
    cwd: state.cwd,
    surface: state.surface,
    scope: state.scope,
    targetPath: state.targetPath
  });
  const operations = [];
  const warnings = [];

  if (selectedSkills.length === 0) {
    warnings.push(`No official skills are currently available for ${state.surface}.`);
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
        path: toRelativePath(state.cwd, destinationRoot)
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
      mode: skill.defaultInstallMode
    });
  }

  return {
    command: "skills",
    action: "install",
    status: state.dryRun ? "planned" : "installed",
    cwd: state.cwd,
    scope: state.scope,
    surface: state.surface,
    dryRun: state.dryRun,
    force: state.force,
    catalogFile: toRelativePath(state.cwd, state.catalogState.catalogPath),
    targetRoot: toRelativePath(state.cwd, target.targetPath),
    summary: {
      selected: selectedSkills.length,
      installed: operations.filter((operation) => operation.status === "installed").length,
      planned: operations.filter((operation) => operation.status === "planned").length,
      skipped: operations.filter((operation) => operation.status === "skipped").length
    },
    operations,
    warnings
  };
}

function buildDoctorPayload(state) {
  const surfaces = state.surface ? [state.surface] : SUPPORTED_SKILL_SURFACES;
  const findings = [resolveCatalogCompatibilityFinding(state)];

  for (const surface of surfaces) {
    const discovery = discoverInstalledSkills(state, surface);
    const targetRelativePath = toRelativePath(state.cwd, discovery.target.targetPath);

    if (!fs.existsSync(discovery.target.targetPath)) {
      findings.push(
        createFinding({
          id: `skills.${surface}.target`,
          severity: "warning",
          status: "warn",
          message: `Skill install target is missing for ${surface}.`,
          target: targetRelativePath,
          suggestion: `Run \`repo-ai-governor skills install --surface ${surface}\` to bootstrap the target.`
        })
      );
      continue;
    }

    findings.push(
      createFinding({
        id: `skills.${surface}.target`,
        severity: "info",
        status: "pass",
        message: `Skill install target is present for ${surface}.`,
        target: targetRelativePath
      })
    );

    for (const installedSkill of discovery.installedSkills) {
      if (installedSkill.status === "installed") {
        findings.push(
          createFinding({
            id: `skills.${surface}.${installedSkill.id}`,
            severity: "info",
            status: "pass",
            message: `Installed skill ${installedSkill.id} is healthy.`,
            target: toRelativePath(state.cwd, installedSkill.skillRoot)
          })
        );
        continue;
      }

      if (installedSkill.status === "external") {
        findings.push(
          createFinding({
            id: `skills.${surface}.${installedSkill.id}`,
            severity: "info",
            status: "pass",
            message: `Found external skill ${installedSkill.id}; skipped manifest validation.`,
            target: toRelativePath(state.cwd, installedSkill.skillRoot)
          })
        );
        continue;
      }

      findings.push(
        createFinding({
          id: `skills.${surface}.${installedSkill.id}`,
          severity: "error",
          status: "fail",
          message: `Installed skill ${installedSkill.id} is invalid: ${installedSkill.issues.join("; ")}`,
          target: toRelativePath(state.cwd, installedSkill.skillRoot),
          suggestion: `Reinstall ${installedSkill.id} with \`repo-ai-governor skills install --surface ${surface} --skill ${installedSkill.id} --force\`.`
        })
      );
    }
  }

  if (state.catalogState.skills.length === 0) {
    findings.push(
      createFinding({
        id: "skills.catalog.empty",
        severity: "warning",
        status: "warn",
        message: "Official skill catalog is currently empty.",
        target: toRelativePath(state.cwd, state.catalogState.catalogPath),
        suggestion: "Populate official skill assets before expecting install to copy bundled skills."
      })
    );
  }

  const summary = summarizeFindings(findings, state.strict);

  return {
    command: "skills",
    action: "doctor",
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
      surfaces
    },
    exitCode: summary.exitCode
  };
}

export async function executeSkillsCommand(commandContext, logger) {
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
      throw new BusinessCheckError("skills doctor found blocking issues.", {
        code: "cli.skills_doctor_failed",
        details: {
          summary: payload.summary
        }
      });
    }

    return payload.exitCode;
  }

  throw new InputError(`Unsupported skills action: ${action}`, {
    code: "cli.skills_unsupported_action"
  });
}
