import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { createReviewFileName } from "../config/repository-layout.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { renderRulesForConsumer, resolveStandardsPackage } from "../standards/official-base-package.js";
import { executeWorkflow } from "../workflow/governance-engine.js";
import { normalizeLocale, translateLocale } from "../utils/common.js";
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

function isEnglishLocale(locale) {
  return normalizeLocale(locale) === "en-US";
}

function t(locale, zhCN, enUS) {
  return translateLocale(locale, zhCN, enUS);
}

function detectReviewStatus(fileName, locale = "zh-CN") {
  if (fileName.startsWith("review_")) {
    return "pending";
  }

  if (fileName.startsWith("verified_review_")) {
    return "verified";
  }

  if (fileName.startsWith("resolved_review_")) {
    return "resolved";
  }

  throw new InputError(
    t(locale, `不支持的评审文件命名：${fileName}`, `Unsupported review file name: ${fileName}`),
    {
      code: "cli.review_verify_invalid_source_name",
      details: {
        fileName
      }
    }
  );
}

function extractReviewSlugFromFileName(fileName) {
  return fileName
    .replace(/^verified_review_/, "")
    .replace(/^resolved_review_/, "")
    .replace(/^review_/, "")
    .replace(/\.md$/, "");
}

function extractSectionBody(content, headings) {
  const headingList = Array.isArray(headings) ? headings : [headings];

  for (const heading of headingList) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`## ${escapedHeading}\\n([\\s\\S]*?)(?=\\n## |$)`);
    const match = content.match(pattern);

    if (match) {
      return match[1].trim();
    }
  }

  return "";
}

function parseNumberedSectionItems(content, headings) {
  const body = extractSectionBody(content, headings);

  if (!body) {
    return [];
  }

  return body
    .split(/\n(?=\d+\.\s)/)
    .map((entry) => entry.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function extractTargetsFromSource(cwd, sourceContent) {
  const targetsSection = extractSectionBody(sourceContent, ["Targets", "目标文件"]);
  const matches = Array.from(targetsSection.matchAll(/`([^`]+)`/g), (match) => match[1]);

  return matches.map((target) => path.resolve(cwd, target)).filter((target) => fs.existsSync(target));
}

function formatNumberedList(items, locale) {
  if (items.length === 0) {
    return t(locale, "1. 暂无记录。", "1. No entries recorded.");
  }

  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function renderFindingsList(findings, locale) {
  if (findings.length === 0) {
    return t(locale, "1. 无剩余评审发现。", "1. No remaining review findings.");
  }

  return findings
    .map((finding, index) => {
      const lines = [
        `${index + 1}. [${finding.severity}] ${finding.message}`,
        `${t(locale, "目标", "Target")}: \`${finding.target}\``
      ];

      if (finding.ruleId) {
        lines.push(`${t(locale, "规则", "Rule")}: \`${finding.ruleId}\``);
      }

      if (finding.suggestion) {
        lines.push(`${t(locale, "建议", "Suggestion")}: ${finding.suggestion}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

function renderStandardsList(standards, locale) {
  if (standards.length === 0) {
    return t(locale, "1. 未加载面向 review-verify 阶段的规范。", "1. No review-verify standards were loaded.");
  }

  return standards
    .map(
      (rule, index) =>
        `${index + 1}. \`${rule.id}\` ${rule.title}\n${t(locale, "摘要", "Summary")}: ${rule.summary}`
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

  entries.push(
    t(
      runState.locale,
      `重新执行 review-verify，覆盖 ${analysis.relativeTargets.length} 个目标。`,
      `Re-ran review verification for ${analysis.relativeTargets.length} target(s).`
    )
  );
  entries.push(
    t(
      runState.locale,
      `复核结果：\`${summary.status}\`；errors=\`${summary.errors}\`，warnings=\`${summary.warnings}\`。`,
      `Verification result: \`${summary.status}\`; errors=\`${summary.errors}\`, warnings=\`${summary.warnings}\`.`
    )
  );

  if (analysis.findings.length === 0) {
    entries.push(t(runState.locale, "未发现剩余评审问题。", "No remaining review findings were detected."));
  } else {
    entries.push(
      t(
        runState.locale,
        `剩余发现：${analysis.findings
          .map((finding) => `[${finding.severity}] ${finding.message} (${finding.target})`)
          .join("；")}`,
        `Remaining findings: ${analysis.findings
          .map((finding) => `[${finding.severity}] ${finding.message} (${finding.target})`)
          .join("; ")}`
      )
    );
  }

  return entries;
}

function buildResolutionEntries(runState, nextStatus, summary) {
  const entries = [...runState.previousResolutionEntries];

  if (nextStatus === "resolved") {
    entries.push(
      t(
        runState.locale,
        "复核复跑确认无剩余发现；生命周期已推进为 resolved。",
        "Verification rerun confirmed no remaining findings; lifecycle promoted to resolved."
      )
    );
    return entries;
  }

  if (entries.length > 0) {
    return entries;
  }

  if (summary.status === "pass") {
    return [t(runState.locale, "复核前无需额外修复。", "No additional fixes were required before verification.")];
  }

  return [
    t(
      runState.locale,
      "剩余发现已记录在 verified review 文件中。",
      "Remaining findings are tracked in the verified review file."
    )
  ];
}

function buildMarkdownOutput(payload) {
  const locale = normalizeLocale(payload.locale);
  return ensureTrailingNewline(
    [
      `${t(locale, "# 评审", "# Review")} ${payload.slug}`,
      "",
      `- ${t(locale, "状态", "Status")}: ${payload.reviewStatusAfter}`,
      `- ${t(locale, "结果", "Result")}: ${payload.status}`,
      `- ${t(locale, "时间", "Date")}: ${payload.generatedAt}`,
      `- ${t(locale, "项目", "Project")}: \`${payload.currentProject}\``,
      `- ${t(locale, "Sprint", "Sprint")}: \`${payload.currentSprint}\``,
      `- ${t(locale, "文件生命周期", "File lifecycle")}:`,
      `  - ${t(locale, "待复核", "Pending verify")}: \`${payload.reviewLifecycle.pending}\``,
      `  - ${t(locale, "已复核", "Verified")}: \`${payload.reviewLifecycle.verified}\``,
      `  - ${t(locale, "已解决", "Resolved")}: \`${payload.reviewLifecycle.resolved}\``,
      "",
      `## ${t(locale, "复核范围", "Scope")}`,
      "",
      `${t(locale, "命令", "Command")}: \`review-verify\``,
      payload.strict ? `${t(locale, "严格模式", "Strict mode")}: \`true\`` : "",
      `${t(locale, "来源评审文件", "Source review")}: \`${payload.sourceFile}\``,
      payload.pathOption ? `${t(locale, "路径覆盖", "Path override")}: \`${payload.pathOption}\`` : "",
      payload.base ? `${t(locale, "Base 覆盖", "Base override")}: \`${payload.base}\`` : "",
      payload.head ? `${t(locale, "Head 覆盖", "Head override")}: \`${payload.head}\`` : "",
      "",
      `## ${t(locale, "目标文件", "Targets")}`,
      "",
      formatNumberedList(payload.targets.map((target) => `\`${target}\``), locale),
      "",
      `## ${t(locale, "摘要", "Summary")}`,
      "",
      `1. ${t(locale, "复核结果", "Verification result")}: \`${payload.status}\``,
      `2. ${t(locale, "评审生命周期", "Review lifecycle")}: \`${payload.reviewStatusBefore}\` -> \`${payload.reviewStatusAfter}\``,
      `3. ${t(locale, "剩余发现", "Remaining findings")}: \`${payload.findings.length}\``,
      `4. ${t(locale, "错误", "Errors")}: \`${payload.summary.errors}\`，${t(locale, "告警", "Warnings")}: \`${payload.summary.warnings}\``,
      "",
      `## ${t(locale, "评审发现", "Review Findings")}`,
      "",
      renderFindingsList(payload.findings, locale),
      "",
      `## ${t(locale, "命中规范", "Matched Standards")}`,
      "",
      renderStandardsList(payload.standards.reviewVerifyRules, locale),
      "",
      `## ${t(locale, "复核追加记录", "Verify Append Log")}`,
      "",
      formatNumberedList(payload.verifyEntries, locale),
      "",
      `## ${t(locale, "解决记录", "Resolution Log")}`,
      "",
      formatNumberedList(payload.resolutionEntries, locale)
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function buildReviewVerifyRun(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const sourceOption = commandContext.commandOptions.source;
  const requestedLocale = normalizeLocale(commandContext.globalOptions.locale);

  if (!sourceOption) {
    throw new InputError(
      t(
        requestedLocale,
        "review-verify 命令需要 --source 指向一个已存在的评审文件。",
        "Review-verify command requires --source to point to an existing review file."
      ),
      {
        code: "cli.review_verify_missing_source",
        details: {
          cwd
        }
      }
    );
  }

  const sourceFilePath = path.resolve(cwd, sourceOption);

  if (!fs.existsSync(sourceFilePath)) {
    throw new InputError(
      t(requestedLocale, `未找到评审来源文件：${sourceFilePath}`, `Review source file not found: ${sourceFilePath}`),
      {
        code: "cli.review_verify_source_missing",
        details: {
          source: sourceFilePath
        }
      }
    );
  }

  const sourceFileName = path.basename(sourceFilePath);
  const sourceStatus = detectReviewStatus(sourceFileName, requestedLocale);

  if (sourceStatus === "resolved") {
    throw new InputError(
      t(
        requestedLocale,
        "resolved 状态的评审文件无需再次执行 review-verify。",
        "Resolved review files do not require another review-verify pass."
      ),
      {
        code: "cli.review_verify_already_resolved",
        details: {
          source: sourceFilePath
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
  const locale = normalizeLocale(
    commandContext.globalOptions.locale ?? resolvedConfig.config.standards.locales.default
  );
  const artifactPaths = buildArtifactPaths(cwd, resolvedConfig, locale);
  const standardsPackage = resolveStandardsPackage(resolvedConfig.config.standards);
  const sourceContent = fs.readFileSync(sourceFilePath, "utf8");
  const targetFiles =
    commandContext.commandOptions.path
      ? collectPathTargets(cwd, commandContext.commandOptions.path, locale)
      : commandContext.commandOptions.base || commandContext.commandOptions.head
        ? collectGitTargets(cwd, commandContext.commandOptions.base, commandContext.commandOptions.head)
        : extractTargetsFromSource(cwd, sourceContent);

  if (targetFiles.length === 0) {
    throw new InputError(
      t(
        locale,
        "review-verify 未能从来源评审文件或 CLI 参数解析出目标文件。",
        "Review-verify could not resolve any target files from the source review or CLI options."
      ),
      {
        code: "cli.review_verify_no_targets",
        details: {
          source: sourceFilePath
        }
      }
    );
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
    locale,
    previousVerifyEntries: parseNumberedSectionItems(sourceContent, [
      "Verify Append Log",
      "复核追加记录"
    ]).filter(
      (entry) =>
        entry !== "Pending verification. Append review-verify results to this file and rename it to the next review status." &&
        entry !== "待复核。请将 review-verify 结果追加到本文件，并重命名为下一状态文件。"
    ),
    previousResolutionEntries: parseNumberedSectionItems(sourceContent, [
      "Resolution Log",
      "解决记录"
    ]).filter(
      (entry) => entry !== "No resolutions have been applied yet." && entry !== "尚未应用任何解决动作。"
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
              ? t(
                  runState.locale,
                  "复核完成，无剩余评审发现。",
                  "Review verification completed without remaining findings."
                )
              : t(
                  runState.locale,
                  `复核完成，剩余 ${analysis.findings.length} 条评审发现。`,
                  `Review verification completed with ${analysis.findings.length} remaining findings.`
                ),
          outputs: {
            analysis,
            summary
          },
          details: {
            targets: analysis.relativeTargets
          },
          warnings:
            summary.warnings > 0
              ? [
                  t(
                    runState.locale,
                    `复核报告包含 ${summary.warnings} 条告警发现。`,
                    `Review verification reported ${summary.warnings} warning findings.`
                  )
                ]
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
    locale: runState.locale,
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
    logger.error(t(payload.locale, "复核发现阻断问题", "Review verification found blocking issues"));
  } else if (payload.status === "warn") {
    logger.warn(t(payload.locale, "复核发现非阻断问题", "Review verification found non-blocking issues"));
  } else {
    logger.success(t(payload.locale, "复核通过", "Review verification passed"));
  }

  logger.keyValue(t(payload.locale, "来源文件", "Source file"), payload.sourceFile);
  logger.keyValue(t(payload.locale, "生命周期", "Lifecycle"), `${payload.reviewStatusBefore} -> ${payload.reviewStatusAfter}`);
  logger.keyValue(t(payload.locale, "目标文件", "Targets"), String(payload.targets.length));
  logger.keyValue(t(payload.locale, "评审发现", "Findings"), String(payload.findings.length));
  logger.keyValue(t(payload.locale, "输出文件", "Output file"), payload.outputFile);
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
