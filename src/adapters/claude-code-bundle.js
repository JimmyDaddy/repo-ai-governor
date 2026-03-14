import { ADAPTER_PRESETS } from "./adapter-model.js";
import { buildBaseAdapterBundle, ensureTrailingNewline } from "./bundle-shared.js";

function renderWorkflowLines(bundle) {
  return bundle.workflow.selectedStages.map((stageId) => `- ${stageId}`);
}

function renderStandardsLines(bundle) {
  return bundle.standards.rules.map((rule) => `- ${rule.instruction}`);
}

function renderSlotLines(bundle) {
  if (bundle.slots.active.length === 0) {
    return ["- No active slots matched the current Claude Code context."];
  }

  return bundle.slots.active.map(
    (slot) => `- ${slot.id}: slotType=${slot.slotType}, promptKey=${slot.promptKey ?? "none"}`
  );
}

function renderEntryExcerpt(title, entryFile) {
  if (!entryFile.exists || !entryFile.excerpt) {
    return [`## ${title}`, "", "- Not found in the target repository."];
  }

  return [
    `## ${title}`,
    "",
    `- Path: \`${entryFile.path}\``,
    "",
    "```md",
    entryFile.excerpt.trimEnd(),
    "```"
  ];
}

function createClaudeSystemPrompt(bundle) {
  return ensureTrailingNewline(
    [
      "# Claude Code System Prompt",
      "",
      "You are operating as Claude Code inside a repository governed by Repo AI Governor.",
      "",
      "## Current Task Context",
      "",
      `- Project: \`${bundle.runtime.project}\``,
      `- Sprint: \`${bundle.runtime.sprint}\``,
      `- Command: \`${bundle.runtime.command}\``,
      `- Stage: \`${bundle.runtime.stageId}\``,
      "",
      "## Read First",
      "",
      `- Load \`${bundle.entry.agentEntry.path}\` as the repository entrypoint.`,
      `- Load \`${bundle.entry.currentContext.path}\` as the mutable execution context.`,
      "",
      "## Workflow Expectations",
      "",
      ...renderWorkflowLines(bundle),
      "",
      "## Governance Standards",
      "",
      ...renderStandardsLines(bundle),
      "",
      "## Active Slots",
      "",
      ...renderSlotLines(bundle),
      "",
      "## Artifact Sync Rules",
      "",
      `- Plan: \`${bundle.artifacts.planFile}\``,
      `- Checklist: \`${bundle.artifacts.checklistFile}\``,
      `- Tasks CSV: \`${bundle.artifacts.taskCsvFile}\``,
      `- Code Review Dir: \`${bundle.artifacts.codeReviewRoot}\``,
      "",
      "## Execution Guardrails",
      "",
      "- Keep workflow order unless a human explicitly changes it.",
      "- Update checklist and tasks.csv for each execution record.",
      "- Use status-prefixed code review filenames and append verify results into the same review file.",
      "- Prefer direct file edits and verifiable command outputs over speculative summaries."
    ].join("\n")
  );
}

function createClaudeTaskPrompt(bundle) {
  return ensureTrailingNewline(
    [
      "# Claude Code Task Prompt",
      "",
      `Current project: \`${bundle.runtime.project}\``,
      `Current sprint: \`${bundle.runtime.sprint}\``,
      `Command: \`${bundle.runtime.command}\``,
      `Stage: \`${bundle.runtime.stageId}\``,
      `Language: \`${bundle.runtime.language}\``,
      `Framework: \`${bundle.runtime.framework}\``,
      "",
      "Use the governance files and active slots above to complete the current task while keeping sprint artifacts synchronized.",
      "",
      "Primary output targets:",
      `- ${bundle.artifacts.planFile}`,
      `- ${bundle.artifacts.checklistFile}`,
      `- ${bundle.artifacts.taskCsvFile}`,
      `- ${bundle.artifacts.codeReviewRoot}`
    ].join("\n")
  );
}

function createMarkdownBundle(bundle) {
  return ensureTrailingNewline(
    [
      "# Claude Code Governance Bundle",
      "",
      `- Adapter: \`${bundle.adapter.id}\``,
      `- Products: \`${bundle.adapter.products.join(", ")}\``,
      `- Project: \`${bundle.runtime.project}\``,
      `- Sprint: \`${bundle.runtime.sprint}\``,
      `- Command: \`${bundle.runtime.command}\``,
      `- Stage: \`${bundle.runtime.stageId}\``,
      "",
      "## Workflow",
      "",
      ...renderWorkflowLines(bundle),
      "",
      "## Standards",
      "",
      ...renderStandardsLines(bundle),
      "",
      "## Active Slots",
      "",
      ...renderSlotLines(bundle),
      "",
      ...renderEntryExcerpt("AGENTS Entry Excerpt", bundle.entry.agentEntry),
      "",
      ...renderEntryExcerpt("Current Context Excerpt", bundle.entry.currentContext),
      "",
      "## Generated Files",
      "",
      `- System Prompt Output: \`${bundle.files.systemPrompt.path}\``,
      `- Task Prompt Output: \`${bundle.files.taskPrompt.path}\``,
      "",
      "## Claude System Prompt",
      "",
      "```md",
      bundle.files.systemPrompt.content.trimEnd(),
      "```",
      "",
      "## Claude Task Prompt",
      "",
      "```md",
      bundle.files.taskPrompt.content.trimEnd(),
      "```"
    ].join("\n")
  );
}

export function buildClaudeCodeAdapterBundle(options = {}) {
  const { bundle } = buildBaseAdapterBundle({
    ...options,
    adapterPreset: ADAPTER_PRESETS["claude-code"],
    includeEntryFiles: true
  });

  const enrichedBundle = {
    ...bundle,
    files: {
      systemPrompt: {
        path: ".repo-ai-governor/templates/claude-code-system.prompt.md",
        content: createClaudeSystemPrompt(bundle)
      },
      taskPrompt: {
        path: ".repo-ai-governor/templates/claude-code-task.prompt.md",
        content: createClaudeTaskPrompt(bundle)
      }
    }
  };

  return {
    ...enrichedBundle,
    prompt: createMarkdownBundle(enrichedBundle)
  };
}

export function renderClaudeCodeAdapterBundle(bundle, format = "markdown") {
  if (format === "json") {
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }

  if (format === "system-prompt") {
    return bundle.files.systemPrompt.content;
  }

  if (format === "task-prompt") {
    return bundle.files.taskPrompt.content;
  }

  return bundle.prompt;
}
