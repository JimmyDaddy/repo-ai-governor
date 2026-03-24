#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "./gate-output.js";

const GATE_NAME = "worktree-review-target";
const CURRENT_CONTEXT_PATH = ".repo-ai-governor/context/current-context.md";
const COMPLETED_STREAM_HISTORY_PATH = ".repo-ai-governor/context/completed-streams-history.md";
const OPEN_REVIEW_FILE_PREFIXES = [
  "code_review_",
  "review_",
  "verified_code_review_",
  "verified_review_",
];

/**
 * Extracts all markdown sections that match one semantic heading label.
 * @param {string} content Full markdown content.
 * @param {string} headingText Target heading text.
 * @returns {string[]}
 */
function extractMarkdownSections(content, headingText) {
  const normalizedHeadingText = normalizeSectionHeading(headingText);
  const headingPattern = /^##\s+([^\n]+)$/gmu;
  const headingMatches = Array.from(content.matchAll(headingPattern));
  const sections = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const headingMatch = headingMatches[index];
    const rawHeadingText = headingMatch[1]?.trim() ?? "";
    const headingIndex = headingMatch.index;
    if (typeof headingIndex !== "number") {
      continue;
    }

    if (normalizeSectionHeading(rawHeadingText) !== normalizedHeadingText) {
      continue;
    }

    const sectionStart = headingIndex + headingMatch[0].length;
    const sectionEnd = headingMatches[index + 1]?.index ?? content.length;
    sections.push(content.slice(sectionStart, sectionEnd).trim());
  }

  return sections;
}

/**
 * Normalizes one markdown heading so numbering drift does not affect parsing.
 * @param {string} headingText Raw heading text.
 * @returns {string}
 */
function normalizeSectionHeading(headingText) {
  return headingText
    .replace(/^\d+(?:\.\d+)*\.?\s*/u, "")
    .trim()
    .toLowerCase();
}

/**
 * Reads one top-level metadata field from a markdown section.
 * @param {string} sectionContent Section body content.
 * @param {string} label Field label.
 * @returns {string | null}
 */
function readSectionMetadataField(sectionContent, label) {
  const labelPattern = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const fieldMatch = sectionContent.match(new RegExp(`^- ${labelPattern}:\\s*(.+)$`, "mu"));
  if (!fieldMatch) {
    return null;
  }

  const rawValue = fieldMatch[1]?.trim() ?? "";
  const backtickMatch = rawValue.match(/^`([^`]+)`$/u);
  return backtickMatch ? backtickMatch[1].trim() : rawValue;
}

/**
 * Normalizes one filesystem-like path for string comparisons.
 * @param {string} targetPath Path value from docs.
 * @returns {string}
 */
function normalizeComparablePath(targetPath) {
  return targetPath.replace(/[\\/]+$/u, "").replace(/\\/gu, "/");
}

/**
 * Resolves whether one completed stream history line matches the target stream.
 * @param {string} line One history line.
 * @param {{project: string, sprint: string, reviewRecords: string}} target Target override metadata.
 * @returns {boolean}
 */
function matchesCompletedStreamHistoryLine(line, target) {
  return (
    line.includes(`project=\`${target.project}\``) &&
    line.includes(`sprint=\`${target.sprint}\``) &&
    normalizeComparablePath(
      readDescriptorField(line, "review") ?? readDescriptorField(line, "reviewRecords") ?? "",
    ) === normalizeComparablePath(target.reviewRecords) &&
    line.includes("status=`completed`")
  );
}

/**
 * Extracts one backtick-delimited descriptor field from a history line.
 * @param {string} line One descriptor line.
 * @param {string} fieldName Field name to extract.
 * @returns {string | null}
 */
function readDescriptorField(line, fieldName) {
  const fieldPattern = new RegExp(`${fieldName}=\\\`([^\\\`]+)\\\``);
  const fieldMatch = line.match(fieldPattern);
  return fieldMatch ? fieldMatch[1] : null;
}

try {
  const currentContextPath = resolve(process.cwd(), CURRENT_CONTEXT_PATH);
  if (!existsSync(currentContextPath)) {
    throw new Error(`Current context file not found: ${currentContextPath}`);
  }

  const currentContextContent = readFileSync(currentContextPath, "utf8");
  const worktreeReviewTargetSections = extractMarkdownSections(
    currentContextContent,
    "Worktree Review Target",
  );

  if (worktreeReviewTargetSections.length > 1) {
    throw new Error(
      "`current-context.md` contains more than one `## Worktree Review Target` section.",
    );
  }

  const worktreeReviewTargetSection = worktreeReviewTargetSections[0] ?? "";
  const target = {
    project: readSectionMetadataField(worktreeReviewTargetSection, "Project"),
    sprint: readSectionMetadataField(worktreeReviewTargetSection, "Sprint"),
    reviewRecords: readSectionMetadataField(worktreeReviewTargetSection, "Review records"),
    streamState: readSectionMetadataField(worktreeReviewTargetSection, "Stream State"),
    reason: readSectionMetadataField(worktreeReviewTargetSection, "Reason"),
    clearWhen: readSectionMetadataField(worktreeReviewTargetSection, "Clear when"),
  };
  const hasActiveOverride = Object.values(target).some(
    (fieldValue) => typeof fieldValue === "string" && fieldValue.trim().length > 0,
  );

  if (!hasActiveOverride) {
    gateInfo(GATE_NAME, "No active Worktree Review Target override declared.");
    gatePass(GATE_NAME, "Default CR routing remains on the active primary stream.");
    process.exit(0);
  }

  const missingFields = [
    ["Project", target.project],
    ["Sprint", target.sprint],
    ["Review records", target.reviewRecords],
    ["Stream State", target.streamState],
    ["Reason", target.reason],
    ["Clear when", target.clearWhen],
  ]
    .filter(([, fieldValue]) => typeof fieldValue !== "string" || fieldValue.trim().length === 0)
    .map(([label]) => label);

  if (missingFields.length > 0) {
    throw new Error(
      `Worktree Review Target override is missing required field(s): ${missingFields.join(", ")}.`,
    );
  }

  if ((target.streamState ?? "").trim().toLowerCase() !== "completed") {
    throw new Error(
      `Worktree Review Target must reference a completed stream, found \`${target.streamState}\`.`,
    );
  }

  const primaryReviewRecords = readSectionMetadataField(currentContextContent, "Review records");
  if (
    primaryReviewRecords &&
    normalizeComparablePath(primaryReviewRecords) === normalizeComparablePath(target.reviewRecords)
  ) {
    throw new Error(
      "Worktree Review Target is redundant because it points to the active primary stream review directory.",
    );
  }

  const expectedReviewRecords = `.repo-ai-governor/context/dev/${target.project}/${target.sprint}/review`;
  if (
    normalizeComparablePath(target.reviewRecords) !== normalizeComparablePath(expectedReviewRecords)
  ) {
    throw new Error(
      `Worktree Review Target review directory must match \`${expectedReviewRecords}/\`, found \`${target.reviewRecords}\`.`,
    );
  }

  const reviewDirectoryPath = resolve(process.cwd(), target.reviewRecords);
  if (!existsSync(reviewDirectoryPath)) {
    throw new Error(`Worktree Review Target review directory not found: ${reviewDirectoryPath}`);
  }

  const completedHistoryPath = resolve(process.cwd(), COMPLETED_STREAM_HISTORY_PATH);
  if (!existsSync(completedHistoryPath)) {
    throw new Error(`Completed stream history file not found: ${completedHistoryPath}`);
  }

  const completedHistoryContent = readFileSync(completedHistoryPath, "utf8");
  const completedStreamLines = completedHistoryContent
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- `"));

  if (!completedStreamLines.some((line) => matchesCompletedStreamHistoryLine(line, target))) {
    throw new Error(
      `Worktree Review Target does not match any completed stream history entry for ${target.project}/${target.sprint}.`,
    );
  }

  const openLifecycleArtifacts = readdirSync(reviewDirectoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .filter((fileName) => OPEN_REVIEW_FILE_PREFIXES.some((prefix) => fileName.startsWith(prefix)));

  gateInfo(
    GATE_NAME,
    `Worktree Review Target resolved to ${target.project}/${target.sprint} with ${openLifecycleArtifacts.length} open lifecycle artifact(s).`,
  );

  if (openLifecycleArtifacts.length === 0) {
    throw new Error(
      "Worktree Review Target is stale: target review directory no longer contains `code_review_*` or `verified_code_review_*` lifecycle artifacts.",
    );
  }

  gatePass(
    GATE_NAME,
    "Worktree Review Target override points to a completed stream with open review lifecycle artifacts.",
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
