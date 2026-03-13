import fs from "node:fs";
import path from "node:path";
import { loadResolvedConfig } from "../config/load-config.js";
import { InputError } from "../cli/runtime/errors.js";
import { loadReportSource } from "../reporting/report-source.js";
import { renderUnifiedReport } from "../reporting/report-model.js";

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
}

function buildReportRun(commandContext) {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const sourceOption = commandContext.commandOptions.source;

  if (!sourceOption) {
    throw new InputError("Report command requires --source to point to an existing result file.", {
      code: "cli.report_missing_source",
      details: {
        cwd
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
  const sourceFilePath = path.resolve(cwd, sourceOption);
  const { sourceKind, report } = loadReportSource(sourceFilePath);
  const format = commandContext.format;
  const configuredOutputPath = path.resolve(
    cwd,
    commandContext.commandOptions.out ??
      path.join(
        resolvedConfig.config.reporting.outputDir,
        resolvedConfig.config.reporting.fileNames?.[format] ??
          resolvedConfig.config.reporting.fileNames?.summary ??
          "latest.txt"
      )
  );

  return {
    cwd,
    sourceFilePath,
    sourceKind,
    report,
    format,
    dryRun: commandContext.globalOptions.dryRun === true,
    outputFilePath: configuredOutputPath
  };
}

function writeRenderedOutput(outputFilePath, content) {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, content, "utf8");
}

function writeReportCommandOutput(logger, commandContext, payload, content) {
  if (commandContext.format === "json" || commandContext.format === "markdown") {
    logger.raw(content.trimEnd(), { ignoreQuiet: true });
    return;
  }

  logger.raw(content.trimEnd(), { ignoreQuiet: true });

  if (payload.outputFile) {
    logger.keyValue("Output file", payload.outputFile, { force: true });
  }
}

export async function executeReportCommand(commandContext, logger) {
  const runState = buildReportRun(commandContext);
  const renderedContent = renderUnifiedReport(runState.report, runState.format);

  if (!runState.dryRun) {
    writeRenderedOutput(runState.outputFilePath, renderedContent);
  }

  const payload = {
    command: "report",
    status: "rendered",
    sourceFile: toRelativePath(runState.cwd, runState.sourceFilePath),
    sourceKind: runState.sourceKind,
    format: runState.format,
    dryRun: runState.dryRun,
    outputFile: runState.dryRun ? null : toRelativePath(runState.cwd, runState.outputFilePath)
  };

  writeReportCommandOutput(logger, commandContext, payload, renderedContent);
  return 0;
}
