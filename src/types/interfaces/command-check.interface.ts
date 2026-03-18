import type { CommandResultStatus, FindingSeverity } from "../aliases/command.type.js";

export interface CheckFinding {
  id: string;
  stageId: string;
  ruleId: string | null;
  severity: FindingSeverity;
  status: CommandResultStatus;
  message: string;
  target: string;
  suggestion: string | null;
}

export interface CheckFindingOptions {
  id: string;
  stageId: string;
  ruleId?: string | null;
  severity?: CheckFinding["severity"];
  status?: CheckFinding["status"];
  message: string;
  target: string;
  suggestion?: string | null;
}
