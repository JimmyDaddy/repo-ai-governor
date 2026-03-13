import { validateSchemaDocument } from "../config/schema/validator.js";

export const ADAPTER_INPUT_SOURCES = Object.freeze([
  "workflow",
  "standards",
  "slots",
  "agent-entry",
  "artifacts",
  "runtime-context"
]);

export const ADAPTER_OUTPUT_ARTIFACTS = Object.freeze([
  "plan",
  "check-report",
  "review-report",
  "task-record",
  "summary",
  "agent-entry"
]);

export const MAINSTREAM_ADAPTER_IDS = Object.freeze(["codex", "github-copilot", "claude-code"]);

function createLocalizedText(zhCN, enUS) {
  return {
    "zh-CN": zhCN,
    "en-US": enUS
  };
}

export function validateAdapterDefinition(adapterDefinition) {
  return validateSchemaDocument("adapter", adapterDefinition);
}

function createAdapterPreset(definition) {
  return Object.freeze(validateAdapterDefinition(definition));
}

export const ADAPTER_PRESETS = Object.freeze({
  codex: createAdapterPreset({
    id: "codex",
    version: "1",
    type: "ide-or-cli",
    meta: {
      name: createLocalizedText("Codex", "Codex"),
      provider: "openai"
    },
    targets: {
      products: ["codex", "codex-cli"],
      entrypoints: ["ide", "cli", "agent"],
      protocols: ["file", "template", "prompt", "command", "agent-entry"]
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: true,
      approvalControl: true
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "agent-entry", "artifacts", "runtime-context"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "yaml", "text"]
      },
      output: {
        artifactKinds: ["plan", "check-report", "review-report", "task-record", "summary", "agent-entry"],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true
      }
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots", "agent-entry", "artifacts"],
      promptSections: ["workflow", "standards", "slots", "agent-entry"],
      templateVariables: ["project", "sprint", "locale", "adapter"]
    }
  }),
  "github-copilot": createAdapterPreset({
    id: "github-copilot",
    version: "1",
    type: "ide-or-cli",
    meta: {
      name: createLocalizedText("GitHub Copilot", "GitHub Copilot"),
      provider: "github"
    },
    targets: {
      products: ["github-copilot", "github-copilot-cli"],
      entrypoints: ["ide", "cli"],
      protocols: ["file", "template", "prompt", "command"]
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: false,
      approvalControl: false
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "artifacts"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "text"]
      },
      output: {
        artifactKinds: ["plan", "check-report", "review-report", "task-record"],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true
      }
    },
    injection: {
      mode: "file-and-template",
      sources: ["standards", "workflow", "slots", "artifacts"],
      promptSections: ["workflow", "standards", "slots"],
      templateVariables: ["project", "sprint", "locale"]
    }
  }),
  "claude-code": createAdapterPreset({
    id: "claude-code",
    version: "1",
    type: "agent",
    meta: {
      name: createLocalizedText("Claude Code", "Claude Code"),
      provider: "anthropic"
    },
    targets: {
      products: ["claude-code"],
      entrypoints: ["agent", "cli"],
      protocols: ["file", "template", "prompt", "command", "agent-entry"]
    },
    capabilities: {
      promptInjection: true,
      structuredOutput: true,
      toolCalling: true,
      fileSystemAccess: true,
      terminalAccess: true,
      patchEditing: true,
      approvalControl: true
    },
    contract: {
      input: {
        sources: ["workflow", "standards", "slots", "agent-entry", "artifacts", "runtime-context"],
        requiredViews: ["ai"],
        supportedFormats: ["markdown", "json", "text"]
      },
      output: {
        artifactKinds: ["plan", "check-report", "review-report", "task-record", "summary"],
        supportedFormats: ["markdown", "json", "text"],
        supportsReviewLifecycle: true
      }
    },
    injection: {
      mode: "direct-prompt",
      sources: ["standards", "workflow", "slots", "agent-entry"],
      promptSections: ["workflow", "standards", "slots", "agent-entry"],
      templateVariables: ["project", "sprint", "locale", "adapter"]
    }
  })
});

export function listAdapterTargets(adapterDefinition) {
  const adapter = validateAdapterDefinition(adapterDefinition);

  return {
    products: adapter.targets.products,
    entrypoints: adapter.targets.entrypoints,
    protocols: adapter.targets.protocols
  };
}

export function getAdapterInputSources(adapterDefinition) {
  return validateAdapterDefinition(adapterDefinition).contract.input.sources;
}

export function supportsAdapterCapability(adapterDefinition, capabilityName) {
  const adapter = validateAdapterDefinition(adapterDefinition);
  return Boolean(adapter.capabilities[capabilityName]);
}
