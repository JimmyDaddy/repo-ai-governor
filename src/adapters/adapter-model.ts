import { validateSchemaDocument } from "../config/schema/validator.js";
import {
  ADAPTER_INPUT_SOURCES,
  ADAPTER_OUTPUT_ARTIFACTS,
  MAINSTREAM_ADAPTER_IDS,
} from "../constants/adapter-model.js";
import type {
  AdapterInputSource,
  AdapterOutputArtifact,
  AdapterPresetMap,
  MainstreamAdapterId,
} from "../types/aliases/adapter.type.js";
import type { AdapterDefinition, LocalizedText } from "../types/interfaces/adapter.interface.js";

export { ADAPTER_INPUT_SOURCES, ADAPTER_OUTPUT_ARTIFACTS, MAINSTREAM_ADAPTER_IDS };
export type { AdapterDefinition, LocalizedText };
export type { AdapterInputSource, AdapterOutputArtifact, AdapterPresetMap, MainstreamAdapterId };

function createLocalizedText(zhCN: string, enUS: string): LocalizedText {
  return {
    "zh-CN": zhCN,
    "en-US": enUS,
  };
}

export function validateAdapterDefinition(adapterDefinition: unknown): AdapterDefinition {
  return validateSchemaDocument("adapter", adapterDefinition) as AdapterDefinition;
}

function createAdapterPreset(definition: AdapterDefinition): Readonly<AdapterDefinition> {
  return Object.freeze(validateAdapterDefinition(definition));
}

export const ADAPTER_PRESETS: AdapterPresetMap = Object.freeze({
  codex: createAdapterPreset({
    id: "codex",
    version: "1",
    type: "ide-or-cli",
    meta: {
      name: createLocalizedText("Codex", "Codex"),
      provider: "openai",
    },
    targets: {
      products: ["codex", "codex-cli"],
      entrypoints: ["ide", "cli", "agent"],
      protocols: ["file", "template", "prompt", "command", "agent-entry"],
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: true,
      approvalControl: true,
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "agent-entry", "artifacts", "runtime-context"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "yaml", "text"],
      },
      output: {
        artifactKinds: [
          "plan",
          "check-report",
          "review-report",
          "task-record",
          "summary",
          "agent-entry",
        ],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true,
      },
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots", "agent-entry", "artifacts"],
      promptSections: ["workflow", "standards", "slots", "agent-entry"],
      templateVariables: ["project", "sprint", "locale", "adapter"],
    },
  }),
  "github-copilot": createAdapterPreset({
    id: "github-copilot",
    version: "1",
    type: "ide-or-cli",
    meta: {
      name: createLocalizedText("GitHub Copilot", "GitHub Copilot"),
      provider: "github",
    },
    targets: {
      products: ["github-copilot", "github-copilot-cli"],
      entrypoints: ["ide", "cli"],
      protocols: ["file", "template", "prompt", "command"],
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: false,
      approvalControl: false,
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "artifacts"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "text"],
      },
      output: {
        artifactKinds: ["plan", "check-report", "review-report", "task-record"],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true,
      },
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots", "artifacts"],
      promptSections: ["workflow", "standards", "slots"],
      templateVariables: ["project", "sprint", "locale"],
    },
  }),
  "claude-code": createAdapterPreset({
    id: "claude-code",
    version: "1",
    type: "agent",
    meta: {
      name: createLocalizedText("Claude Code", "Claude Code"),
      provider: "anthropic",
    },
    targets: {
      products: ["claude-code"],
      entrypoints: ["agent", "cli"],
      protocols: ["file", "template", "prompt", "command", "agent-entry"],
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: true,
      approvalControl: true,
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "agent-entry", "artifacts", "runtime-context"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "text"],
      },
      output: {
        artifactKinds: ["plan", "check-report", "review-report", "task-record", "summary"],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true,
      },
    },
    injection: {
      mode: "direct-prompt",
      sources: ["standards", "workflow", "slots", "agent-entry"],
      promptSections: ["workflow", "standards", "slots", "agent-entry"],
      templateVariables: ["project", "sprint", "locale", "adapter"],
    },
  }),
});

export function listAdapterTargets(adapterDefinition: unknown): {
  products: string[];
  entrypoints: AdapterDefinition["targets"]["entrypoints"];
  protocols: AdapterDefinition["targets"]["protocols"];
} {
  const adapter = validateAdapterDefinition(adapterDefinition);

  return {
    products: adapter.targets.products,
    entrypoints: adapter.targets.entrypoints,
    protocols: adapter.targets.protocols,
  };
}

export function getAdapterInputSources(adapterDefinition: unknown): AdapterInputSource[] {
  return validateAdapterDefinition(adapterDefinition).contract.input.sources;
}

export function supportsAdapterCapability(
  adapterDefinition: unknown,
  capabilityName: string,
): boolean {
  const adapter = validateAdapterDefinition(adapterDefinition);
  return Boolean(adapter.capabilities[capabilityName]);
}
