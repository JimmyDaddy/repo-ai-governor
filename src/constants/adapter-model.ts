export enum AdapterInputSourceEnum {
  Workflow = "workflow",
  Standards = "standards",
  Slots = "slots",
  AgentEntry = "agent-entry",
  Artifacts = "artifacts",
  RuntimeContext = "runtime-context",
}

export const ADAPTER_INPUT_SOURCES = Object.freeze(
  Object.values(AdapterInputSourceEnum),
) as readonly `${AdapterInputSourceEnum}`[];

export enum AdapterOutputArtifactEnum {
  Plan = "plan",
  CheckReport = "check-report",
  ReviewReport = "review-report",
  TaskRecord = "task-record",
  Summary = "summary",
  AgentEntry = "agent-entry",
}

export const ADAPTER_OUTPUT_ARTIFACTS = Object.freeze(
  Object.values(AdapterOutputArtifactEnum),
) as readonly `${AdapterOutputArtifactEnum}`[];

export enum MainstreamAdapterIdEnum {
  Codex = "codex",
  GitHubCopilot = "github-copilot",
  ClaudeCode = "claude-code",
}

export const MAINSTREAM_ADAPTER_IDS = Object.freeze(
  Object.values(MainstreamAdapterIdEnum),
) as readonly `${MainstreamAdapterIdEnum}`[];

export enum AdapterTypeEnum {
  Ide = "ide",
  Cli = "cli",
  IdeOrCli = "ide-or-cli",
  Agent = "agent",
  Ci = "ci",
}

export const ADAPTER_TYPES = Object.freeze(
  Object.values(AdapterTypeEnum),
) as readonly `${AdapterTypeEnum}`[];

export enum AdapterEntrypointEnum {
  Ide = "ide",
  Cli = "cli",
  Agent = "agent",
  Ci = "ci",
}

export const ADAPTER_ENTRYPOINTS = Object.freeze(
  Object.values(AdapterEntrypointEnum),
) as readonly `${AdapterEntrypointEnum}`[];

export enum AdapterProtocolEnum {
  File = "file",
  Template = "template",
  Prompt = "prompt",
  Command = "command",
  AgentEntry = "agent-entry",
}

export const ADAPTER_PROTOCOLS = Object.freeze(
  Object.values(AdapterProtocolEnum),
) as readonly `${AdapterProtocolEnum}`[];

export enum AdapterRequiredViewEnum {
  Ai = "ai",
  Human = "human",
}

export const ADAPTER_REQUIRED_VIEWS = Object.freeze(
  Object.values(AdapterRequiredViewEnum),
) as readonly `${AdapterRequiredViewEnum}`[];

export enum AdapterSupportedFormatEnum {
  Markdown = "markdown",
  Json = "json",
  Yaml = "yaml",
  Text = "text",
}

export const ADAPTER_SUPPORTED_FORMATS = Object.freeze(
  Object.values(AdapterSupportedFormatEnum),
) as readonly `${AdapterSupportedFormatEnum}`[];

export enum AdapterInjectionModeEnum {
  File = "file",
  Template = "template",
  FileAndTemplate = "file-and-template",
  DirectPrompt = "direct-prompt",
}

export const ADAPTER_INJECTION_MODES = Object.freeze(
  Object.values(AdapterInjectionModeEnum),
) as readonly `${AdapterInjectionModeEnum}`[];

export enum AdapterInjectionSourceEnum {
  Standards = "standards",
  Workflow = "workflow",
  Slots = "slots",
  AgentEntry = "agent-entry",
  Artifacts = "artifacts",
}

export const ADAPTER_INJECTION_SOURCES = Object.freeze(
  Object.values(AdapterInjectionSourceEnum),
) as readonly `${AdapterInjectionSourceEnum}`[];
