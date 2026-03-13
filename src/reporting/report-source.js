import fs from "node:fs";
import path from "node:path";
import { InputError } from "../cli/runtime/errors.js";
import { buildUnifiedReport } from "./report-model.js";

function stripBackticks(value) {
  return value.replace(/^`|`$/g, "");
}

function extractSectionBody(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`## ${escapedHeading}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = content.match(pattern);
  return match ? match[1].trim() : "";
}

function extractMetadataLine(content, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^(?:-\\s+)?${escapedLabel}:\\s+(.+)$`, "m");
  const match = content.match(pattern);
  return match ? stripBackticks(match[1].trim()) : null;
}

function parseTargets(sectionBody) {
  return Array.from(sectionBody.matchAll(/`([^`]+)`/g), (match) => match[1]);
}

function parseFindings(sectionBody) {
  if (!sectionBody || sectionBody === "1. No findings." || sectionBody === "1. No remaining review findings.") {
    return [];
  }

  return sectionBody
    .split(/\n\n(?=\d+\.\s)/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const lines = entry.split("\n");
      const headerMatch = lines[0].match(/^\d+\.\s+\[([^\]]+)\]\s+(?:`([^`]+)`\s+)?(.+)$/);
      const targetLine = lines.find((line) => line.startsWith("Target:"));
      const ruleLine = lines.find((line) => line.startsWith("Rule:"));
      const suggestionLine = lines.find((line) => line.startsWith("Suggestion:"));

      return {
        id: headerMatch?.[2] ?? `parsed-finding-${index + 1}`,
        severity: headerMatch?.[1] ?? "info",
        status: headerMatch?.[1] === "error" ? "fail" : headerMatch?.[1] === "warning" ? "warn" : "pass",
        message: headerMatch?.[3] ?? lines[0],
        target: targetLine ? stripBackticks(targetLine.replace(/^Target:\s+/, "").trim()) : null,
        ruleId: ruleLine ? stripBackticks(ruleLine.replace(/^Rule:\s+/, "").trim()) : null,
        suggestion: suggestionLine ? suggestionLine.replace(/^Suggestion:\s+/, "").trim() : null
      };
    });
}

function parseSummary(content, findings) {
  const resultLine = content.match(/Review result:\s+`([^`]+)`|Verification result:\s+`([^`]+)`/);
  const countsLine = content.match(/Errors:\s+`(\d+)`, warnings:\s+`(\d+)`/);

  return {
    status: resultLine?.[1] ?? resultLine?.[2] ?? null,
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
  const scopeBody = extractSectionBody(sourceContent, "Scope");
  const targetsBody = extractSectionBody(sourceContent, "Targets");
  const findingsBody = extractSectionBody(sourceContent, "Review Findings");
  const standardsBody = extractSectionBody(sourceContent, "Matched Standards");
  const commandMatch = scopeBody.match(/Command:\s+`([^`]+)`/);
  const command = commandMatch?.[1] ?? "review";
  const findings = parseFindings(findingsBody);
  const summary = parseSummary(sourceContent, findings);

  return buildUnifiedReport(
    {
      command,
      status: extractMetadataLine(sourceContent, "Result") ?? summary.status,
      generatedAt: extractMetadataLine(sourceContent, "Date"),
      currentProject: extractMetadataLine(sourceContent, "Project"),
      currentSprint: extractMetadataLine(sourceContent, "Sprint"),
      summary,
      findings,
      standards: {
        matchedRuleIds: parseMatchedRuleIds(standardsBody)
      },
      reviewFile: command === "review" ? sourcePath : null,
      sourceFile: command === "review-verify" ? extractMetadataLine(scopeBody, "Source review") : null,
      outputFile: command === "review-verify" ? sourcePath : null,
      workflow: null,
      targets: parseTargets(targetsBody)
    },
    {
      generatedAt: extractMetadataLine(sourceContent, "Date")
    }
  );
}

export function loadReportSource(sourcePath) {
  const absoluteSourcePath = path.resolve(sourcePath);

  if (!fs.existsSync(absoluteSourcePath)) {
    throw new InputError(`Report source file not found: ${absoluteSourcePath}`, {
      code: "cli.report_source_missing",
      details: {
        source: absoluteSourcePath
      }
    });
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

  if (extension === ".md" && sourceContent.startsWith("# Review ")) {
    return {
      sourceKind: "review-record",
      report: parseReviewMarkdownSource(absoluteSourcePath, sourceContent)
    };
  }

  throw new InputError(`Unsupported report source format: ${absoluteSourcePath}`, {
    code: "cli.report_unsupported_source",
    details: {
      source: absoluteSourcePath,
      extension
    }
  });
}
