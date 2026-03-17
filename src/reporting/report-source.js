import fs from "node:fs";
import path from "node:path";
import { InputError } from "../cli/runtime/errors.js";
import { buildUnifiedReport } from "./report-model.js";
import { normalizeLocale, translateLocale } from "../utils/common.js";

function t(locale, zhCN, enUS) {
  return translateLocale(locale, zhCN, enUS);
}

function stripBackticks(value) {
  return value.replace(/^`|`$/g, "");
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

function extractMetadataLine(content, labels) {
  const labelList = Array.isArray(labels) ? labels : [labels];

  for (const label of labelList) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^(?:-\\s+)?${escapedLabel}:\\s+(.+)$`, "m");
    const match = content.match(pattern);

    if (match) {
      return stripBackticks(match[1].trim());
    }
  }

  return null;
}

function parseTargets(sectionBody) {
  return Array.from(sectionBody.matchAll(/`([^`]+)`/g), (match) => match[1]);
}

function parseFindings(sectionBody) {
  if (
    !sectionBody ||
    sectionBody === "1. No findings." ||
    sectionBody === "1. No remaining review findings." ||
    sectionBody === "1. 无发现。" ||
    sectionBody === "1. 无剩余评审发现。"
  ) {
    return [];
  }

  return sectionBody
    .split(/\n\n(?=\d+\.\s)/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const lines = entry.split("\n");
      const headerMatch = lines[0].match(/^\d+\.\s+\[([^\]]+)\]\s+(?:`([^`]+)`\s+)?(.+)$/);
      const targetLine = lines.find(
        (line) => line.startsWith("Target:") || line.startsWith("目标:") || line.startsWith("目标：")
      );
      const ruleLine = lines.find(
        (line) => line.startsWith("Rule:") || line.startsWith("规则:") || line.startsWith("规则：")
      );
      const suggestionLine = lines.find(
        (line) => line.startsWith("Suggestion:") || line.startsWith("建议:") || line.startsWith("建议：")
      );

      return {
        id: headerMatch?.[2] ?? `parsed-finding-${index + 1}`,
        severity: headerMatch?.[1] ?? "info",
        status: headerMatch?.[1] === "error" ? "fail" : headerMatch?.[1] === "warning" ? "warn" : "pass",
        message: headerMatch?.[3] ?? lines[0],
        target: targetLine
          ? stripBackticks(targetLine.replace(/^(Target|目标)[:：]\s+/, "").trim())
          : null,
        ruleId: ruleLine ? stripBackticks(ruleLine.replace(/^(Rule|规则)[:：]\s+/, "").trim()) : null,
        suggestion: suggestionLine ? suggestionLine.replace(/^(Suggestion|建议)[:：]\s+/, "").trim() : null
      };
    });
}

function parseSummary(content, findings) {
  const resultLine = content.match(
    /(?:Review result|Verification result|评审结果|复核结果):\s+`([^`]+)`/
  );
  const countsLine = content.match(/(?:Errors|错误):\s+`(\d+)`(?:,|，)\s*(?:Warnings|warnings|告警):\s+`(\d+)`/);

  return {
    status: resultLine?.[1] ?? null,
    exitCode: countsLine && Number(countsLine[1]) > 0 ? 1 : 0,
    errors: countsLine ? Number(countsLine[1]) : findings.filter((finding) => finding.severity === "error").length,
    warnings: countsLine ? Number(countsLine[2]) : findings.filter((finding) => finding.severity === "warning").length,
    passed: findings.filter((finding) => finding.status === "pass").length
  };
}

function parseMatchedRuleIds(sectionBody) {
  return Array.from(sectionBody.matchAll(/`([^`]+)`/g), (match) => match[1]);
}

function parseReviewMarkdownSource(sourcePath, sourceContent) {
  const locale = sourceContent.startsWith("# 评审 ") ? "zh-CN" : "en-US";
  const scopeBody = extractSectionBody(sourceContent, ["Scope", "评审范围", "复核范围"]);
  const targetsBody = extractSectionBody(sourceContent, ["Targets", "目标文件"]);
  const findingsBody = extractSectionBody(sourceContent, ["Review Findings", "评审发现"]);
  const standardsBody = extractSectionBody(sourceContent, ["Matched Standards", "命中规范"]);
  const commandMatch = scopeBody.match(/(?:Command|命令):\s+`([^`]+)`/);
  const command = commandMatch?.[1] ?? "review";
  const findings = parseFindings(findingsBody);
  const summary = parseSummary(sourceContent, findings);

  return buildUnifiedReport(
    {
      command,
      status: extractMetadataLine(sourceContent, ["Result", "结果"]) ?? summary.status,
      generatedAt: extractMetadataLine(sourceContent, ["Date", "时间"]),
      currentProject: extractMetadataLine(sourceContent, ["Project", "项目"]),
      currentSprint: extractMetadataLine(sourceContent, "Sprint"),
      summary,
      findings,
      standards: {
        matchedRuleIds: parseMatchedRuleIds(standardsBody)
      },
      reviewFile: command === "review" ? sourcePath : null,
      sourceFile:
        command === "review-verify"
          ? extractMetadataLine(scopeBody, ["Source review", "来源评审文件"])
          : null,
      outputFile: command === "review-verify" ? sourcePath : null,
      workflow: null,
      targets: parseTargets(targetsBody)
    },
    {
      generatedAt: extractMetadataLine(sourceContent, ["Date", "时间"]),
      locale
    }
  );
}

export function loadReportSource(sourcePath, options = {}) {
  const absoluteSourcePath = path.resolve(sourcePath);
  const locale = normalizeLocale(options.locale);

  if (!fs.existsSync(absoluteSourcePath)) {
    throw new InputError(
      t(locale, `未找到报告来源文件：${absoluteSourcePath}`, `Report source file not found: ${absoluteSourcePath}`),
      {
        code: "cli.report_source_missing",
        details: {
          source: absoluteSourcePath
        }
      }
    );
  }

  const extension = path.extname(absoluteSourcePath).toLowerCase();
  const sourceContent = fs.readFileSync(absoluteSourcePath, "utf8");

  if (extension === ".json") {
    const payload = JSON.parse(sourceContent);

    if (payload.kind === "governance-report") {
      return {
        sourceKind: "governance-report",
        report: payload
      };
    }

    return {
      sourceKind: "command-payload",
      report: buildUnifiedReport(payload)
    };
  }

  if (
    extension === ".md" &&
    (sourceContent.startsWith("# Review ") || sourceContent.startsWith("# 评审 "))
  ) {
    return {
      sourceKind: "review-record",
      report: parseReviewMarkdownSource(absoluteSourcePath, sourceContent)
    };
  }

  throw new InputError(
    t(locale, `不支持的报告来源格式：${absoluteSourcePath}`, `Unsupported report source format: ${absoluteSourcePath}`),
    {
      code: "cli.report_unsupported_source",
      details: {
        source: absoluteSourcePath,
        extension
      }
    }
  );
}
