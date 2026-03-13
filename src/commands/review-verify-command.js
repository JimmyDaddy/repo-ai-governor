import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { createReviewFileName } from "../config/repository-layout.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { renderRulesForConsumer, resolveStandardsPackage } from "../standards/official-base-package.js";
import { executeWorkflow } from "../workflow/governance-engine.js";
import {
  analyzeTargets,
  buildArtifactPaths,
  collectGitTargets,
  collectPathTargets,
  summarizeFindings,
  toRelativePath
} from "./review-command.js";

const REVIEW_VERIFY_WORKFLOW_TEMPLATE = Object.freeze({
  id: "governance-review-verify",
  version: "1",
  kind: "workflow-template",
  meta: {
    name: {
      "zh-CN": "治理评审复核流程",
      "en-US": "Governance Review Verify Flow"
    },
    description: {
      "zh-CN": "用于复核 review 结果、回写 CR 文件并推进状态。",
      "en-US": "Re-validates review findings, appends verification logs, and advances the CR lifecycle."
    }
  },
  execution: {
    mode: "serial",
    allowSkipStages: false,
    stopOnFailure: true
  },
  stages: [
    {
      id: "review-verify",
      name: {
        "zh-CN": "复核阶段",
        "en-US": "Review Verify Stage"
      },
      description: {
        "zh-CN": "重新校验 review 目标范围并写回应复核结论。",
        "en-US": "Re-checks the review scope and writes back verification conclusions."
      },
      executor: {
        kind: "internal",
        ref: "run-review-verify"
      }
    }
  ]
});

function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function formatDateTime(date = new Date()) {
  return date.toISOString();
}

function detectReviewStatus(fileName) {
  if (fileName.startsWith("review_")) {
    return "pending";
  }

  if (fileName.startsWith("verified_review_")) {
    return "verified";
  }

  if (fileName.startsWith("resolved_review_")) {
    return "resolved";
  }

  throw new InputError(`Unsupported review file name: ${fileName}`, {
    code: "cli.review_verify_invalid_source_name",
    details: {
      fileName
    }
  });
}

function extractReviewSlugFromFileName(fileName) {
  return fileName
    .replace(/^verified_review_/, "")
    .replace(/^resolved_review_/, "")
    .replace(/^review_/, "")
    .replace(/\.md$/, "");
}

function extractSectionBody(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escapedHeading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  return match ? match[1].trim() : "";
}

function parseNumberedSectionItems(content, heading) {
  const body = extractSectionBody(content, heading);

  if (!body) {
    return [];
  }

  return body
    .split(/\n(?=\d+\.\s)/)
    .map((entry) => entry.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function extractTargetsFromSource(cwd, sourceContent) {
  const targetsSection = extractSectionBody(sourceContent, "Targets");
  const matches = Array.from(targetsSection.matchAll(/`([^`]+)`/g), (match) => match[1]);

  return matches.map((target) => path.resolve(cwd, target)).filter((target) => fs.existsSync(target));
}

function formatNumberedList(items) {
  if (items.length === 0) {
    return "1. No entries recorded.";
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function renderFindingsList(findings) {
  if (findings.length === 0) {
    return "1. No remaining review findings.";
  }

  return findings
    .map((finding, index) => {
      const lines = [
        `${index + 1}. [${finding.severity}] ${finding.message}`,
        `Target: \`${finding.target}\``
      ];

      if (finding.ruleId) {
        lines.push(`Rule: \`${finding.ruleId}\``);
      }

      if (finding.suggestion) {
        lines.push(`Suggestion: ${finding.suggestion}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

function renderStandardsList(standards) {
  if (standards.length === 0) {
    return "1. No review-verify standards were loaded.";
  }

  return standards
    .map(
      (rule, index) =>
        `${index + 1}. \`${rule.id}\` ${rule.title}\nSummary: ${rule.summary}`
    )
    .join("\n\n");
}

function buildLifecycle(slug) {
  return {
    pending: createReviewFileName({ status: "pending", slug }),
    verified: createReviewFileName({ status: "verified", slug }),
    resolved: createReviewFileName({ status: "resolved", slug })
  };
}

function determineNextStatus(sourceStatus, summaryStatus) {
  if (sourceStatus === "pending") {
    return "verified";
  }

  if (sourceStatus === "verified" && summaryStatus === "pass") {
    return "resolved";
  }

  return "verified";
}

function buildVerifyEntries(runState, analysis, summary) {
  const entries = [...runState.previousVerifyEntries];

  entries.push(`Re-ran review verification for ${analysis.relativeTargets.length} target(s).`);
  entries.push(`Verification result: \`${summary.status}\`; errors=\`${summary.errors}\`, warnings=\`${summary.warnings}\`.`);

  if (analysis.findings.length === 0) {
    entries.push("No remaining review findings were detected.");
  } else {
    entries.push(
      `Remaining findings: ${analysis.findings
        .map((finding) => `[${finding.severity}] ${finding.message} (${finding.target})`)
        .join("; ")}`
    );
  }

  return entries;
}

function buildResolutionEntries(runState, nextStatus, summary) {
  const entries = [...runState.previousResolutionEntries];

  if (nextStatus === "resolved") {
    entries.push("Verification rerun confirmed no remaining findings; lifecycle promoted to resolved.");
    return entries;
  }

  if (entries.length > 0) {
    return entries;
  }

  if (summary.status === "pass") {
    return ["No additional fixes were required before verification."];
  }

  return ["Remaining findings are tracked in the verified review file."];
}

function buildMarkdownOutput(payload) {
  return ensureTrailingNewline(
    [
      `# Review ${payload.slug}`,
      "",
      `- Status: ${payload.reviewStatusAfter}`,
      `- Result: ${payload.status}`,
      `- Date: ${payload.generatedAt}`,
      `- Project: \`${payload.currentProject}\``,
      `- Sprint: \`${payload.currentSprint}\``,
      `- File lifecycle:`,
      `  - Pending verify: \`${payload.reviewLifecycle.pending}\``,
      `  - Verified: \`${payload.reviewLifecycle.verified}\``,
      `  - Resolved: \`${payload.reviewLifecycle.resolved}\``,
      "",
      "## Scope",
      "",
      "Command: `review-verify`",
      payload.strict ? "Strict mode: `true`" : "",
      `Source review: \`${payload.sourceFile}\``,
      payload.pathOption ? `Path override: \`${payload.pathOption}\`` : "",
      payload.base ? `Base override: \`${payload.base}\`` : "",
      payload.head ? `Head override: \`${payload.head}\`` : "",
      "",
      "## Targets",
      "",
      formatNumberedList(payload.targets.map((target) => `\`${target}\``)),
      "",
      "## Summary",
      "",
      `1. Verification result: \`${payload.status}\``,
      `2. Review lifecycle: \`${payload.reviewStatusBefore}\` -> \`${payload.reviewStatusAfter}\``,
      `3. Remaining findings: \`${payload.findings.length}\``,
      `4. Errors: \`${payload.summary.errors}\`, warnings: \`${payload.summary.warnings}\``,
      "",
      "## Review Findings",
      "",
      renderFindingsList(payload.findings),
      "",
      "## Matched Standards",
      "",
      renderStandardsList(payload.standards.reviewVerifyRules),
      "",
      "## Verify Append Log",
      "",
      formatNumberedList(payload.verifyEntries),
      "",
      "## Resolution Log",
      "",
      formatNumberedList(payload.resolutionEntries)
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function buildReviewVerifyRun(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const sourceOption = commandContext.commandOptions.source;

  if (!sourceOption) {
    throw new InputError("Review-verify command requires --source to point to an existing review file.", {
      code: "cli.review_verify_missing_source",
      details: {
        cwd
      }
    });
  }

  const sourceFilePath = path.resolve(cwd, sourceOption);

  if (!fs.existsSync(sourceFilePath)) {
    throw new InputError(`Review source file not found: ${sourceFilePath}`, {
      code: "cli.review_verify_source_missing",
      details: {
        source: sourceFilePath
      }
    });
  }

  const sourceFileName = path.basename(sourceFilePath);
  const sourceStatus = detectReviewStatus(sourceFileName);

  if (sourceStatus === "resolved") {
    throw new InputError("Resolved review files do not require another review-verify pass.", {
      code: "cli.review_verify_already_resolved",
      details: {
        source: sourceFilePath
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
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const sourceContent = fs.readFileSync(sourceFilePath, "utf8");
  const targetFiles =
    commandContext.commandOptions.path
      ? collectPathTargets(cwd, commandContext.commandOptions.path)
      : commandContext.commandOptions.base || commandContext.commandOptions.head
        ? collectGitTargets(cwd, commandContext.commandOptions.base, commandContext.commandOptions.head)
        : extractTargetsFromSource(cwd, sourceContent);

  if (targetFiles.length === 0) {
    throw new InputError("Review-verify could not resolve any target files from the source review or CLI options.", {
      code: "cli.review_verify_no_targets",
      details: {
        source: sourceFilePath
      }
    });
  }

  return {
    cwd,
    resolvedConfig,
    standardsPackage,
    artifactPaths,
    sourceFilePath,
    sourceFileName,
    sourceStatus,
    sourceContent,
    slug: extractReviewSlugFromFileName(sourceFileName),
    targetFiles,
    pathOption: commandContext.commandOptions.path ?? null,
    base: commandContext.commandOptions.base ?? null,
    head: commandContext.commandOptions.head ?? null,
    strict: commandContext.commandOptions.strict === true,
    dryRun: commandContext.globalOptions.dryRun === true,
    locale: commandContext.globalOptions.locale ?? resolvedConfig.config.execution.defaultLocale,
    previousVerifyEntries: parseNumberedSectionItems(sourceContent, "Verify Append Log").filter(
      (entry) => !entry.startsWith("Pending verification.")
    ),
    previousResolutionEntries: parseNumberedSectionItems(sourceContent, "Resolution Log").filter(
      (entry) => entry !== "No resolutions have been applied yet."
    )
  };
}

async function executeReviewVerifyWorkflow(runState) {
  const workflowResult = await executeWorkflow({
    template: REVIEW_VERIFY_WORKFLOW_TEMPLATE,
    targetStages: ["review-verify"],
    metadata: {
      cwd: runState.cwd
    },
    handlers: {
      "review-verify"() {
        const analysis = analyzeTargets(runState);
        const summary = summarizeFindings(analysis.findings, {
          failOnWarnings: runState.strict
        });

        return {
          status: summary.exitCode === 0 ? "passed" : "failed",
          summary:
            summary.status === "pass"
              ? "Review verification completed without remaining findings."
              : `Review verification completed with ${analysis.findings.length} remaining findings.`,
          outputs: {
            analysis,
            summary
          },
          details: {
            targets: analysis.relativeTargets
          },
          warnings:
            summary.warnings > 0
              ? [`Review verification reported ${summary.warnings} warning findings.`]
              : []
        };
      }
    }
  });

  const verifyStage = workflowResult.stages.find((stage) => stage.id === "review-verify");
  return {
    workflowResult,
    analysis: verifyStage?.outputs.analysis ?? { findings: [], matchedRuleIds: [], relativeTargets: [] },
    summary: verifyStage?.outputs.summary ?? summarizeFindings([], {
      failOnWarnings: runState.strict
    })
  };
}

function buildReviewVerifyPayload(runState, workflowResult, analysis, summary, outputFilePath = null) {
  const reviewLifecycle = buildLifecycle(runState.slug);
  const reviewStatusAfter = determineNextStatus(runState.sourceStatus, summary.status);
  const verifyEntries = buildVerifyEntries(runState, analysis, summary);
  const resolutionEntries = buildResolutionEntries(runState, reviewStatusAfter, summary);
  const reviewVerifyRules = renderRulesForConsumer(runState.standardsPackage, "review-verify", runState.locale);

  return {
    command: "review-verify",
    status: summary.status,
    dryRun: runState.dryRun,
    cwd: runState.cwd,
    configFile: runState.resolvedConfig.paths.configFile,
    currentProject: runState.resolvedConfig.config.execution.currentProject,
    currentSprint: runState.resolvedConfig.config.execution.currentSprint,
    generatedAt: formatDateTime(),
    sourceFile: toRelativePath(runState.cwd, runState.sourceFilePath),
    reviewStatusBefore: runState.sourceStatus,
    reviewStatusAfter,
    strict: runState.strict,
    slug: runState.slug,
    pathOption: runState.pathOption,
    base: runState.base,
    head: runState.head,
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
      stages: workflowResult.stages.map((stage) => ({
        id: stage.id,
        status: stage.status,
        summary: stage.summary,
        blockedBy: stage.blockedBy
      }))
    },
    targets: analysis.relativeTargets,
    findings: analysis.findings,
    summary,
    standards: {
      preset: runState.standardsPackage.id,
      totalRules: runState.standardsPackage.rules.length,
      matchedRuleIds: analysis.matchedRuleIds,
      reviewVerifyRules
    },
    reviewLifecycle,
    verifyEntries,
    resolutionEntries,
    outputFile: outputFilePath
      ? toRelativePath(runState.cwd, outputFilePath)
      : toRelativePath(
          runState.cwd,
          path.resolve(runState.artifactPaths.codeReviewRoot, reviewLifecycle[reviewStatusAfter])
        )
  };
}

function writeVerifiedReviewFile(runState, payload) {
  const outputFilePath = path.resolve(
    runState.artifactPaths.codeReviewRoot,
    payload.reviewLifecycle[payload.reviewStatusAfter]
  );

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, buildMarkdownOutput(payload), "utf8");

  if (outputFilePath !== runState.sourceFilePath && fs.existsSync(runState.sourceFilePath)) {
    fs.rmSync(runState.sourceFilePath);
  }

  return outputFilePath;
}

function writeReviewVerifyOutput(logger, commandContext, payload) {
  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    logger.raw(buildMarkdownOutput(payload), { ignoreQuiet: true });
    return;
  }

  if (payload.status === "fail") {
    logger.error("Review verification found blocking issues");
  } else if (payload.status === "warn") {
    logger.warn("Review verification found non-blocking issues");
  } else {
    logger.success("Review verification passed");
  }

  logger.keyValue("Source file", payload.sourceFile);
  logger.keyValue("Lifecycle", `${payload.reviewStatusBefore} -> ${payload.reviewStatusAfter}`);
  logger.keyValue("Targets", String(payload.targets.length));
  logger.keyValue("Findings", String(payload.findings.length));
  logger.keyValue("Output file", payload.outputFile);
}

export async function executeReviewVerifyCommand(commandContext, logger) {
  const runState = buildReviewVerifyRun(commandContext);
  const { workflowResult, analysis, summary } = await executeReviewVerifyWorkflow(runState);
  let payload = buildReviewVerifyPayload(runState, workflowResult, analysis, summary, null);

  if (!runState.dryRun) {
    const outputFilePath = writeVerifiedReviewFile(runState, payload);
    payload = buildReviewVerifyPayload(runState, workflowResult, analysis, summary, outputFilePath);
  }

  writeReviewVerifyOutput(logger, commandContext, payload);
  return payload.summary.exitCode;
}
