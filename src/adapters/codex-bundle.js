import { ADAPTER_PRESETS } from "./adapter-model.js";
import { buildBaseAdapterBundle, ensureTrailingNewline } from "./bundle-shared.js";

function createCodexPrompt(bundle) {
  const standardsLines = bundle.standards.rules.map((rule) => `- ${rule.instruction}`);
  const slotLines =
    bundle.slots.active.length > 0
      ? bundle.slots.active.map((slot) => `- ${slot.id}: promptKey=${slot.promptKey ?? "none"}`)
      : ["- No active slots matched the current Codex bundle context."];
  const workflowLines = bundle.workflow.selectedStages.map((stageId) => `- ${stageId}`);

  return ensureTrailingNewline(
    [
      "# Codex Governance Bundle",
      "",
      `- Adapter: \`${bundle.adapter.id}\``,
      `- Products: \`${bundle.adapter.products.join(", ")}\``,
      `- Project: \`${bundle.runtime.project}\``,
      `- Sprint: \`${bundle.runtime.sprint}\``,
      `- Command: \`${bundle.runtime.command}\``,
      `- Stage: \`${bundle.runtime.stageId}\``,
      "",
      "## Entry Files",
      "",
      `- AGENTS: \`${bundle.entry.agentEntry.path}\``,
      `- Current Context: \`${bundle.entry.currentContext.path}\``,
      "",
      "## Workflow",
      "",
      ...workflowLines,
      "",
      "## Standards",
      "",
      ...standardsLines,
      "",
      "## Active Slots",
      "",
      ...slotLines,
      "",
      "## Runtime Context",
      "",
      `- Language: \`${bundle.runtime.language}\``,
      `- Framework: \`${bundle.runtime.framework}\``,
      `- Docs root: \`${bundle.artifacts.sprintRoot}\``,
      "",
      "## Expected Outputs",
      "",
      `- Plan: \`${bundle.artifacts.planFile}\``,
      `- Checklist: \`${bundle.artifacts.checklistFile}\``,
      `- Tasks CSV: \`${bundle.artifacts.taskCsvFile}\``,
      `- Code Review Dir: \`${bundle.artifacts.codeReviewRoot}\``
    ].join("\n")
  );
}

export function buildCodexAdapterBundle(options = {}) {
  const { bundle } = buildBaseAdapterBundle({
    ...options,
    adapterPreset: ADAPTER_PRESETS.codex,
    includeEntryFiles: true
  });

  return {
    ...bundle,
    prompt: createCodexPrompt(bundle)
  };
}

export function renderCodexAdapterBundle(bundle, format = "markdown") {
  if (format === "json") {
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }

  return ensureTrailingNewline(bundle.prompt);
}
