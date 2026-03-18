import fs from "node:fs";
import path from "node:path";
import { InputError } from "../cli/runtime/errors.js";
import { loadResolvedConfig } from "../config/load-config.js";
import { ReportCommandStatusEnum } from "../constants/command-model.js";
import { REPORT_FORMATS, ReportFormatEnum } from "../constants/report.js";
import { renderUnifiedReport } from "../reporting/report-model.js";
import type { ReportFormat } from "../reporting/report-model.js";
import { loadReportSource } from "../reporting/report-source.js";
import type { GenericRecord } from "../types/aliases/index.js";
import type { CommandContext } from "../types/interfaces/cli-runtime.interface.js";
import type { Logger } from "../types/interfaces/cli-ui.interface.js";
import type { ReportPayload, ReportRun } from "../types/interfaces/command-report.interface.js";
import { normalizeLocale, toRelativePath, translateLocale } from "../utils/common.js";

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function asRecord(value: unknown): GenericRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as GenericRecord;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getStringOption(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function toReportFormat(value: string): ReportFormat {
  if (REPORT_FORMATS.includes(value as ReportFormat)) {
    return value as ReportFormat;
  }

  return ReportFormatEnum.Summary;
}

function buildReportRun(commandContext: CommandContext): ReportRun {
  const cwd = path.resolve(getStringOption(commandContext.globalOptions, "cwd") ?? process.cwd());
  const sourceOption = getStringOption(commandContext.commandOptions, "source");
  const requestedLocale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));

  if (!sourceOption) {
    throw new InputError(
      t(
        requestedLocale,
        "report 命令需要 --source 指向一个已存在的结果文件。",
        "Report command requires --source to point to an existing result file.",
      ),
      {
        code: "cli.report_missing_source",
        details: {
          cwd,
        },
      },
    );
  }

  const projectOption = getStringOption(commandContext.globalOptions, "project");
  const sprintOption = getStringOption(commandContext.globalOptions, "sprint");
  const localeOption = getStringOption(commandContext.globalOptions, "locale");
  const configPathOption = getStringOption(commandContext.globalOptions, "config");
  const commandLocaleOption = getStringOption(commandContext.commandOptions, "locale");
  const commandLanguageOption = getStringOption(commandContext.commandOptions, "language");
  const commandPresetOption = getStringOption(commandContext.commandOptions, "preset");
  const commandAdapterOption = getStringOption(commandContext.commandOptions, "adapter");

  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: configPathOption,
    cliOverrides: {
      project: projectOption,
      sprint: sprintOption,
      locale: commandLocaleOption ?? localeOption,
      language: commandLanguageOption,
      preset: commandPresetOption,
      adapter: commandAdapterOption,
    },
  });
  const configRecord = asRecord(resolvedConfig.config);
  const standardsRecord = asRecord(configRecord.standards);
  const localesRecord = asRecord(standardsRecord.locales);
  const reportingRecord = asRecord(configRecord.reporting);
  const fileNamesRecord = asRecord(reportingRecord.fileNames);
  const locale = normalizeLocale(localeOption ?? asString(localesRecord.default) ?? "zh-CN");
  const sourceFilePath = path.resolve(cwd, sourceOption);
  const { sourceKind, report } = loadReportSource(sourceFilePath, { locale });
  const format = toReportFormat(commandContext.format);
  const outputOption = getStringOption(commandContext.commandOptions, "out");
  const outputDirectory = asString(reportingRecord.outputDir) ?? ".repo-ai-governor/reports";
  const targetFileName =
    asString(fileNamesRecord[format]) ?? asString(fileNamesRecord.summary) ?? "latest.txt";
  const configuredOutputPath = path.resolve(
    cwd,
    outputOption ?? path.join(outputDirectory, targetFileName),
  );

  return {
    cwd,
    sourceFilePath,
    sourceKind,
    report,
    locale: normalizeLocale(report?.context?.locale ?? locale),
    format,
    dryRun: commandContext.globalOptions.dryRun === true,
    outputFilePath: configuredOutputPath,
  };
}

function writeRenderedOutput(outputFilePath: string, content: string): void {
  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, content, "utf8");
}

function writeReportCommandOutput(
  logger: Logger,
  commandContext: CommandContext,
  payload: ReportPayload,
  content: string,
): void {
  const locale = normalizeLocale(payload.locale);

  if (commandContext.format === "json" || commandContext.format === "markdown") {
    logger.raw(content.trimEnd(), { ignoreQuiet: true });
    return;
  }

  logger.raw(content.trimEnd(), { ignoreQuiet: true });

  if (payload.outputFile) {
    logger.keyValue(t(locale, "输出文件", "Output file"), payload.outputFile, { force: true });
  }
}

export async function executeReportCommand(
  commandContext: CommandContext,
  logger: Logger,
): Promise<number> {
  const runState = buildReportRun(commandContext);
  const renderedContent = renderUnifiedReport(runState.report, runState.format);

  if (!runState.dryRun) {
    writeRenderedOutput(runState.outputFilePath, renderedContent);
  }

  const payload: ReportPayload = {
    command: "report",
    status: ReportCommandStatusEnum.Rendered,
    locale: runState.locale,
    sourceFile: toRelativePath(runState.cwd, runState.sourceFilePath),
    sourceKind: runState.sourceKind,
    format: runState.format,
    dryRun: runState.dryRun,
    outputFile: runState.dryRun ? null : toRelativePath(runState.cwd, runState.outputFilePath),
  };

  writeReportCommandOutput(logger, commandContext, payload, renderedContent);
  return 0;
}
