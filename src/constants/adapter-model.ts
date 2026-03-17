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
