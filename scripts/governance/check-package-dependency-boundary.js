#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONFIG_PATH = "scripts/governance/dependency-boundary.config.json";
const DEFAULT_SCAN_ROOTS = Object.freeze(["apps", "packages"]);
const DEFAULT_FILE_EXTENSIONS = Object.freeze([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".mjs",
  ".cjs",
]);
const DEFAULT_EXCLUDED_DIRECTORIES = Object.freeze([".git", "node_modules", "dist", "coverage"]);
const VALID_SEVERITIES = new Set(["blocking", "major", "minor"]);
const IMPORT_PATTERNS = Object.freeze([
  /\bimport\s+(?:type\s+)?[^"'\n]*?\sfrom\s*["']([^"']+)["']/g,
  /\bexport\s+[^"'\n]*?\sfrom\s*["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,
]);
const SEVERITY_ORDER = new Map([
  ["blocking", 0],
  ["major", 1],
  ["minor", 2],
]);

function toPosixPath(value) {
  return String(value).replace(/\\/g, "/");
}

function normalizeRelativePath(value) {
  return toPosixPath(String(value ?? ""))
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function normalizePrefix(value) {
  return normalizeRelativePath(value).replace(/\/+$/, "");
}

function isPathUnderPrefix(targetPath, prefix) {
  const normalizedTargetPath = normalizeRelativePath(targetPath);
  const normalizedPrefix = normalizePrefix(prefix);

  if (!normalizedPrefix) {
    return false;
  }

  return (
    normalizedTargetPath === normalizedPrefix ||
    normalizedTargetPath.startsWith(`${normalizedPrefix}/`)
  );
}

function startsWithAnyPrefix(targetPath, prefixes) {
  return prefixes.some((prefix) => isPathUnderPrefix(targetPath, prefix));
}

function parseArguments(argv) {
  let cwd = process.cwd();
  let format = "summary";
  let mode = "warning";
  let configPath = DEFAULT_CONFIG_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--format=json") {
      format = "json";
      continue;
    }

    if (argument === "--mode") {
      mode = String(argv[index + 1] ?? mode);
      index += 1;
      continue;
    }

    if (argument.startsWith("--mode=")) {
      mode = argument.slice("--mode=".length);
      continue;
    }

    if (argument === "--cwd") {
      cwd = path.resolve(argv[index + 1] ?? cwd);
      index += 1;
      continue;
    }

    if (argument.startsWith("--cwd=")) {
      cwd = path.resolve(argument.slice("--cwd=".length));
      continue;
    }

    if (argument === "--config") {
      configPath = String(argv[index + 1] ?? configPath);
      index += 1;
      continue;
    }

    if (argument.startsWith("--config=")) {
      configPath = argument.slice("--config=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (mode !== "warning" && mode !== "blocking") {
    throw new Error(`Invalid mode: ${mode}. Expected warning|blocking`);
  }

  return {
    cwd,
    format,
    mode,
    configPath,
  };
}

function normalizeArray(values, fallback) {
  if (!Array.isArray(values) || values.length === 0) {
    return [...fallback];
  }

  return values
    .map((value) => String(value))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeFileExtensions(values) {
  const extensions = normalizeArray(values, DEFAULT_FILE_EXTENSIONS).map((value) =>
    value.startsWith(".") ? value : `.${value}`,
  );

  return Array.from(new Set(extensions)).sort((left, right) => left.localeCompare(right));
}

function normalizeRule(rule) {
  if (!rule || typeof rule !== "object") {
    return null;
  }

  const id = typeof rule.id === "string" ? rule.id.trim() : "";
  if (!id) {
    return null;
  }

  const fromPrefixes = normalizeArray(rule.fromPrefixes, []).map(normalizePrefix).filter(Boolean);
  const toPrefixes = normalizeArray(rule.toPrefixes, []).map(normalizePrefix).filter(Boolean);

  if (fromPrefixes.length === 0 || toPrefixes.length === 0) {
    return null;
  }

  const severity =
    typeof rule.severity === "string" && VALID_SEVERITIES.has(rule.severity)
      ? rule.severity
      : "major";

  const message = typeof rule.message === "string" ? rule.message.trim() : "";
  const suggestedFix = typeof rule.suggestedFix === "string" ? rule.suggestedFix.trim() : "";

  return {
    id,
    severity,
    fromPrefixes,
    toPrefixes,
    message,
    suggestedFix,
  };
}

function normalizeAllowEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const from = normalizePrefix(entry.from);
  const to = normalizePrefix(entry.to);

  if (!from || !to) {
    return null;
  }

  const ruleId = typeof entry.ruleId === "string" ? entry.ruleId.trim() : "";
  const reason = typeof entry.reason === "string" ? entry.reason.trim() : "";
  const expiry = typeof entry.expiry === "string" ? entry.expiry.trim() : "";

  return {
    from,
    to,
    ruleId,
    reason,
    expiry,
  };
}

function loadConfig(rootDirectory, configPath) {
  const resolvedConfigPath = path.resolve(rootDirectory, configPath);

  if (!fs.existsSync(resolvedConfigPath)) {
    return {
      configPath: normalizeRelativePath(path.relative(rootDirectory, resolvedConfigPath)),
      loaded: false,
      scanRoots: [...DEFAULT_SCAN_ROOTS],
      fileExtensions: [...DEFAULT_FILE_EXTENSIONS],
      excludedDirectories: [...DEFAULT_EXCLUDED_DIRECTORIES],
      denyRules: [],
      allowList: [],
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedConfigPath, "utf8"));
  const scanRoots = normalizeArray(parsed.scanRoots, DEFAULT_SCAN_ROOTS).map(normalizePrefix);
  const fileExtensions = normalizeFileExtensions(parsed.fileExtensions);
  const excludedDirectories = normalizeArray(
    parsed.excludeDirectories,
    DEFAULT_EXCLUDED_DIRECTORIES,
  );
  const denyRules = Array.isArray(parsed.denyRules)
    ? parsed.denyRules.map(normalizeRule).filter(Boolean)
    : [];
  const allowList = Array.isArray(parsed.allowList)
    ? parsed.allowList.map(normalizeAllowEntry).filter(Boolean)
    : [];

  return {
    configPath: normalizeRelativePath(path.relative(rootDirectory, resolvedConfigPath)),
    loaded: true,
    scanRoots,
    fileExtensions,
    excludedDirectories,
    denyRules,
    allowList,
  };
}

function walkFiles(baseDirectory, onFile, excludedDirectories) {
  if (!fs.existsSync(baseDirectory)) {
    return;
  }

  const stack = [baseDirectory];

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    const entries = fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        if (excludedDirectories.has(entry.name)) {
          continue;
        }

        stack.push(entryPath);
        continue;
      }

      onFile(entryPath);
    }
  }
}

function collectSourceFiles(rootDirectory, scanRoots, fileExtensions, excludedDirectories) {
  const files = new Set();

  for (const root of scanRoots) {
    const rootPath = path.join(rootDirectory, root);
    walkFiles(
      rootPath,
      (filePath) => {
        if (!fileExtensions.some((extension) => filePath.endsWith(extension))) {
          return;
        }

        const relativePath = normalizeRelativePath(path.relative(rootDirectory, filePath));
        files.add(relativePath);
      },
      excludedDirectories,
    );
  }

  return [...files].sort((left, right) => left.localeCompare(right));
}

function extractImportSpecifiers(content) {
  const specifiers = new Set();

  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;

    let match = pattern.exec(content);
    while (match) {
      const specifier = String(match[1] ?? "").trim();
      if (specifier) {
        specifiers.add(specifier);
      }

      match = pattern.exec(content);
    }
  }

  return [...specifiers];
}

function resolveExistingPath(targetPath, fileExtensions) {
  const candidates = [targetPath];

  for (const extension of fileExtensions) {
    candidates.push(`${targetPath}${extension}`);
  }

  for (const extension of fileExtensions) {
    candidates.push(path.join(targetPath, `index${extension}`));
  }

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    if (fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return targetPath;
}

function resolveImportTarget(sourceAbsolutePath, specifier, fileExtensions) {
  if (specifier.startsWith(".")) {
    const targetPath = path.resolve(path.dirname(sourceAbsolutePath), specifier);
    return resolveExistingPath(targetPath, fileExtensions);
  }

  if (specifier.startsWith("/")) {
    const absolutePath = path.resolve(specifier);
    return resolveExistingPath(absolutePath, fileExtensions);
  }

  return null;
}

function buildEdges(rootDirectory, sourceFiles, scanRoots, fileExtensions) {
  const edges = [];

  for (const sourceFile of sourceFiles) {
    const sourceAbsolutePath = path.resolve(rootDirectory, sourceFile);
    const content = fs.readFileSync(sourceAbsolutePath, "utf8");
    const specifiers = extractImportSpecifiers(content);

    for (const specifier of specifiers) {
      const resolvedTarget = resolveImportTarget(sourceAbsolutePath, specifier, fileExtensions);

      if (!resolvedTarget) {
        continue;
      }

      const targetRelativePath = normalizeRelativePath(
        path.relative(rootDirectory, resolvedTarget),
      );
      if (!targetRelativePath || targetRelativePath.startsWith("..")) {
        continue;
      }

      if (!startsWithAnyPrefix(targetRelativePath, scanRoots)) {
        continue;
      }

      edges.push({
        from: sourceFile,
        to: targetRelativePath,
        importPath: specifier,
      });
    }
  }

  return edges;
}

function matchAllowEntry(edge, rule, allowList) {
  return allowList.find((entry) => {
    if (entry.ruleId && entry.ruleId !== rule.id) {
      return false;
    }

    return isPathUnderPrefix(edge.from, entry.from) && isPathUnderPrefix(edge.to, entry.to);
  });
}

function evaluateEdges(edges, denyRules, allowList) {
  const violations = [];
  const ignoredByAllowList = [];

  for (const edge of edges) {
    for (const rule of denyRules) {
      if (!startsWithAnyPrefix(edge.from, rule.fromPrefixes)) {
        continue;
      }

      if (!startsWithAnyPrefix(edge.to, rule.toPrefixes)) {
        continue;
      }

      const matchedAllowEntry = matchAllowEntry(edge, rule, allowList);
      if (matchedAllowEntry) {
        ignoredByAllowList.push({
          ruleId: rule.id,
          from: edge.from,
          to: edge.to,
          importPath: edge.importPath,
          reason: matchedAllowEntry.reason,
          expiry: matchedAllowEntry.expiry,
        });
        continue;
      }

      violations.push({
        rule_id: rule.id,
        severity: rule.severity,
        from: edge.from,
        to: edge.to,
        import_path: edge.importPath,
        message: rule.message || `Dependency boundary violated by rule ${rule.id}.`,
        suggested_fix: rule.suggestedFix,
      });
    }
  }

  violations.sort((left, right) => {
    const severityDelta =
      (SEVERITY_ORDER.get(left.severity) ?? 99) - (SEVERITY_ORDER.get(right.severity) ?? 99);
    if (severityDelta !== 0) {
      return severityDelta;
    }

    if (left.from !== right.from) {
      return left.from.localeCompare(right.from);
    }

    if (left.to !== right.to) {
      return left.to.localeCompare(right.to);
    }

    return left.rule_id.localeCompare(right.rule_id);
  });

  return {
    violations,
    ignoredByAllowList,
  };
}

function countBySeverity(violations) {
  const counts = {
    blocking: 0,
    major: 0,
    minor: 0,
  };

  for (const violation of violations) {
    const severity = violation.severity;
    if (!Object.prototype.hasOwnProperty.call(counts, severity)) {
      continue;
    }

    counts[severity] += 1;
  }

  return counts;
}

function formatSummary(payload) {
  return [
    "dependency-boundary-check",
    `status=${payload.status}`,
    `mode=${payload.mode}`,
    `config=${payload.configPath}`,
    `scanRoots=${payload.scanRoots.join(",")}`,
    `scannedFiles=${payload.scannedFiles}`,
    `checkedEdges=${payload.checkedEdges}`,
    `violations=${payload.violations.length}`,
    `blockingViolations=${payload.bySeverity.blocking}`,
    `majorViolations=${payload.bySeverity.major}`,
    `minorViolations=${payload.bySeverity.minor}`,
    `ignoredByAllowList=${payload.ignoredByAllowList.length}`,
  ].join("\n");
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const rootDirectory = path.resolve(options.cwd);
  const config = loadConfig(rootDirectory, options.configPath);
  const scanRoots = config.scanRoots;
  const sourceFiles = collectSourceFiles(
    rootDirectory,
    scanRoots,
    config.fileExtensions,
    new Set(config.excludedDirectories),
  );
  const edges = buildEdges(rootDirectory, sourceFiles, scanRoots, config.fileExtensions);
  const { violations, ignoredByAllowList } = evaluateEdges(
    edges,
    config.denyRules,
    config.allowList,
  );
  const bySeverity = countBySeverity(violations);
  const hasBlockableViolations = bySeverity.blocking > 0 || bySeverity.major > 0;

  let status = "pass";
  if (violations.length > 0) {
    if (options.mode === "blocking" && hasBlockableViolations) {
      status = "fail";
    } else {
      status = "warn";
    }
  }

  const payload = {
    status,
    mode: options.mode,
    root: normalizeRelativePath(rootDirectory),
    configPath: config.configPath,
    configLoaded: config.loaded,
    scanRoots,
    scannedFiles: sourceFiles.length,
    checkedEdges: edges.length,
    bySeverity,
    violations,
    ignoredByAllowList,
    generatedAt: new Date().toISOString(),
  };

  if (options.format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(payload)}\n`);
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      process.stderr.write(
        `${violation.severity.toUpperCase()} ${violation.rule_id}: ${violation.from} -> ${violation.to} (${violation.import_path})\n`,
      );
    }
  }

  if (options.mode === "blocking" && hasBlockableViolations) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = 0;
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `dependency-boundary-check failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
}
