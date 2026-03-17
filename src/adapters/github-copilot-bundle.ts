import { ADAPTER_PRESETS } from "./adapter-model.js";
import {
  type AdapterBaseBundle,
  type BuildBaseAdapterBundleOptions,
  buildBaseAdapterBundle,
  ensureTrailingNewline,
} from "./bundle-shared.js";

type BuildGitHubCopilotAdapterBundleOptions = Omit<
  BuildBaseAdapterBundleOptions,
  "adapterPreset" | "includeRepositoryReferences"
>;

export type GitHubCopilotAdapterBundle = AdapterBaseBundle & {
  files: {
    ideInstructions: {
      path: string;
      content: string;
    };
    cliPrompt: {
      path: string;
      content: string;
    };
  };
  prompt: string;
};

function renderWorkflowLines(bundle: AdapterBaseBundle): string[] {
  return bundle.workflow.selectedStages.map((stageId) => `- ${stageId}`);
}

function renderStandardsLines(bundle: AdapterBaseBundle): string[] {
  return bundle.standards.rules.map((rule) => `- ${rule.instruction ?? ""}`);
}

function renderSlotLines(bundle: AdapterBaseBundle): string[] {
  if (bundle.slots.active.length === 0) {
    return ["- No active slots matched the current GitHub Copilot context."];
  }

  return bundle.slots.active.map(
    (slot) => `- ${slot.id}: slotType=${slot.slotType}, promptKey=${slot.promptKey ?? "none"}`,
  );
}

function createCopilotInstructions(bundle: AdapterBaseBundle): string {
  return ensureTrailingNewline(
    [
      "# GitHub Copilot Instructions",
      "",
      "## Read First",
      "",
      `- Read \`${bundle.references?.agentEntryPath ?? "AGENTS.md"}\` before acting.`,
      `- Read \`${bundle.references?.currentContextPath ?? ".repo-ai-governor/context/current-context.md"}\` before updating sprint artifacts.`,
      "",
      "## Current Task Context",
      "",
      `- Project: \`${bundle.runtime.project}\``,
      `- Sprint: \`${bundle.runtime.sprint}\``,
      `- Command: \`${bundle.runtime.command}\``,
      `- Stage: \`${bundle.runtime.stageId}\``,
      "",
      "## Workflow Expectations",
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
      "## Artifact Paths",
      "",
      `- Sprint root: \`${bundle.artifacts.sprintRoot}\``,
      `- Plan: \`${bundle.artifacts.planFile}\``,
      `- Checklist: \`${bundle.artifacts.checklistFile}\``,
      `- Tasks CSV: \`${bundle.artifacts.taskCsvFile}\``,
      `- Code Review Dir: \`${bundle.artifacts.codeReviewRoot}\``,
      "",
      "## Output Rules",
      "",
      "- Keep checklist and tasks.csv in sync after each execution record.",
      "- Write code review files with status-prefixed names.",
      "- Preserve workflow order unless a human explicitly redirects the task.",
    ].join("\n"),
  );
}

function createCopilotCliPrompt(bundle: AdapterBaseBundle): string {
  return ensureTrailingNewline(
    [
      "# GitHub Copilot CLI Prompt",
      "",
      `You are operating on project \`${bundle.runtime.project}\` in sprint \`${bundle.runtime.sprint}\`.`,
      `Current command is \`${bundle.runtime.command}\` and current stage is \`${bundle.runtime.stageId}\`.`,
      "",
      "Follow this workflow order:",
      ...renderWorkflowLines(bundle),
      "",
      "Apply these governance rules:",
      ...renderStandardsLines(bundle),
      "",
      "Match these active slots when relevant:",
      ...renderSlotLines(bundle),
      "",
      "Keep these artifact paths synchronized:",
      `- ${bundle.artifacts.planFile}`,
      `- ${bundle.artifacts.checklistFile}`,
      `- ${bundle.artifacts.taskCsvFile}`,
      `- ${bundle.artifacts.codeReviewRoot}`,
      "",
      "Before editing, read these repository entry files:",
      `- ${bundle.references?.agentEntryPath ?? "AGENTS.md"}`,
      `- ${bundle.references?.currentContextPath ?? ".repo-ai-governor/context/current-context.md"}`,
    ].join("\n"),
  );
}

function createMarkdownBundle(bundle: GitHubCopilotAdapterBundle): string {
  return ensureTrailingNewline(
    [
      "# GitHub Copilot Governance Bundle",
      "",
      `- Adapter: \`${bundle.adapter.id}\``,
      `- Products: \`${bundle.adapter.products.join(", ")}\``,
      `- Project: \`${bundle.runtime.project}\``,
      `- Sprint: \`${bundle.runtime.sprint}\``,
      `- Command: \`${bundle.runtime.command}\``,
      `- Stage: \`${bundle.runtime.stageId}\``,
      "",
      "## Recommended Files",
      "",
      `- AGENTS: \`${bundle.references?.agentEntryPath ?? "AGENTS.md"}\``,
      `- Current Context: \`${bundle.references?.currentContextPath ?? ".repo-ai-governor/context/current-context.md"}\``,
      `- IDE Instructions Output: \`${bundle.files.ideInstructions.path}\``,
      `- CLI Prompt Output: \`${bundle.files.cliPrompt.path}\``,
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
      "## IDE Instructions File",
      "",
      "```md",
      bundle.files.ideInstructions.content.trimEnd(),
      "```",
      "",
      "## Copilot CLI Prompt File",
      "",
      "```md",
      bundle.files.cliPrompt.content.trimEnd(),
      "```",
    ].join("\n"),
  );
}

export function buildGitHubCopilotAdapterBundle(
  options: BuildGitHubCopilotAdapterBundleOptions = {},
): GitHubCopilotAdapterBundle {
  const { bundle } = buildBaseAdapterBundle({
    ...options,
    adapterPreset: ADAPTER_PRESETS["github-copilot"],
    includeRepositoryReferences: true,
  });

  const enrichedBundle: GitHubCopilotAdapterBundle = {
    ...bundle,
    files: {
      ideInstructions: {
        path: ".github/copilot-instructions.md",
        content: createCopilotInstructions(bundle),
      },
      cliPrompt: {
        path: ".repo-ai-governor/templates/github-copilot-cli.prompt.md",
        content: createCopilotCliPrompt(bundle),
      },
    },
    prompt: "",
  };

  enrichedBundle.prompt = createMarkdownBundle(enrichedBundle);
  return enrichedBundle;
}

export function renderGitHubCopilotAdapterBundle(
  bundle: GitHubCopilotAdapterBundle,
  format: "markdown" | "json" | "copilot-instructions" | "copilot-cli-prompt" = "markdown",
): string {
  if (format === "json") {
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }

  if (format === "copilot-instructions") {
    return bundle.files.ideInstructions.content;
  }

  if (format === "copilot-cli-prompt") {
    return bundle.files.cliPrompt.content;
  }

  return bundle.prompt;
}
