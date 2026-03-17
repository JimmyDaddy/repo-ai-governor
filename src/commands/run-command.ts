import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import YAML from "yaml";
import { loadResolvedConfig } from "../config/load-config.js";
import { ConfigError, InputError } from "../cli/runtime/errors.js";
import { EXIT_CODES } from "../cli/runtime/exit-codes.js";
import type { ExecuteWorkflowOptions } from "../workflow/governance-engine.js";
import { executeWorkflow } from "../workflow/governance-engine.js";
import { buildSlotRuntime } from "../slots/runtime.js";
import {
  findPatternEvidence,
  normalizeRiskTag,
  normalizeStringList,
  normalizeSurfaceId,
  normalizeTaskId,
  normalizeTaskStatus,
  parseRiskTagList,
  readTextFileIfExists,
  toPositiveInteger
} from "./automation-shared.js";
import {
  cloneValue,
  isPlainObject,
  normalizeLocale,
  toRelativePath,
  translateLocale
} from "../utils/common.js";

// biome-ignore lint/suspicious/noExplicitAny: transitional typing for large command migration
type AnyRecord = Record<string, any>;

const RUN_MODES = new Set(["manual", "assisted", "autonomous"]);

const DEFAULT_TASK_COMPLETION_STATUSES = Object.freeze(["done", "resolved", "completed", "closed"]);

const DEFAULT_PROCESS_STAGES = Object.freeze([
  {
    id: "requirements-input",
    kind: "system",
    requiredSurface: false,
    routeKey: null,
    name: {
      "zh-CN": "需求输入",
      "en-US": "Requirements Input"
    }
  },
  {
    id: "requirements-draft",
    kind: "ai",
    requiredSurface: true,
    routeKey: "requirements-draft",
    name: {
      "zh-CN": "需求草拟",
      "en-US": "Requirements Draft"
    }
  },
  {
    id: "draft-review-loop",
    kind: "loop",
    requiredSurface: false,
    routeKey: null,
    name: {
      "zh-CN": "需求草案评审循环",
      "en-US": "Requirement Draft Review Loop"
    }
  },
  {
    id: "technical-solution-loop",
    kind: "loop",
    requiredSurface: false,
    routeKey: null,
    name: {
      "zh-CN": "技术方案评审循环",
      "en-US": "Technical Solution Review Loop"
    }
  },
  {
    id: "task-breakdown",
    kind: "ai",
    requiredSurface: true,
    routeKey: "task-breakdown",
    name: {
      "zh-CN": "任务拆解",
      "en-US": "Task Breakdown"
    }
  },
  {
    id: "task-delivery-loop",
    kind: "loop",
    requiredSurface: false,
    routeKey: null,
    name: {
      "zh-CN": "任务开发评审循环",
      "en-US": "Task Delivery Loop"
    }
  }
]);

const DEFAULT_TASK_LOOP = Object.freeze({
  stageId: "task-delivery-loop",
  implementationRouteKey: "task-implementation",
  codeReviewRouteKey: "task-code-review",
  maxReviewCycles: 3
});

const LOOP_COMPLETION_POLICIES = new Set(["first-cycle", "max-cycles"]);

const DEFAULT_REVIEW_LOOPS = Object.freeze({
  "draft-review-loop": Object.freeze({
    stageId: "draft-review-loop",
    routeSequence: Object.freeze(["draft-review", "draft-review-verify"]),
    maxReviewCycles: 2,
    completionPolicy: "first-cycle"
  }),
  "technical-solution-loop": Object.freeze({
    stageId: "technical-solution-loop",
    routeSequence: Object.freeze([
      "technical-solution",
      "technical-solution-review",
      "technical-solution-revise"
    ]),
    maxReviewCycles: 3,
    completionPolicy: "first-cycle"
  })
});

const BUILTIN_ROUTING_PROFILES = Object.freeze({
  "single-codex": Object.freeze({
    defaultSurface: "codex",
    routing: Object.freeze({
      "requirements-draft": "codex",
      "draft-review": "codex",
      "draft-review-verify": "codex",
      "technical-solution": "codex",
      "technical-solution-review": "codex",
      "technical-solution-revise": "codex",
      "task-breakdown": "codex",
      "task-implementation": "codex",
      "task-code-review": "codex"
    })
  }),
  "multi-ai-dev-review": Object.freeze({
    defaultSurface: "codex",
    routing: Object.freeze({
      "requirements-draft": "codex",
      "draft-review": "claude-code",
      "draft-review-verify": "codex",
      "technical-solution": "codex",
      "technical-solution-review": "claude-code",
      "technical-solution-revise": "codex",
      "task-breakdown": "codex",
      "task-implementation": "codex",
      "task-code-review": "github-copilot"
    })
  })
});

const BUILTIN_SURFACE_PROBES = Object.freeze({
  codex: Object.freeze({
    binary: "codex",
    binaryArgs: ["--version"],
    healthArgs: ["--version"],
    workspaceDir: ".codex/skills"
  }),
  "claude-code": Object.freeze({
    binary: "claude",
    binaryArgs: ["--version"],
    healthArgs: ["--version"],
    workspaceDir: ".claude/skills"
  }),
  "github-copilot": Object.freeze({
    binary: "gh",
    binaryArgs: ["--version"],
    healthArgs: ["copilot", "--help"],
    workspaceDir: ".github/skills"
  })
});

const REVIEW_STATUS_WEIGHT = Object.freeze({
  review: 1,
  verified_review: 2,
  resolved_review: 3
});

const ROUTE_ACTION_RULES = Object.freeze({
  "requirements-draft": Object.freeze(["editDocs"]),
  "draft-review": Object.freeze(["editDocs"]),
  "draft-review-verify": Object.freeze(["editDocs"]),
  "technical-solution": Object.freeze(["editDocs"]),
  "technical-solution-review": Object.freeze(["editDocs"]),
  "technical-solution-revise": Object.freeze(["editCode"]),
  "task-breakdown": Object.freeze(["editDocs"]),
  "task-implementation": Object.freeze(["editCode"]),
  "task-code-review": Object.freeze(["runChecks"])
});

const ROUTE_ACTION_HINTS = Object.freeze([
  Object.freeze({
    pattern: /(implementation|revise|refactor|fix|code)/i,
    action: "editCode"
  }),
  Object.freeze({
    pattern: /(review|verify|check|lint|test)/i,
    action: "runChecks"
  }),
  Object.freeze({
    pattern: /(requirements|draft|solution|breakdown|plan|doc)/i,
    action: "editDocs"
  })
]);

const ACTION_PERMISSION_FIELD = Object.freeze({
  read: "allowRead",
  editCode: "allowEditCode",
  editDocs: "allowEditDocs",
  runChecks: "allowRunChecks",
  commit: "allowCommit",
  push: "allowPush",
  pullRequest: "allowPullRequest"
});

const HIGH_RISK_PERMISSION_FIELD = Object.freeze({
  secrets_or_credentials: "allowSecretsEdit",
  infra_or_deploy: "allowInfraEdit",
  ci_workflow_modification: "allowInfraEdit",
  dangerous_command: "allowDangerousCommands",
  production_config_edit: "allowProductionConfigEdit"
});

const HIGH_RISK_RULES = Object.freeze([
  Object.freeze({
    tag: "secrets_or_credentials",
    source: "file",
    patterns: Object.freeze([
      /(^|\s)\.env(\.|\/|\s|$)/i,
      /(secret|credential|api[-_ ]?key|token|password|private[-_ ]?key)/i,
      /(密钥|密码|凭证|令牌|密文)/i
    ])
  }),
  Object.freeze({
    tag: "infra_or_deploy",
    source: "file",
    patterns: Object.freeze([
      /(dockerfile|docker-compose|compose\.ya?ml)/i,
      /(terraform|ansible|helm|k8s|kubernetes|pulumi)/i,
      /(deploy|deployment|release[-_ ]pipeline)/i
    ])
  }),
  Object.freeze({
    tag: "ci_workflow_modification",
    source: "file",
    patterns: Object.freeze([
      /(\.github\/workflows\/|\.gitlab-ci\.yml|jenkinsfile)/i,
      /(workflow|pipeline|ci\/)/i
    ])
  }),
  Object.freeze({
    tag: "dependency_major_upgrade",
    source: "change_type",
    patterns: Object.freeze([
      /(major[ -]?upgrade|upgrade to v?\d{2,})/i,
      /(breaking[ -]?change|重大升级|主版本升级)/i
    ])
  }),
  Object.freeze({
    tag: "database_migration",
    source: "file",
    patterns: Object.freeze([
      /(migration|migrations|schema\.sql|prisma\/migrations)/i,
      /(alter table|drop table|create index|数据库迁移|表结构变更)/i
    ])
  }),
  Object.freeze({
    tag: "dangerous_command",
    source: "command",
    patterns: Object.freeze([
      /(rm\s+-rf|mkfs|dd\s+if=|shutdown|reboot|:\(\)\{\s*:\|:&\s*\};:)/i,
      /(curl\s+[^|]+\|\s*(sh|bash)|sudo\s+rm\s+-rf)/i
    ])
  }),
  Object.freeze({
    tag: "production_config_edit",
    source: "file",
    patterns: Object.freeze([
      /(production|prod\.|values-prod|live\/|prod\/)/i,
      /(线上配置|生产配置|生产环境)/i
    ])
  })
]);

const DEFAULT_APPROVAL_RISK_TAGS = Object.freeze([
  "secrets_or_credentials",
  "infra_or_deploy",
  "ci_workflow_modification",
  "dependency_major_upgrade",
  "database_migration",
  "dangerous_command",
  "production_config_edit"
]);

const HIGH_RISK_TAG_SET = new Set(HIGH_RISK_RULES.map((rule) => rule.tag));
const RUN_AUDIT_KIND = "run-audit-record";
const RUN_AUDIT_SCHEMA_VERSION = "1";

function t(locale: any, zhCN: any, enUS: any) {
  return translateLocale(locale, zhCN, enUS);
}

function createRunExecutionId(date = new Date()) {
  const timestamp = date.toISOString().replace(/[-:.]/g, "").replace("T", "-").replace("Z", "");
  const token = randomUUID().replace(/-/g, "").slice(0, 8);
  return `run-${timestamp}-${token}`;
}

function safeParseJsonFile(filePath: any, locale: any, errorCode: any) {
  const rawContent = fs.readFileSync(filePath, "utf8");

  try {
    return JSON.parse(rawContent);
  } catch (error) {
    throw new InputError(
      t(locale, `JSON 解析失败：${filePath}`, `Failed to parse JSON: ${filePath}`),
      {
        code: errorCode,
        details: {
          filePath,
          cause: error instanceof Error ? error.message : String(error)
        }
      }
    );
  }
}

function resolveProcessSourceFromConfigFile(configFilePath: any) {
  if (!configFilePath || !fs.existsSync(configFilePath)) {
    return "default";
  }

  try {
    const rawDocument = YAML.parse(fs.readFileSync(configFilePath, "utf8"));
    const automationConfig = rawDocument?.automation;

    if (!isPlainObject(automationConfig) || !isPlainObject(automationConfig.process)) {
      return "default";
    }

    const processConfig = automationConfig.process;

    if (
      Array.isArray(processConfig.stageDefinitions) &&
      processConfig.stageDefinitions.length > 0
    ) {
      return "customized";
    }

    if (isPlainObject(processConfig.draftReviewLoop)) {
      const draftLoop = processConfig.draftReviewLoop;
      const defaultSequence = [...DEFAULT_REVIEW_LOOPS["draft-review-loop"].routeSequence];
      const configuredSequence = Array.isArray(draftLoop.routeSequence)
        ? draftLoop.routeSequence.map((item) => String(item).trim()).filter(Boolean)
        : [];

      if (draftLoop.enabled === false) {
        return "customized";
      }

      if (
        configuredSequence.length > 0 &&
        JSON.stringify(configuredSequence) !== JSON.stringify(defaultSequence)
      ) {
        return "customized";
      }

      if (
        typeof draftLoop.maxReviewCycles === "number" &&
        draftLoop.maxReviewCycles !== DEFAULT_REVIEW_LOOPS["draft-review-loop"].maxReviewCycles
      ) {
        return "customized";
      }

      if (
        typeof draftLoop.completionPolicy === "string" &&
        draftLoop.completionPolicy !== DEFAULT_REVIEW_LOOPS["draft-review-loop"].completionPolicy
      ) {
        return "customized";
      }
    }

    if (isPlainObject(processConfig.solutionReviewLoop)) {
      const solutionLoop = processConfig.solutionReviewLoop;
      const defaultSequence = [...DEFAULT_REVIEW_LOOPS["technical-solution-loop"].routeSequence];
      const configuredSequence = Array.isArray(solutionLoop.routeSequence)
        ? solutionLoop.routeSequence.map((item) => String(item).trim()).filter(Boolean)
        : [];

      if (solutionLoop.enabled === false) {
        return "customized";
      }

      if (
        configuredSequence.length > 0 &&
        JSON.stringify(configuredSequence) !== JSON.stringify(defaultSequence)
      ) {
        return "customized";
      }

      if (
        typeof solutionLoop.maxReviewCycles === "number" &&
        solutionLoop.maxReviewCycles !==
          DEFAULT_REVIEW_LOOPS["technical-solution-loop"].maxReviewCycles
      ) {
        return "customized";
      }

      if (
        typeof solutionLoop.completionPolicy === "string" &&
        solutionLoop.completionPolicy !==
          DEFAULT_REVIEW_LOOPS["technical-solution-loop"].completionPolicy
      ) {
        return "customized";
      }
    }

    if (isPlainObject(processConfig.taskLoop)) {
      const taskLoop = processConfig.taskLoop;

      if (
        typeof taskLoop.stageId === "string" &&
        taskLoop.stageId.trim() &&
        taskLoop.stageId !== DEFAULT_TASK_LOOP.stageId
      ) {
        return "customized";
      }

      if (
        typeof taskLoop.implementationRouteKey === "string" &&
        taskLoop.implementationRouteKey.trim() &&
        taskLoop.implementationRouteKey !== DEFAULT_TASK_LOOP.implementationRouteKey
      ) {
        return "customized";
      }

      if (
        typeof taskLoop.codeReviewRouteKey === "string" &&
        taskLoop.codeReviewRouteKey.trim() &&
        taskLoop.codeReviewRouteKey !== DEFAULT_TASK_LOOP.codeReviewRouteKey
      ) {
        return "customized";
      }

      if (
        typeof taskLoop.maxReviewCycles === "number" &&
        taskLoop.maxReviewCycles !== DEFAULT_TASK_LOOP.maxReviewCycles
      ) {
        return "customized";
      }
    }

    return "default";
  } catch {
    return "default";
  }
}

function buildCompiledProcessSnapshot(processModel: any, routingPlan: any, workflowTemplate: any) {
  return {
    stages: processModel.stages.map((stage: any) => ({
      id: stage.id,
      kind: stage.kind,
      routeKey: stage.routeKey,
      requiredSurface: stage.requiredSurface
    })),
    reviewLoops: processModel.reviewLoops.map((loopConfig: any) => ({
      stageId: loopConfig.stageId,
      routeSequence: loopConfig.routeSequence,
      maxReviewCycles: loopConfig.maxReviewCycles,
      completionPolicy: loopConfig.completionPolicy
    })),
    taskLoop: cloneValue(processModel.taskLoop),
    routeDefinitions: processModel.routeDefinitions.map((route: any) => ({
      routeKey: route.routeKey,
      stageId: route.stageId,
      label: route.label,
      requiredSurface: route.requiredSurface
    })),
    routing: {
      profile: routingPlan.profileId,
      defaultSurface: routingPlan.defaultSurface,
      routes: routingPlan.routes.map((route: any) => ({
        routeKey: route.routeKey,
        stageId: route.stageId,
        label: route.label,
        requestedSurface: route.requestedSurface,
        resolvedSurface: route.resolvedSurface,
        decision: route.decision,
        source: route.source
      }))
    },
    workflow: {
      id: workflowTemplate.id,
      stageOrder: workflowTemplate.stages.map((stage: any) => stage.id)
    }
  };
}

function buildProcessExplainPayload(
  runState: any,
  processModel: any,
  routingPlan: any,
  workflowTemplate: any,
  options: AnyRecord = {},
) {
  const locale = runState.locale;
  const summaryStatus = options.status ?? "pass";
  const summaryWarnings = options.warnings ?? 0;
  const summaryErrors = options.errors ?? 0;
  const summaryPassed = summaryStatus === "pass" || summaryStatus === "warn" ? 1 : 0;
  const summaryExitCode = summaryErrors > 0 ? EXIT_CODES.inputError : EXIT_CODES.success;

  return {
    command: "run",
    status: summaryStatus,
    locale,
    cwd: runState.cwd,
    configFile: runState.resolvedConfig.paths.configFile,
    currentProject: runState.resolvedConfig.config.execution.currentProject,
    currentSprint: runState.resolvedConfig.config.execution.currentSprint,
    mode: runState.mode,
    dryRun: runState.dryRun,
    explainProcess: runState.explainProcess,
    validateProcess: runState.validateProcess,
    process: {
      source: processModel.source,
      snapshot: buildCompiledProcessSnapshot(processModel, routingPlan, workflowTemplate)
    },
    summary: {
      status: summaryStatus,
      errors: summaryErrors,
      warnings: summaryWarnings,
      passed: summaryPassed,
      exitCode: summaryExitCode
    },
    notes: [
      t(
        locale,
        "本次仅执行流程编译/解释，不会触发阶段派发与审计落盘。",
        "This run only compiles/explains process metadata and does not dispatch stages or write audit artifacts."
      )
    ]
  };
}

function detectHighRiskSignals(content: any) {
  const normalizedContent = String(content ?? "");
  const detections = [];

  for (const rule of HIGH_RISK_RULES) {
    let evidence = null;

    for (const pattern of rule.patterns) {
      evidence = findPatternEvidence(normalizedContent, pattern);

      if (evidence) {
        break;
      }
    }

    if (!evidence) {
      continue;
    }

    detections.push({
      tag: rule.tag,
      source: rule.source,
      evidence
    });
  }

  return {
    riskTags: detections.map((detection) => detection.tag),
    detections
  };
}

function inferActionFromRouteKey(routeKey: any) {
  const explicit = (ROUTE_ACTION_RULES as Record<string, readonly string[]>)[String(routeKey)];

  if (explicit) {
    return [...explicit];
  }

  for (const hint of ROUTE_ACTION_HINTS) {
    if (hint.pattern.test(routeKey)) {
      return [hint.action];
    }
  }

  return [];
}

function inferIntentActionsFromInput(content: any) {
  const normalizedContent = String(content ?? "");
  const actions = [];

  if (/(^|\s)(commit|提交)($|\s)/i.test(normalizedContent)) {
    actions.push("commit");
  }

  if (/(^|\s)(push|推送)($|\s)/i.test(normalizedContent)) {
    actions.push("push");
  }

  if (/(pull request|merge request|\bpr\b|发起\s*PR|提交\s*PR)/i.test(normalizedContent)) {
    actions.push("pullRequest");
  }

  if (/(lint|typecheck|test|测试|检查)/i.test(normalizedContent)) {
    actions.push("runChecks");
  }

  return actions;
}

function resolveRequiredActions(routeDecisions: any, policyInputContent: any) {
  const requiredActions = new Set(["read"]);

  for (const decision of routeDecisions) {
    for (const action of inferActionFromRouteKey(decision.routeKey)) {
      requiredActions.add(action);
    }
  }

  for (const action of inferIntentActionsFromInput(policyInputContent)) {
    requiredActions.add(action);
  }

  return [...requiredActions];
}

function resolvePermissionTier(permissions: any) {
  const canEdit = permissions.allowEditCode === true || permissions.allowEditDocs === true;

  if (permissions.allowPush === true) {
    return "push";
  }

  if (permissions.allowCommit === true || permissions.allowPullRequest === true) {
    return "commit";
  }

  if (permissions.allowRunChecks === true) {
    return "check";
  }

  if (canEdit) {
    return "edit";
  }

  return "read";
}

function evaluatePolicyGate(runState: any, routeDecisions: any) {
  const permissions = runState.permissions;
  const permissionTier = resolvePermissionTier(permissions);
  const requiredActions = resolveRequiredActions(routeDecisions, runState.policyInputContent);
  const riskSignals = detectHighRiskSignals(runState.policyInputContent);
  const riskTags = normalizeStringList(riskSignals.riskTags.map(normalizeRiskTag));
  const requiredApprovalTags = new Set();
  const permissionViolations = [];
  const warnings = [];

  for (const action of requiredActions) {
    const permissionField = (ACTION_PERMISSION_FIELD as Record<string, string>)[action];

    if (!permissionField) {
      continue;
    }

    if (permissions[permissionField] !== true) {
      permissionViolations.push({
        type: "action",
        action,
        permission: permissionField,
        message: t(
          runState.locale,
          `当前策略不允许执行动作 ${action}（${permissionField}=false）。`,
          `Current policy disallows action ${action} (${permissionField}=false).`
        )
      });
    }
  }

  for (const tag of riskTags) {
    if (DEFAULT_APPROVAL_RISK_TAGS.includes(tag) || runState.approvalPolicy.requiredTags.has(tag)) {
      requiredApprovalTags.add(tag);
    }

    const permissionField = (HIGH_RISK_PERMISSION_FIELD as Record<string, string>)[tag];

    if (!permissionField) {
      continue;
    }

    if (permissions[permissionField] !== true) {
      requiredApprovalTags.add(tag);
    }
  }

  for (const approvedTag of runState.approvalPolicy.approvedTags) {
    if (!HIGH_RISK_TAG_SET.has(approvedTag)) {
      warnings.push({
        id: `run.policy.unknown-approval.${approvedTag}`,
        stageId: "policy-gate",
        severity: "warning",
        message: t(
          runState.locale,
          `收到未定义风险标签确认：${approvedTag}。`,
          `Received approval for unknown risk tag: ${approvedTag}.`
        ),
        target: approvedTag,
        suggestion: t(
          runState.locale,
          "请确认风险标签是否拼写正确，或在策略中补充对应规则。",
          "Confirm the risk tag spelling, or add a matching rule in policy config."
        )
      });
    }
  }

  const requiredApprovalList = [...requiredApprovalTags];
  const approvedRiskTags = requiredApprovalList.filter((tag) =>
    runState.approvalPolicy.approvedTags.has(tag)
  );
  const missingApprovals = requiredApprovalList.filter(
    (tag) => !runState.approvalPolicy.approvedTags.has(tag)
  );
  const requiresHumanApproval = missingApprovals.length > 0;
  let decision = "allow";
  let reason = t(
    runState.locale,
    "权限与风险门禁通过，可继续执行。",
    "Permission and risk gates passed."
  );

  if (permissionViolations.length > 0) {
    decision = "block";
    reason = t(
      runState.locale,
      "权限门禁阻断：当前策略不允许本次执行所需动作。",
      "Policy blocked: current permissions do not allow required actions."
    );
  } else if (requiresHumanApproval) {
    decision = runState.nonInteractive ? "block" : "pause_for_approval";
    reason =
      decision === "block"
        ? t(
            runState.locale,
            `检测到高风险标签（${missingApprovals.join(", ")}），非交互模式下默认阻断。`,
            `Detected high-risk tags (${missingApprovals.join(", ")}); non-interactive mode blocks by default.`
          )
        : t(
            runState.locale,
            `检测到高风险标签（${missingApprovals.join(", ")}），等待人工确认后继续。`,
            `Detected high-risk tags (${missingApprovals.join(", ")}); awaiting approval before continuing.`
          );
  }

  return {
    decision,
    reason,
    permissionTier,
    nonInteractive: runState.nonInteractive,
    inputRef: runState.policyInputRef
      ? toRelativePath(runState.cwd, runState.policyInputRef)
      : null,
    requiredActions,
    permissions: cloneValue(permissions),
    permissionViolations,
    riskTags,
    riskDetections: riskSignals.detections,
    requiredApprovalTags: requiredApprovalList,
    approvedRiskTags,
    missingApprovals,
    requiresHumanApproval,
    warnings
  };
}

function parseCsvLine(line: any) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
}

function readCsvRows(filePath: any) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      header: [],
      rows: []
    };
  }

  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: AnyRecord = {};

    for (const [index, key] of header.entries()) {
      row[key] = values[index] ?? "";
    }

    return row;
  });

  return {
    header,
    rows
  };
}

function createSurfaceSuggestion(surface: any, checkId: any, locale: any) {
  if (checkId === "binary_check") {
    return t(
      locale,
      `请确保 ${surface} 对应 CLI 已安装并在 PATH 中可执行。`,
      `Make sure the CLI for ${surface} is installed and available in PATH.`
    );
  }

  if (checkId === "workspace_binding_check") {
    return t(
      locale,
      `可执行 \`repo-ai-governor skills install --surface ${surface} --scope repo\` 初始化仓库接线目录。`,
      `Run \`repo-ai-governor skills install --surface ${surface} --scope repo\` to bootstrap workspace binding.`
    );
  }

  if (checkId === "health_check") {
    return t(
      locale,
      `请确认 ${surface} 的登录态和本地环境可用后重试。`,
      `Verify local auth/session and environment for ${surface}, then retry.`
    );
  }

  return t(locale, "请修复 preflight 报错后重试。", "Fix preflight issues and retry.");
}

function runProbe(binary: any, args: any, cwd: any) {
  try {
    const result = spawnSync(binary, args, {
      cwd,
      encoding: "utf8",
      timeout: 4000,
      windowsHide: true
    });

    if (result.error) {
      const errorCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
      return {
        ok: false,
        code: errorCode === "ENOENT" ? "probe.binary_missing" : "probe.spawn_error",
        message: result.error.message
      };
    }

    if (result.status !== 0) {
      return {
        ok: false,
        code: "probe.command_failed",
        message: (result.stderr || result.stdout || "").trim() || `exit ${result.status}`
      };
    }

    return {
      ok: true,
      code: "probe.ok",
      message: (result.stdout || "").trim()
    };
  } catch (error) {
    return {
      ok: false,
      code: "probe.exception",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function resolveSurfaceProbeDefinition(surface: any, runState: any) {
  const custom = runState.surfaceDefinitions[surface];

  if (custom && isPlainObject(custom)) {
    return {
      binary: String(custom.binary ?? "").trim(),
      binaryArgs: Array.isArray(custom.binaryArgs) ? custom.binaryArgs.map(String) : ["--version"],
      healthArgs: Array.isArray(custom.healthArgs) ? custom.healthArgs.map(String) : ["--help"],
      workspaceDir: custom.workspaceDir ? String(custom.workspaceDir) : null
    };
  }

  return (BUILTIN_SURFACE_PROBES as Record<string, AnyRecord>)[surface] ?? null;
}

function runSurfacePreflight(surface: any, runState: any) {
  const probe = resolveSurfaceProbeDefinition(surface, runState);
  const checks = [];
  let available = true;

  if (!probe || !probe.binary) {
    checks.push({
      id: "binary_check",
      status: "warn",
      message: t(
        runState.locale,
        `未配置 ${surface} 的 preflight 探针，按外部入口处理。`,
        `No preflight probe configured for ${surface}; treating as external surface.`
      ),
      suggestion: t(
        runState.locale,
        "可在 governor.yaml 的 automation.surfaces 中为该入口补充 binary/health/workspace 配置。",
        "Add binary/health/workspace probes under automation.surfaces in governor.yaml."
      )
    });
    checks.push({
      id: "auth_check",
      status: "warn",
      message: t(
        runState.locale,
        "该入口未配置认证探针，认证状态由调用方自行保证。",
        "Auth probe is not configured; caller must ensure authentication."
      ),
      suggestion: null
    });
    checks.push({
      id: "workspace_binding_check",
      status: "warn",
      message: t(
        runState.locale,
        "该入口未配置仓库接线目录检查。",
        "Workspace binding check is not configured for this surface."
      ),
      suggestion: null
    });
    checks.push({
      id: "health_check",
      status: "warn",
      message: t(
        runState.locale,
        "该入口未配置健康探针，按可用处理。",
        "Health check is not configured for this surface; assuming availability."
      ),
      suggestion: null
    });

    return {
      surface,
      available,
      checks,
      fallbackDecision: "none"
    };
  }

  const binaryProbe = runProbe(probe.binary, probe.binaryArgs ?? ["--version"], runState.cwd);
  checks.push({
    id: "binary_check",
    status: binaryProbe.ok ? "pass" : "fail",
    message: binaryProbe.ok
      ? t(runState.locale, "入口二进制可用。", "Surface binary is available.")
      : t(runState.locale, "入口二进制不可用。", "Surface binary is unavailable."),
    detail: binaryProbe.message || null,
    suggestion: binaryProbe.ok ? null : createSurfaceSuggestion(surface, "binary_check", runState.locale)
  });

  if (!binaryProbe.ok) {
    available = false;
  }

  checks.push({
    id: "auth_check",
    status: "pass",
    message: t(
      runState.locale,
      "v1 仅做最小认证占位检查；严格认证探针在后续迭代补齐。",
      "v1 keeps auth checks lightweight; strict auth probing lands in later iterations."
    ),
    suggestion: null
  });

  if (probe.workspaceDir) {
    const workspaceDirPath = path.resolve(runState.cwd, probe.workspaceDir);
    const workspaceReady = fs.existsSync(workspaceDirPath) && fs.statSync(workspaceDirPath).isDirectory();

    checks.push({
      id: "workspace_binding_check",
      status: workspaceReady ? "pass" : "warn",
      message: workspaceReady
        ? t(runState.locale, "仓库接线目录已就绪。", "Workspace binding directory is ready.")
        : t(runState.locale, "仓库接线目录缺失。", "Workspace binding directory is missing."),
      detail: toRelativePath(runState.cwd, workspaceDirPath),
      suggestion: workspaceReady
        ? null
        : createSurfaceSuggestion(surface, "workspace_binding_check", runState.locale)
    });
  } else {
    checks.push({
      id: "workspace_binding_check",
      status: "warn",
      message: t(
        runState.locale,
        "该入口未配置 workspaceDir，已跳过目录绑定检查。",
        "workspaceDir is not configured for this surface; binding check skipped."
      ),
      suggestion: null
    });
  }

  let healthStatus = "pass";
  let healthDetail = null;
  let healthSuggestion = null;

  if (binaryProbe.ok) {
    const healthProbe = runProbe(probe.binary, probe.healthArgs ?? ["--help"], runState.cwd);

    if (!healthProbe.ok) {
      healthStatus = "fail";
      healthDetail = healthProbe.message || null;
      healthSuggestion = createSurfaceSuggestion(surface, "health_check", runState.locale);
      available = false;
    }
  } else {
    healthStatus = "fail";
    healthDetail = t(
      runState.locale,
      "由于 binary_check 失败，健康探针被跳过。",
      "Health probe skipped because binary_check failed."
    );
    healthSuggestion = createSurfaceSuggestion(surface, "binary_check", runState.locale);
  }

  checks.push({
    id: "health_check",
    status: healthStatus,
    message: healthStatus === "pass"
      ? t(runState.locale, "健康探针通过。", "Health probe passed.")
      : t(runState.locale, "健康探针失败。", "Health probe failed."),
    detail: healthDetail,
    suggestion: healthSuggestion
  });

  return {
    surface,
    available,
    checks,
    fallbackDecision: "none"
  };
}

function buildRunArtifactPaths(cwd: any, resolvedConfig: any, locale: any) {
  const currentProject = resolvedConfig.config.execution.currentProject;
  const currentSprint = resolvedConfig.config.execution.currentSprint;

  if (!currentProject || !currentSprint) {
    throw new ConfigError(
      t(
        locale,
        "run 命令需要当前 project 与 sprint 上下文。",
        "Run command requires current project and sprint context."
      ),
      {
        code: "cli.run_missing_context",
        details: {
          currentProject,
          currentSprint
        }
      }
    );
  }

  const sprintRoot = path.resolve(
    cwd,
    resolvedConfig.config.artifacts.baseDir,
    currentProject,
    currentSprint
  );
  const tasksRoot = path.resolve(sprintRoot, resolvedConfig.config.artifacts.directories.tasks);
  const codeReviewRoot = path.resolve(sprintRoot, resolvedConfig.config.artifacts.directories.codeReview);

  return {
    sprintRoot,
    tasksRoot,
    codeReviewRoot,
    planFile: path.resolve(sprintRoot, resolvedConfig.config.artifacts.files.plan),
    checklistFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.checklist),
    taskCsvFile: path.resolve(tasksRoot, resolvedConfig.config.artifacts.taskFiles.csv)
  };
}

function buildRunAuditPaths(cwd: any, resolvedConfig: any, executionId: any) {
  const auditConfig = resolvedConfig.config.automation?.audit ?? {};
  const outputDir = path.resolve(
    cwd,
    auditConfig.outputDir ?? ".repo-ai-governor/reports/runs"
  );
  const latestFileName = String(auditConfig.latestFileName ?? "latest-run.json").trim() || "latest-run.json";

  return {
    outputDir,
    recordFile: path.resolve(outputDir, `${executionId}.json`),
    latestFile: path.resolve(outputDir, latestFileName)
  };
}

function normalizeCheckpointWarnings(warnings: any) {
  if (!Array.isArray(warnings)) {
    return [];
  }

  return warnings.map((warning, index) => ({
    id: warning?.id ?? `warning-${index + 1}`,
    severity: warning?.severity ?? "warning",
    message: warning?.message ?? "",
    target: warning?.target ?? null,
    suggestion: warning?.suggestion ?? null
  }));
}

function normalizeCheckpointRecord(value: any, index = 0) {
  const stageId = String(value?.id ?? "").trim();

  if (!stageId) {
    return null;
  }

  return {
    sequence: Number(value?.sequence) > 0 ? Number(value.sequence) : index + 1,
    id: stageId,
    status: String(value?.status ?? "unknown"),
    summary: value?.summary ?? null,
    startedAt: value?.startedAt ?? null,
    finishedAt: value?.finishedAt ?? null,
    durationMs: Number.isFinite(value?.durationMs) ? value.durationMs : 0,
    blockedBy: Array.isArray(value?.blockedBy) ? value.blockedBy.map(String) : [],
    warnings: normalizeCheckpointWarnings(value?.warnings),
    error: value?.error
      ? {
          code: value.error.code ?? null,
          message: value.error.message ?? String(value.error)
        }
      : null,
    outputs: isPlainObject(value?.outputs) ? cloneValue(value.outputs) : {},
    details: isPlainObject(value?.details) ? cloneValue(value.details) : null
  };
}

function resolveCheckpointRecordsFromPayload(payload: any) {
  if (Array.isArray(payload?.checkpoints?.stages)) {
    return payload.checkpoints.stages
      .map((checkpoint: any, index: any) => normalizeCheckpointRecord(checkpoint, index))
      .filter(Boolean);
  }

  if (Array.isArray(payload?.workflow?.stages)) {
    return payload.workflow.stages
      .map((stage: any, index: any) => normalizeCheckpointRecord(stage, index))
      .filter(Boolean);
  }

  return [];
}

function resolveResumePlan(runState: any, workflowTemplate: any) {
  if (!runState.resumeFromPath) {
    return null;
  }

  if (runState.mode !== "assisted") {
    throw new InputError(
      t(
        runState.locale,
        "--resume-from 仅支持 assisted 模式。",
        "--resume-from is only supported in assisted mode."
      ),
      {
        code: "cli.run_resume_mode_not_supported",
        details: {
          mode: runState.mode
        }
      }
    );
  }

  const resumePayload = safeParseJsonFile(
    runState.resumeFromPath,
    runState.locale,
    "cli.run_resume_source_parse_failed"
  );
  const checkpointRecords = resolveCheckpointRecordsFromPayload(resumePayload);

  if (checkpointRecords.length === 0) {
    throw new InputError(
      t(
        runState.locale,
        "恢复来源缺少 checkpoint 数据。",
        "Resume source does not contain checkpoint data."
      ),
      {
        code: "cli.run_resume_source_missing_checkpoints",
        details: {
          source: toRelativePath(runState.cwd, runState.resumeFromPath)
        }
      }
    );
  }

  const stageOrder = workflowTemplate.stages.map((stage: any) => stage.id);
  const checkpointByStage = new Map();

  for (const checkpoint of checkpointRecords) {
    if (!stageOrder.includes(checkpoint.id)) {
      continue;
    }

    checkpointByStage.set(checkpoint.id, checkpoint);
  }

  let resumeStageId = runState.resumeStageOverride
    ? String(runState.resumeStageOverride).trim()
    : String(resumePayload?.recovery?.nextStageId ?? "").trim() || null;

  if (!resumeStageId) {
    resumeStageId =
      stageOrder.find((stageId: any) => checkpointByStage.get(stageId)?.status !== "passed") ?? null;
  }

  if (resumeStageId && !stageOrder.includes(resumeStageId)) {
    throw new InputError(
      t(
        runState.locale,
        `恢复阶段不存在：${resumeStageId}`,
        `Resume stage does not exist: ${resumeStageId}`
      ),
      {
        code: "cli.run_resume_stage_invalid",
        details: {
          resumeStageId,
          stageOrder
        }
      }
    );
  }

  const restoreStageIds = new Set();
  const resumeStageIndex = resumeStageId ? stageOrder.indexOf(resumeStageId) : stageOrder.length;

  for (let index = 0; index < resumeStageIndex; index += 1) {
    const stageId = stageOrder[index];
    const checkpoint = checkpointByStage.get(stageId);

    if (checkpoint?.status === "passed") {
      restoreStageIds.add(stageId);
    }
  }

  return {
    sourceFile: runState.resumeFromPath,
    sourceExecutionId:
      typeof resumePayload?.executionId === "string" && resumePayload.executionId.trim()
        ? resumePayload.executionId.trim()
        : null,
    resumeStageId,
    restoreStageIds,
    checkpointByStage
  };
}

function buildStageCheckpoints(workflowResult: any) {
  return workflowResult.stages.map((stage: any, index: any) => ({
    sequence: index + 1,
    id: stage.id,
    status: stage.status ?? "unknown",
    summary: stage.summary ?? null,
    startedAt: stage.startedAt ?? null,
    finishedAt: stage.finishedAt ?? null,
    durationMs: Number.isFinite(stage.durationMs) ? stage.durationMs : 0,
    blockedBy: stage.blockedBy ?? [],
    warnings: normalizeCheckpointWarnings(stage.warnings),
    error: stage.error
      ? {
          code: stage.error.code ?? null,
          message: stage.error.message ?? null
        }
      : null,
    outputs: isPlainObject(stage.outputs) ? cloneValue(stage.outputs) : {},
    details: isPlainObject(stage.details) ? cloneValue(stage.details) : null
  }));
}

function buildRunKeyActions(workflowResult: any) {
  const actions = [];

  for (const stage of workflowResult.stages) {
    if (stage.details?.dispatch) {
      actions.push({
        type: "dispatch",
        stageId: stage.id,
        routeKey: stage.details.dispatch.routeKey ?? null,
        surface: stage.details.dispatch.resolvedSurface ?? null,
        mode: stage.details.dispatch.mode ?? null,
        taskId: stage.details.dispatch.taskId ?? null,
        cycle: stage.details.dispatch.cycle ?? null
      });
    }

    if (Array.isArray(stage.details?.loop?.cycles)) {
      for (const cycle of stage.details.loop.cycles) {
        if (Array.isArray(cycle.steps)) {
          for (const step of cycle.steps) {
            actions.push({
              type: "loop-step",
              stageId: stage.id,
              routeKey: step?.routeKey ?? null,
              surface: step?.resolvedSurface ?? null,
              cycle: cycle.cycle ?? null
            });
          }
        }

        if (cycle.implementation || cycle.codeReview) {
          actions.push({
            type: "task-cycle",
            stageId: stage.id,
            taskId: cycle.implementation?.taskId ?? cycle.codeReview?.taskId ?? null,
            cycle: cycle.cycle ?? null,
            implementationSurface: cycle.implementation?.resolvedSurface ?? null,
            codeReviewSurface: cycle.codeReview?.resolvedSurface ?? null
          });
        }
      }
    }
  }

  return actions;
}

function resolveRecoveryNextStageId(payload: any) {
  const failedStage = payload.workflow.stages.find((stage: any) => stage.status === "failed");

  if (failedStage) {
    return failedStage.id;
  }

  const blockedStage = payload.workflow.stages.find((stage: any) => stage.status === "blocked");
  return blockedStage?.id ?? null;
}

function buildRunRecoveryMetadata(runState: any, payload: any, auditRecordRef: any) {
  const nextStageId = resolveRecoveryNextStageId(payload);
  const resumeEnabled = runState.mode === "assisted" && Boolean(nextStageId) && Boolean(auditRecordRef);
  const recommendedCommand = resumeEnabled
    ? [
        "repo-ai-governor run",
        `--mode assisted`,
        `--project ${payload.currentProject}`,
        `--sprint ${payload.currentSprint}`,
        `--resume-from ${auditRecordRef}`
      ].join(" ")
    : null;
  const handoffRequired = runState.mode === "assisted" && payload.status === "fail";
  const handoffReason =
    payload.workflow.failure?.message ??
    (nextStageId
      ? t(
          runState.locale,
          `执行在阶段 ${nextStageId} 未收敛，需要人工接管处理后恢复。`,
          `Execution did not converge at stage ${nextStageId}; requires human handoff before resuming.`
        )
      : null);

  return {
    resumed: Boolean(runState.resumePlan),
    resumeSource: runState.resumePlan
      ? toRelativePath(runState.cwd, runState.resumePlan.sourceFile)
      : null,
    sourceExecutionId: runState.resumePlan?.sourceExecutionId ?? null,
    resumeStageId: runState.resumePlan?.resumeStageId ?? null,
    restoredStages: runState.resumePlan ? [...runState.resumePlan.restoreStageIds] : [],
    nextStageId,
    resumeAvailable: resumeEnabled,
    recommendedCommand,
    handoff: {
      required: handoffRequired,
      reason: handoffReason
    }
  };
}

function writeRunAuditRecord(runState: any, payload: any) {
  if (!runState.auditEnabled) {
    return null;
  }

  fs.mkdirSync(runState.auditPaths.outputDir, { recursive: true });
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  fs.writeFileSync(runState.auditPaths.recordFile, content, "utf8");
  fs.writeFileSync(runState.auditPaths.latestFile, content, "utf8");

  return {
    recordFile: toRelativePath(runState.cwd, runState.auditPaths.recordFile),
    latestFile: toRelativePath(runState.cwd, runState.auditPaths.latestFile)
  };
}

function loadTaskLedger(artifactPaths: any) {
  const { taskCsvFile } = artifactPaths;

  if (!fs.existsSync(taskCsvFile)) {
    return [];
  }

  const { rows } = readCsvRows(taskCsvFile);
  const latestByTaskId = new Map();

  for (const row of rows as AnyRecord[]) {
    const taskId = normalizeTaskId(row.task_id);

    if (!taskId) {
      continue;
    }

    latestByTaskId.set(taskId, {
      taskId,
      title: row.title ?? "",
      owner: row.owner ?? "",
      priority: row.priority ?? "",
      dueDate: row.due_date ?? "",
      status: normalizeTaskStatus(row.status),
      raw: row
    });
  }

  return [...latestByTaskId.values()].sort((left, right) => left.taskId.localeCompare(right.taskId));
}

function loadTaskCardIds(tasksRoot: any) {
  if (!fs.existsSync(tasksRoot)) {
    return new Set();
  }

  return new Set(
    fs.readdirSync(tasksRoot)
      .filter((entry) => /^TK-\d{3}\.md$/.test(entry))
      .map((entry) => entry.replace(/\.md$/, ""))
  );
}

function buildReviewStatusIndex(codeReviewRoot: any) {
  const index = new Map();

  if (!fs.existsSync(codeReviewRoot)) {
    return index;
  }

  for (const fileName of fs.readdirSync(codeReviewRoot)) {
    const match = fileName.match(/^(review|verified_review|resolved_review)_([a-z0-9-]+)\.md$/);

    if (!match) {
      continue;
    }

    const prefix = match[1];
    const slug = match[2];
    const taskMatch = slug.match(/tk-\d{3}/i);

    if (!taskMatch) {
      continue;
    }

    const taskId = taskMatch[0].toUpperCase();
    const weight = (REVIEW_STATUS_WEIGHT as Record<string, number>)[prefix] ?? 0;
    const existing = index.get(taskId);

    if (!existing || weight > existing.weight) {
      index.set(taskId, {
        status: prefix,
        weight,
        fileName
      });
    }
  }

  return index;
}

function buildTaskBreakdownContext(runState: any) {
  const checklistExists = fs.existsSync(runState.artifactPaths.checklistFile);
  const taskCsvExists = fs.existsSync(runState.artifactPaths.taskCsvFile);
  const ledger = loadTaskLedger(runState.artifactPaths);
  const taskCardIds = loadTaskCardIds(runState.artifactPaths.tasksRoot);
  const completionStatuses = new Set(runState.taskCompletionStatuses.map(normalizeTaskStatus));
  const completed = [];
  const pending = [];

  for (const task of ledger) {
    if (completionStatuses.has(task.status)) {
      completed.push(task);
      continue;
    }

    pending.push(task);
  }

  return {
    checklistExists,
    taskCsvExists,
    ledger,
    taskCardIds,
    completed,
    pending
  };
}

function resolveTaskCompletion(task: any, reviewIndex: any, completionStatuses: any) {
  if (completionStatuses.has(task.status)) {
    return {
      complete: true,
      source: "tasks.csv"
    };
  }

  const reviewStatus = reviewIndex.get(task.taskId)?.status ?? null;

  if (reviewStatus === "resolved_review") {
    return {
      complete: true,
      source: "code-review"
    };
  }

  return {
    complete: false,
    source: reviewStatus ? "code-review" : "none"
  };
}

function resolveRoutingProfile(config: any, profileId: any, locale: any) {
  if (profileId) {
    const customProfile = config.automation?.profiles?.[profileId];

    if (customProfile) {
      return customProfile;
    }

    const builtinProfile = (BUILTIN_ROUTING_PROFILES as Record<string, AnyRecord>)[profileId];

    if (builtinProfile) {
      return builtinProfile;
    }
  }

  if (config.automation?.routing && Object.keys(config.automation.routing).length > 0) {
    return {
      defaultSurface: config.automation.defaultSurface,
      routing: config.automation.routing
    };
  }

  if (!profileId) {
    return BUILTIN_ROUTING_PROFILES["multi-ai-dev-review"];
  }

  throw new InputError(
    t(locale, `未找到路由档：${profileId}`, `Routing profile not found: ${profileId}`),
    {
      code: "cli.run_unknown_routing_profile",
      details: {
        profileId,
        builtinProfiles: Object.keys(BUILTIN_ROUTING_PROFILES),
        customProfiles: Object.keys(config.automation?.profiles ?? {})
      }
    }
  );
}

function resolveLoopCompletionPolicy(rawPolicy: any, locale: any, stageId: any) {
  const completionPolicy = String(rawPolicy ?? "first-cycle").trim();

  if (LOOP_COMPLETION_POLICIES.has(completionPolicy)) {
    return completionPolicy;
  }

  throw new InputError(
    t(
      locale,
      `review loop(${stageId}) completionPolicy 不支持：${completionPolicy}`,
      `Unsupported completionPolicy for review loop(${stageId}): ${completionPolicy}`
    ),
    {
      code: "cli.run_invalid_review_loop_policy",
      details: {
        stageId,
        completionPolicy,
        supportedPolicies: [...LOOP_COMPLETION_POLICIES]
      }
    }
  );
}

function resolveReviewLoops(runState: any, processConfig: any, stages: any) {
  const stageIdSet = new Set<string>(stages.map((stage: any) => String(stage.id)));
  const loopConfigs = [
    {
      defaults: DEFAULT_REVIEW_LOOPS["draft-review-loop"],
      config: processConfig.draftReviewLoop ?? {}
    },
    {
      defaults: DEFAULT_REVIEW_LOOPS["technical-solution-loop"],
      config: processConfig.solutionReviewLoop ?? {}
    }
  ];
  const loops = [];

  for (const { defaults, config } of loopConfigs) {
    if (!stageIdSet.has(defaults.stageId) || config.enabled === false) {
      continue;
    }

    const routeSequence =
      Array.isArray(config.routeSequence) && config.routeSequence.length > 0
        ? config.routeSequence.map((routeKey: any) => String(routeKey).trim()).filter(Boolean)
        : [...defaults.routeSequence];

    if (routeSequence.length < 2) {
      throw new InputError(
        t(
          runState.locale,
          `review loop(${defaults.stageId}) 至少需要两个 routeKey。`,
          `Review loop(${defaults.stageId}) requires at least two route keys.`
        ),
        {
          code: "cli.run_invalid_review_loop_routes",
          details: {
            stageId: defaults.stageId,
            routeSequence
          }
        }
      );
    }

    loops.push({
      stageId: defaults.stageId,
      routeSequence,
      maxReviewCycles: toPositiveInteger(
        runState.maxReviewCyclesOverride ?? config.maxReviewCycles ?? defaults.maxReviewCycles,
        defaults.maxReviewCycles
      ),
      completionPolicy: resolveLoopCompletionPolicy(
        config.completionPolicy ?? defaults.completionPolicy,
        runState.locale,
        defaults.stageId
      )
    });
  }

  return loops;
}

function resolveProcessModel(runState: any) {
  const automationConfig = runState.resolvedConfig.config.automation ?? {};
  const processConfig = automationConfig.process ?? {};
  const stageDefinitions =
    Array.isArray(processConfig.stageDefinitions) && processConfig.stageDefinitions.length > 0
      ? processConfig.stageDefinitions
      : DEFAULT_PROCESS_STAGES;
  const seenStageIds = new Set();
  const stages = [];

  for (const definition of stageDefinitions) {
    const stageId = String(definition.id ?? "").trim();

    if (!stageId) {
      throw new InputError(
        t(runState.locale, "process.stageDefinitions 中存在空 stage id。", "process.stageDefinitions contains an empty stage id."),
        {
          code: "cli.run_invalid_process_stage",
          details: {
            stage: definition
          }
        }
      );
    }

    if (seenStageIds.has(stageId)) {
      throw new InputError(
        t(runState.locale, `process.stageDefinitions 存在重复阶段：${stageId}`, `Duplicate stage in process.stageDefinitions: ${stageId}`),
        {
          code: "cli.run_duplicate_process_stage",
          details: {
            stageId
          }
        }
      );
    }

    seenStageIds.add(stageId);
    const kind = String(definition.kind ?? "ai").trim();
    const routeKey =
      definition.routeKey === null || definition.routeKey === undefined
        ? kind === "ai"
          ? stageId
          : null
        : String(definition.routeKey).trim();

    stages.push({
      id: stageId,
      kind,
      requiredSurface: definition.requiredSurface ?? kind === "ai",
      routeKey,
      name:
        definition.name && isPlainObject(definition.name)
          ? definition.name
          : {
              "zh-CN": stageId,
              "en-US": stageId
            }
    });
  }

  const reviewLoops = resolveReviewLoops(runState, processConfig, stages);
  const reviewLoopStageIds = new Set<string>(reviewLoops.map((loop: any) => String(loop.stageId)));
  const taskLoopConfig = processConfig.taskLoop ?? {};
  const configuredTaskLoopStageId = String(taskLoopConfig.stageId ?? DEFAULT_TASK_LOOP.stageId).trim();
  const maxReviewCycles = toPositiveInteger(
    runState.maxReviewCyclesOverride ?? taskLoopConfig.maxReviewCycles ?? DEFAULT_TASK_LOOP.maxReviewCycles,
    DEFAULT_TASK_LOOP.maxReviewCycles
  );
  const implementationRouteKey = String(
    taskLoopConfig.implementationRouteKey ?? DEFAULT_TASK_LOOP.implementationRouteKey
  ).trim();
  const codeReviewRouteKey = String(
    taskLoopConfig.codeReviewRouteKey ?? DEFAULT_TASK_LOOP.codeReviewRouteKey
  ).trim();
  let loopStage = stages.find(
    (stage) => stage.id === configuredTaskLoopStageId && stage.kind === "loop"
  ) ?? null;

  if (!loopStage) {
    loopStage = stages.find((stage) => stage.kind === "loop" && !reviewLoopStageIds.has(stage.id)) ?? null;
  }

  if (loopStage && reviewLoopStageIds.has(loopStage.id)) {
    throw new InputError(
      t(
        runState.locale,
        `taskLoop.stageId(${loopStage.id}) 与 review loop 冲突。`,
        `taskLoop.stageId(${loopStage.id}) conflicts with a review loop stage.`
      ),
      {
        code: "cli.run_conflicting_loop_stage",
        details: {
          taskLoopStageId: loopStage.id,
          reviewLoopStageIds: [...reviewLoopStageIds]
        }
      }
    );
  }

  const routeDefinitions = [];

  for (const stage of stages) {
    if (stage.kind !== "ai" || !stage.routeKey) {
      continue;
    }

    routeDefinitions.push({
      routeKey: stage.routeKey,
      stageId: stage.id,
      label: stage.id,
      requiredSurface: stage.requiredSurface
    });
  }

  for (const reviewLoop of reviewLoops) {
    for (const [index, routeKey] of reviewLoop.routeSequence.entries()) {
      routeDefinitions.push({
        routeKey,
        stageId: reviewLoop.stageId,
        label: `${reviewLoop.stageId}:step-${index + 1}`,
        requiredSurface: true
      });
    }
  }

  if (loopStage) {
    routeDefinitions.push({
      routeKey: implementationRouteKey,
      stageId: loopStage.id,
      label: `${loopStage.id}:implementation`,
      requiredSurface: true
    });
    routeDefinitions.push({
      routeKey: codeReviewRouteKey,
      stageId: loopStage.id,
      label: `${loopStage.id}:code-review`,
      requiredSurface: true
    });
  }

  const routeKeySet = new Set();

  for (const route of routeDefinitions) {
    if (routeKeySet.has(route.routeKey)) {
      throw new InputError(
        t(
          runState.locale,
          `routeKey 冲突：${route.routeKey}`,
          `Duplicate routeKey detected: ${route.routeKey}`
        ),
        {
          code: "cli.run_duplicate_route_key",
          details: {
            routeKey: route.routeKey
          }
        }
      );
    }

    routeKeySet.add(route.routeKey);
  }

  return {
    source: runState.processSource,
    stages,
    reviewLoops,
    taskLoop: {
      stageId: loopStage?.id ?? null,
      maxReviewCycles,
      implementationRouteKey,
      codeReviewRouteKey
    },
    routeDefinitions,
    routeKeySet
  };
}

function parseRouteOverrides(rawRouteValues: any, processModel: any, locale: any) {
  const values = Array.isArray(rawRouteValues) ? rawRouteValues : rawRouteValues ? [rawRouteValues] : [];
  const routeOverrides = new Map();

  for (const rawValue of values) {
    const normalized = String(rawValue ?? "").trim();
    const [routeKeyRaw, surfaceRaw, ...rest] = normalized.split("=");
    const routeKey = String(routeKeyRaw ?? "").trim();
    const surface = normalizeSurfaceId(surfaceRaw);

    if (rest.length > 0 || !routeKey || !surface) {
      throw new InputError(
        t(
          locale,
          `--route 参数格式错误：${rawValue}，应为 routeKey=surface`,
          `Invalid --route value: ${rawValue}. Expected routeKey=surface.`
        ),
        {
          code: "cli.run_invalid_route",
          details: {
            route: rawValue
          }
        }
      );
    }

    if (!processModel.routeKeySet.has(routeKey)) {
      throw new InputError(
        t(
          locale,
          `--route 指定了不支持的 routeKey：${routeKey}`,
          `--route references an unsupported routeKey: ${routeKey}`
        ),
        {
          code: "cli.run_invalid_route_key",
          details: {
            routeKey,
            supportedRouteKeys: [...processModel.routeKeySet]
          }
        }
      );
    }

    routeOverrides.set(routeKey, surface);
  }

  return routeOverrides;
}

function buildRoutingPlan(runState: any, processModel: any) {
  const profile = resolveRoutingProfile(
    runState.resolvedConfig.config,
    runState.routingProfile,
    runState.locale
  );
  const automationConfig = runState.resolvedConfig.config.automation ?? {};
  const defaultSurface = normalizeSurfaceId(
    runState.defaultSurfaceOverride ??
      profile.defaultSurface ??
      automationConfig.defaultSurface ??
      runState.resolvedConfig.config.adapters.enabled[0] ??
      "codex"
  );
  const routes = [];

  for (const routeDefinition of processModel.routeDefinitions) {
    let requestedSurface = defaultSurface;
    let source = "default-surface";

    if (runState.routeOverrides.has(routeDefinition.routeKey)) {
      requestedSurface = runState.routeOverrides.get(routeDefinition.routeKey);
      source = "cli";
    } else if (profile.routing?.[routeDefinition.routeKey]) {
      requestedSurface = normalizeSurfaceId(profile.routing[routeDefinition.routeKey]);
      source = "routing-profile";
    } else if (automationConfig.routing?.[routeDefinition.routeKey]) {
      requestedSurface = normalizeSurfaceId(automationConfig.routing[routeDefinition.routeKey]);
      source = "automation-routing";
    }

    routes.push({
      routeKey: routeDefinition.routeKey,
      stageId: routeDefinition.stageId,
      label: routeDefinition.label,
      requiredSurface: routeDefinition.requiredSurface,
      requestedSurface,
      resolvedSurface: requestedSurface,
      source,
      decision: "primary",
      message: null
    });
  }

  return {
    profileId: runState.routingProfile,
    defaultSurface,
    routes
  };
}

function evaluateRoutingDecisions(routingPlan: any, reportsBySurface: any, runState: any) {
  const decisions = [];
  const blocking = [];
  const pausing = [];
  const warnings = [];

  for (const route of routingPlan.routes) {
    const requestedReport = reportsBySurface.get(route.requestedSurface);
    const defaultReport = reportsBySurface.get(routingPlan.defaultSurface);
    const decision = cloneValue(route);

    if (requestedReport?.available) {
      decisions.push(decision);
      continue;
    }

    if (
      route.requestedSurface !== routingPlan.defaultSurface &&
      defaultReport?.available &&
      (!route.requiredSurface || runState.failOnMissingRequiredSurface === false)
    ) {
      decision.resolvedSurface = routingPlan.defaultSurface;
      decision.decision = "fallback";
      decision.message = t(
        runState.locale,
        `路由 ${route.routeKey} 目标入口 ${route.requestedSurface} 不可用，已回退到 ${routingPlan.defaultSurface}。`,
        `Route ${route.routeKey} target ${route.requestedSurface} is unavailable; falling back to ${routingPlan.defaultSurface}.`
      );
      warnings.push({
        id: `run.routing.fallback.${route.routeKey}`,
        stageId: route.stageId,
        severity: "warning",
        message: decision.message,
        target: route.requestedSurface,
        suggestion: t(
          runState.locale,
          "建议修复目标入口，避免长时间依赖回退。",
          "Fix the original target surface to avoid long-term fallback."
        )
      });
      decisions.push(decision);
      continue;
    }

    const requiredSurfaceStrict =
      route.requiredSurface === true && runState.failOnMissingRequiredSurface !== false;

    if (requiredSurfaceStrict && runState.nonInteractive !== true) {
      decision.decision = "pause_for_approval";
      decision.message = t(
        runState.locale,
        `路由 ${route.routeKey} 必须使用入口 ${route.requestedSurface}，当前入口不可用，已暂停等待人工确认。`,
        `Route ${route.routeKey} requires ${route.requestedSurface}, which is unavailable; paused for human approval.`
      );
      pausing.push({
        id: `run.preflight.pause.${route.routeKey}`,
        stageId: route.stageId,
        severity: "error",
        strategy: "pause_for_approval",
        requiresHumanApproval: true,
        message: decision.message,
        target: route.requestedSurface,
        suggestion: requestedReport?.checks
          .filter((check: any) => check.status === "fail" && check.suggestion)
          .map((check: any) => check.suggestion)
          .join(" ")
      });
      decisions.push(decision);
      continue;
    }

    decision.decision = "blocked";
    decision.message = t(
      runState.locale,
      `路由 ${route.routeKey} 需要入口 ${route.requestedSurface}，但 preflight 不可用。`,
      `Route ${route.routeKey} requires ${route.requestedSurface}, but preflight marked it unavailable.`
    );
    blocking.push({
      id: `run.preflight.blocked.${route.routeKey}`,
      stageId: route.stageId,
      severity: "error",
      strategy: "block",
      requiresHumanApproval: false,
      message: decision.message,
      target: route.requestedSurface,
      suggestion: requestedReport?.checks
        .filter((check: any) => check.status === "fail" && check.suggestion)
        .map((check: any) => check.suggestion)
        .join(" ")
    });
    decisions.push(decision);
  }

  return {
    decisions,
    warnings,
    pausing,
    blocking
  };
}

function executePreflight(runState: any, routingPlan: any) {
  const surfaces = new Set([routingPlan.defaultSurface, ...routingPlan.routes.map((route: any) => route.requestedSurface)]);
  const reports = [...surfaces].map((surface) => runSurfacePreflight(surface, runState));
  const reportsBySurface = new Map(reports.map((report) => [report.surface, report]));
  const routingDecision = evaluateRoutingDecisions(routingPlan, reportsBySurface, runState);

  for (const report of reports) {
    if (
      routingDecision.decisions.some(
        (decision) => decision.requestedSurface === report.surface && decision.decision === "fallback"
      )
    ) {
      report.fallbackDecision = "fallback-to-default";
    }
  }

  return {
    enabled: true,
    status:
      routingDecision.blocking.length > 0
        ? "failed"
        : routingDecision.pausing.length > 0
          ? "blocked"
          : "passed",
    reports,
    decisions: routingDecision.decisions,
    warnings: routingDecision.warnings,
    pausing: routingDecision.pausing,
    blocking: routingDecision.blocking
  };
}

function buildRunWorkflowTemplate(processModel: any) {
  return {
    id: "automation-run",
    version: "1",
    kind: "workflow-template",
    meta: {
      name: {
        "zh-CN": "自动化编排执行",
        "en-US": "Automation Orchestration Run"
      },
      description: {
        "zh-CN": "基于 plan/task 产物执行受控自动化编排。",
        "en-US": "Runs controlled automation orchestration against plan/task artifacts."
      }
    },
    execution: {
      mode: "serial",
      allowSkipStages: false,
      stopOnFailure: true
    },
    stages: [
      {
        id: "preflight",
        name: {
          "zh-CN": "入口预检",
          "en-US": "Surface Preflight"
        },
        executor: {
          kind: "internal",
          ref: "run-preflight"
        }
      },
      {
        id: "policy-gate",
        name: {
          "zh-CN": "权限与风险门禁",
          "en-US": "Permission And Risk Gate"
        },
        dependsOn: ["preflight"],
        executor: {
          kind: "internal",
          ref: "run-policy-gate"
        }
      },
      ...processModel.stages.map((stage: any, index: any) => ({
        id: stage.id,
        name: stage.name,
        dependsOn: index === 0 ? ["policy-gate"] : [processModel.stages[index - 1].id],
        executor: {
          kind: "internal",
          ref: `run-${stage.id}`
        }
      }))
    ]
  };
}

function createDispatchResult(runState: any, routeDecision: any, options: AnyRecord = {}) {
  if (routeDecision.decision === "pause_for_approval") {
    return {
      status: "blocked",
      summary: routeDecision.message,
      details: {
        dispatch: {
          routeKey: routeDecision.routeKey,
          stageId: routeDecision.stageId,
          status: "pause_for_approval",
          requestedSurface: routeDecision.requestedSurface,
          resolvedSurface: null
        }
      },
      blockedBy: [`approval:${routeDecision.routeKey}`],
      error: {
        code: "run.route_approval_required",
        message: routeDecision.message
      }
    };
  }

  if (routeDecision.decision === "blocked") {
    return {
      status: "failed",
      summary: routeDecision.message,
      details: {
        dispatch: {
          routeKey: routeDecision.routeKey,
          stageId: routeDecision.stageId,
          status: "blocked",
          requestedSurface: routeDecision.requestedSurface,
          resolvedSurface: null
        }
      },
      error: {
        code: "run.route_blocked",
        message: routeDecision.message
      }
    };
  }

  const dispatchMode = runState.dryRun ? "dry-run" : "dispatch";
  const warnings = [];

  if (routeDecision.decision === "fallback" && routeDecision.message) {
    warnings.push({
      id: `run.dispatch.fallback.${routeDecision.routeKey}`,
      stageId: routeDecision.stageId,
      severity: "warning",
      message: routeDecision.message,
      target: routeDecision.requestedSurface,
      suggestion: t(
        runState.locale,
        "建议恢复原始入口，减少路由回退。",
        "Restore the original surface to reduce routing fallback."
      )
    });
  }

  return {
    status: "passed",
    summary:
      dispatchMode === "dry-run"
        ? t(
            runState.locale,
            `预览路由 ${routeDecision.routeKey} -> ${routeDecision.resolvedSurface}`,
            `Preview route ${routeDecision.routeKey} -> ${routeDecision.resolvedSurface}`
          )
        : t(
            runState.locale,
            `已派发路由 ${routeDecision.routeKey} -> ${routeDecision.resolvedSurface}`,
            `Dispatched route ${routeDecision.routeKey} -> ${routeDecision.resolvedSurface}`
          ),
    details: {
      dispatch: {
        ...cloneValue(routeDecision),
        mode: dispatchMode,
        taskId: options.taskId ?? null,
        cycle: options.cycle ?? null
      }
    },
    warnings,
    outputs: {
      [`route:${routeDecision.routeKey}`]: {
        mode: dispatchMode,
        surface: routeDecision.resolvedSurface,
        taskId: options.taskId ?? null,
        cycle: options.cycle ?? null
      }
    }
  };
}

function createRunHandlers(runState: any, processModel: any, routingPlan: any) {
  const routeDecisionMap = new Map(routingPlan.routes.map((route: any) => [route.routeKey, cloneValue(route)]));

  function getRouteDecision(routeKey: any) {
    const decision = routeDecisionMap.get(routeKey);

    if (!decision) {
      throw new InputError(
        t(runState.locale, `run 找不到路由键：${routeKey}`, `Run could not resolve routeKey: ${routeKey}`),
        {
          code: "cli.run_missing_route_key",
          details: {
            routeKey
          }
        }
      );
    }

    return decision;
  }

  function tryRestoreStageFromCheckpoint(stageId: any) {
    const resumePlan = runState.resumePlan;

    if (!resumePlan || !resumePlan.restoreStageIds.has(stageId)) {
      return null;
    }

    const checkpoint = resumePlan.checkpointByStage.get(stageId);

    if (!checkpoint || checkpoint.status !== "passed") {
      return null;
    }

    return {
      status: "passed",
      summary: t(
        runState.locale,
        `阶段 ${stageId} 已从 checkpoint 恢复。`,
        `Stage ${stageId} restored from checkpoint.`
      ),
      details: {
        ...(checkpoint.details ?? {}),
        checkpointRestore: {
          stageId,
          sourceFile: toRelativePath(runState.cwd, resumePlan.sourceFile),
          sourceExecutionId: resumePlan.sourceExecutionId,
          restoredAt: new Date().toISOString()
        }
      },
      outputs: isPlainObject(checkpoint.outputs) ? cloneValue(checkpoint.outputs) : {}
    };
  }

  function runStageWithCheckpointRecovery(stageId: any, handler: any, stageContext: any) {
    const restored = tryRestoreStageFromCheckpoint(stageId);

    if (restored) {
      return restored;
    }

    return handler(stageContext);
  }

  function handlePreflightStage() {
    if (!runState.preflightEnabled) {
      const skippedPreflight = {
        enabled: false,
        status: "skipped",
        reports: [],
        decisions: routingPlan.routes.map((route: any) => ({
          ...cloneValue(route),
          resolvedSurface: route.requestedSurface,
          decision: "assumed"
        })),
        warnings: [
          {
            id: "run.preflight.skipped",
            stageId: "preflight",
            severity: "warning",
            message: t(
              runState.locale,
              "当前执行跳过 preflight，后续路由可用性由运行时自行承担。",
              "Preflight is skipped for this run; route availability is assumed."
            ),
            target: "preflight",
            suggestion: t(
              runState.locale,
              "建议在 assisted/autonomous 模式下保持 preflight 开启。",
              "Keep preflight enabled in assisted/autonomous modes."
            )
          }
        ],
        pausing: [],
        blocking: []
      };

      for (const decision of skippedPreflight.decisions) {
        routeDecisionMap.set(decision.routeKey, decision);
      }

      return {
        status: "passed",
        summary: t(runState.locale, "preflight 已跳过。", "Preflight was skipped."),
        details: skippedPreflight,
        warnings: skippedPreflight.warnings
      };
    }

    const preflight = executePreflight(runState, routingPlan);

    for (const decision of preflight.decisions) {
      routeDecisionMap.set(decision.routeKey, decision);
    }

    if (preflight.status === "failed") {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          "preflight 失败：存在必需入口不可用的路由。",
          "Preflight failed because one or more required routes are unavailable."
        ),
        details: preflight,
        warnings: preflight.warnings,
        error: {
          code: "run.preflight_failed",
          message: t(
            runState.locale,
            "请按 preflight 提示修复入口可用性后重试。",
            "Follow preflight guidance to restore route availability, then retry."
          )
        }
      };
    }

    if (preflight.status === "blocked") {
      return {
        status: "blocked",
        summary: t(
          runState.locale,
          "preflight 暂停：required-surface 不可用，等待人工确认。",
          "Preflight paused: required surfaces are unavailable and waiting for human approval."
        ),
        details: preflight,
        warnings: preflight.warnings,
        blockedBy: preflight.pausing.map((issue) => issue.id),
        error: {
          code: "run.preflight_approval_required",
          message: t(
            runState.locale,
            "请先修复必需入口可用性，或调整路由策略后重试。",
            "Restore required surface availability or adjust routing policy, then retry."
          )
        }
      };
    }

    return {
      status: "passed",
      summary: t(runState.locale, "preflight 通过。", "Preflight passed."),
      details: preflight,
      warnings: preflight.warnings
    };
  }

  function handlePolicyGateStage() {
    const policy = evaluatePolicyGate(runState, [...routeDecisionMap.values()]);
    runState.policyGateResult = policy;

    if (policy.decision === "block") {
      return {
        status: "failed",
        summary: policy.reason,
        details: {
          policy
        },
        warnings: policy.warnings,
        error: {
          code: "run.policy_blocked",
          message: policy.reason
        }
      };
    }

    if (policy.decision === "pause_for_approval") {
      return {
        status: "blocked",
        summary: policy.reason,
        details: {
          policy
        },
        warnings: [
          ...policy.warnings,
          {
            id: "run.policy.approval-required",
            stageId: "policy-gate",
            severity: "warning",
            message: t(
              runState.locale,
              `请人工确认高风险标签：${policy.missingApprovals.join(", ")}`,
              `Human approval required for high-risk tags: ${policy.missingApprovals.join(", ")}`
            ),
            target: "policy-gate",
            suggestion: t(
              runState.locale,
              "确认后可使用 `--approve-risk <tag>` 重试 run。",
              "After approval, rerun with `--approve-risk <tag>`."
            )
          }
        ],
        blockedBy: policy.missingApprovals.map((tag) => `approval:${tag}`),
        error: {
          code: "run.policy_approval_required",
          message: policy.reason
        }
      };
    }

    return {
      status: "passed",
      summary: policy.reason,
      details: {
        policy
      },
      warnings: policy.warnings,
      outputs: {
        "policy-gate": {
          decision: policy.decision,
          riskTags: policy.riskTags,
          requiredApprovalTags: policy.requiredApprovalTags,
          approvedRiskTags: policy.approvedRiskTags
        }
      }
    };
  }

  function handleRequirementsInputStage() {
    if (runState.inputRef) {
      return {
        status: "passed",
        summary: t(runState.locale, "已读取用户输入需求。", "User requirement input is loaded."),
        details: {
          input: toRelativePath(runState.cwd, runState.inputRef)
        },
        outputs: {
          "requirements-input": {
            source: "cli-input",
            path: toRelativePath(runState.cwd, runState.inputRef)
          }
        }
      };
    }

    if (fs.existsSync(runState.artifactPaths.planFile)) {
      const fallbackPath = toRelativePath(runState.cwd, runState.artifactPaths.planFile);
      return {
        status: "passed",
        summary: t(
          runState.locale,
          "未显式提供 --input，已回退使用 sprint 现有 plan.md。",
          "No --input provided; falling back to existing sprint plan.md."
        ),
        warnings: [
          {
            id: "run.requirements-input.fallback-plan",
            stageId: "requirements-input",
            severity: "warning",
            message: t(
              runState.locale,
              "需求输入阶段回退到已存在 plan.md，建议在新任务启动时显式传入 --input。",
              "Requirements input fell back to existing plan.md; pass --input explicitly for new requests."
            ),
            target: fallbackPath,
            suggestion: t(
              runState.locale,
              "可使用 `repo-ai-governor run --input <requirement-file>` 传入需求。",
              "Use `repo-ai-governor run --input <requirement-file>` to provide requirement input."
            )
          }
        ],
        details: {
          input: fallbackPath
        },
        outputs: {
          "requirements-input": {
            source: "plan-fallback",
            path: fallbackPath
          }
        }
      };
    }

    return {
      status: "failed",
      summary: t(
        runState.locale,
        "需求输入阶段失败：未提供 --input 且未找到 sprint plan.md。",
        "Requirements input failed: no --input provided and sprint plan.md is missing."
      ),
      error: {
        code: "run.requirements_input_missing",
        message: t(
          runState.locale,
          "请提供 `--input`，或先执行 plan 生成基础产物后再运行 run。",
          "Provide `--input`, or run plan first to generate baseline artifacts before running run."
        )
      }
    };
  }

  function handleAiStage(stage: any) {
    if (!stage.routeKey) {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          `阶段 ${stage.id} 缺少 routeKey 配置。`,
          `Stage ${stage.id} is missing routeKey configuration.`
        ),
        error: {
          code: "run.stage_missing_route_key",
          message: t(runState.locale, "请在 automation.process.stageDefinitions 中补齐 routeKey。", "Provide routeKey in automation.process.stageDefinitions.")
        }
      };
    }

    return createDispatchResult(runState, getRouteDecision(stage.routeKey));
  }

  function resolveReviewLoopCompletion(loopConfig: any, cycle: any) {
    if (runState.dryRun) {
      return {
        complete: true,
        source: "dry-run"
      };
    }

    if (loopConfig.completionPolicy === "max-cycles") {
      return {
        complete: cycle >= loopConfig.maxReviewCycles,
        source: "max-cycles"
      };
    }

    return {
      complete: true,
      source: "first-cycle"
    };
  }

  function handleReviewLoopStage(loopConfig: any) {
    const cycles = [];
    let resolved = false;
    let resolvedBy = null;

    for (let cycle = 1; cycle <= loopConfig.maxReviewCycles; cycle += 1) {
      const stepDispatches = [];
      const cycleWarnings = [];

      for (const routeKey of loopConfig.routeSequence) {
        const dispatch = createDispatchResult(runState, getRouteDecision(routeKey), {
          cycle
        });

        if (dispatch.status !== "passed") {
          return dispatch;
        }

        stepDispatches.push(dispatch.details?.dispatch ?? null);
        cycleWarnings.push(...(dispatch.warnings ?? []));
      }

      const completion = resolveReviewLoopCompletion(loopConfig, cycle);

      cycles.push({
        cycle,
        steps: stepDispatches,
        warnings: cycleWarnings,
        completion
      });

      if (completion.complete) {
        resolved = true;
        resolvedBy = completion.source;
        break;
      }
    }

    if (!resolved) {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          `${loopConfig.stageId} 未在最大循环轮次内完成。`,
          `${loopConfig.stageId} did not complete within max review cycles.`
        ),
        details: {
          loop: {
            maxReviewCycles: loopConfig.maxReviewCycles,
            completionPolicy: loopConfig.completionPolicy,
            resolved,
            resolvedBy,
            cycles
          }
        },
        error: {
          code: "run.review_loop_unresolved",
          message: t(
            runState.locale,
            "请调整评审策略或补齐人工复核信号后重试。",
            "Adjust review strategy or provide verification signal before retrying."
          )
        }
      };
    }

    return {
      status: "passed",
      summary: t(
        runState.locale,
        `${loopConfig.stageId} 完成，执行轮次 ${cycles.length}。`,
        `${loopConfig.stageId} completed in ${cycles.length} cycle(s).`
      ),
      details: {
        loop: {
          maxReviewCycles: loopConfig.maxReviewCycles,
          completionPolicy: loopConfig.completionPolicy,
          resolved,
          resolvedBy,
          cycles
        }
      },
      outputs: {
        [`${loopConfig.stageId}-result`]: {
          resolved,
          resolvedBy,
          cycleCount: cycles.length
        }
      }
    };
  }

  function handleTaskBreakdownStage(stageContext: any) {
    const stage = processModel.stages.find((candidate: any) => candidate.id === "task-breakdown");
    const dispatchResult: AnyRecord = stage?.routeKey
      ? createDispatchResult(runState, getRouteDecision(stage.routeKey))
      : {
          status: "passed",
          summary: t(runState.locale, "任务拆解阶段无需派发入口。", "Task breakdown does not require surface dispatch."),
          warnings: [],
          details: {}
        };

    if (dispatchResult.status !== "passed") {
      return dispatchResult;
    }

    const breakdown = buildTaskBreakdownContext(runState);
    const warnings = [...(dispatchResult.warnings ?? [])];

    if (!breakdown.taskCsvExists) {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          "任务拆解阶段失败：未找到 tasks.csv。",
          "Task breakdown failed: tasks.csv is missing."
        ),
        details: {
          dispatch: dispatchResult.details?.dispatch ?? null
        },
        error: {
          code: "run.task_breakdown_missing_tasks_csv",
          message: t(
            runState.locale,
            "请先执行 `repo-ai-governor plan` 生成 tasks/checklist/tasks.csv/TK-xxx.md 产物。",
            "Run `repo-ai-governor plan` first to generate tasks/checklist/tasks.csv/TK-xxx.md artifacts."
          )
        }
      };
    }

    if (!breakdown.checklistExists) {
      warnings.push({
        id: "run.task-breakdown.missing-checklist",
        stageId: "task-breakdown",
        severity: "warning",
        message: t(runState.locale, "未找到 checklist.md。", "checklist.md is missing."),
        target: toRelativePath(runState.cwd, runState.artifactPaths.checklistFile),
        suggestion: t(runState.locale, "建议补齐 checklist 以保持任务记录一致。", "Add checklist to keep task records consistent.")
      });
    }

    if (breakdown.ledger.length === 0) {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          "任务拆解阶段失败：tasks.csv 中没有可执行任务。",
          "Task breakdown failed: tasks.csv does not contain executable tasks."
        ),
        details: {
          dispatch: dispatchResult.details?.dispatch ?? null
        },
        error: {
          code: "run.task_breakdown_empty_ledger",
          message: t(runState.locale, "请先通过 plan 生成并确认任务拆解。", "Generate and confirm task breakdown through plan first.")
        }
      };
    }

    const taskQueue = {
      total: breakdown.ledger.length,
      pending: breakdown.pending.map((task) => ({
        taskId: task.taskId,
        title: task.title,
        status: task.status
      })),
      completed: breakdown.completed.map((task) => ({
        taskId: task.taskId,
        title: task.title,
        status: task.status
      })),
      allTaskIds: breakdown.ledger.map((task) => task.taskId)
    };

    for (const task of breakdown.ledger) {
      if (!breakdown.taskCardIds.has(task.taskId)) {
        warnings.push({
          id: `run.task-breakdown.missing-task-card.${task.taskId.toLowerCase()}`,
          stageId: "task-breakdown",
          severity: "warning",
          message: t(
            runState.locale,
            `任务 ${task.taskId} 在 tasks.csv 中存在，但未找到对应任务卡文件。`,
            `Task ${task.taskId} exists in tasks.csv but no matching task card file was found.`
          ),
          target: toRelativePath(runState.cwd, runState.artifactPaths.tasksRoot),
          suggestion: t(runState.locale, "建议补齐对应 TK-xxx.md 文件。", "Create the matching TK-xxx.md task file.")
        });
      }
    }

    return {
      status: "passed",
      summary: t(
        runState.locale,
        `任务拆解读取完成：总任务 ${taskQueue.total}，待执行 ${taskQueue.pending.length}。`,
        `Task breakdown loaded: ${taskQueue.total} total task(s), ${taskQueue.pending.length} pending.`
      ),
      details: {
        dispatch: dispatchResult.details?.dispatch ?? null,
        queue: taskQueue
      },
      warnings,
      outputs: {
        "task-queue": taskQueue
      }
    };
  }

  function handleTaskLoopStage(stageContext: any) {
    const queue = stageContext.artifacts["task-queue"] ?? buildTaskBreakdownContext(runState);
    const pendingTasks = Array.isArray(queue.pending) ? queue.pending : [];

    if (pendingTasks.length === 0) {
      return {
        status: "passed",
        summary: t(
          runState.locale,
          "任务开发评审循环跳过：当前没有待执行任务。",
          "Task delivery loop skipped because there are no pending tasks."
        ),
        details: {
          loop: {
            maxReviewCycles: processModel.taskLoop.maxReviewCycles,
            processedTasks: 0,
            unresolvedTasks: []
          }
        }
      };
    }

    const reviewIndex = buildReviewStatusIndex(runState.artifactPaths.codeReviewRoot);
    const completionStatuses = new Set(runState.taskCompletionStatuses.map(normalizeTaskStatus));
    const taskResults = [];
    const unresolvedTasks = [];

    for (const pendingTask of pendingTasks) {
      const taskId = normalizeTaskId(pendingTask.taskId);
      const taskSnapshot = {
        taskId,
        title: pendingTask.title ?? "",
        status: normalizeTaskStatus(pendingTask.status)
      };
      const cycles = [];
      let resolved = false;
      let resolvedBy = null;

      for (let cycle = 1; cycle <= processModel.taskLoop.maxReviewCycles; cycle += 1) {
        const implementationRoute = getRouteDecision(processModel.taskLoop.implementationRouteKey);
        const codeReviewRoute = getRouteDecision(processModel.taskLoop.codeReviewRouteKey);
        const implementationDispatch = createDispatchResult(runState, implementationRoute, {
          taskId,
          cycle
        });
        const codeReviewDispatch = createDispatchResult(runState, codeReviewRoute, {
          taskId,
          cycle
        });

        if (implementationDispatch.status !== "passed") {
          return implementationDispatch;
        }

        if (codeReviewDispatch.status !== "passed") {
          return codeReviewDispatch;
        }

        const cycleWarnings = [
          ...(implementationDispatch.warnings ?? []),
          ...(codeReviewDispatch.warnings ?? [])
        ];

        let completion = {
          complete: false,
          source: "none"
        };

        if (runState.dryRun) {
          completion = {
            complete: true,
            source: "dry-run"
          };
        } else {
          completion = resolveTaskCompletion(taskSnapshot, reviewIndex, completionStatuses);
        }

        cycles.push({
          cycle,
          implementation: implementationDispatch.details?.dispatch ?? null,
          codeReview: codeReviewDispatch.details?.dispatch ?? null,
          warnings: cycleWarnings,
          completion
        });

        if (completion.complete) {
          resolved = true;
          resolvedBy = completion.source;
          break;
        }
      }

      const taskResult = {
        taskId,
        title: taskSnapshot.title,
        initialStatus: taskSnapshot.status,
        resolved,
        resolvedBy,
        cycles
      };

      taskResults.push(taskResult);

      if (!resolved) {
        unresolvedTasks.push(taskId);
      }
    }

    const warnings = [];

    if (!runState.dryRun && unresolvedTasks.length > 0) {
      warnings.push({
        id: "run.task-loop.unresolved",
        stageId: processModel.taskLoop.stageId,
        severity: "warning",
        message: t(
          runState.locale,
          `以下任务在最大循环轮次内仍未收敛：${unresolvedTasks.join(", ")}`,
          `The following tasks did not converge within max review cycles: ${unresolvedTasks.join(", ")}`
        ),
        target: toRelativePath(runState.cwd, runState.artifactPaths.taskCsvFile),
        suggestion: t(
          runState.locale,
          "请更新任务状态或补齐 resolved_review 文件后重试 run。",
          "Update task status or add resolved_review files, then rerun."
        )
      });
    }

    if (!runState.dryRun && unresolvedTasks.length > 0) {
      return {
        status: "failed",
        summary: t(
          runState.locale,
          `任务开发评审循环失败：${unresolvedTasks.length} 个任务未在限制轮次内完成。`,
          `Task delivery loop failed: ${unresolvedTasks.length} task(s) did not complete within the cycle limit.`
        ),
        warnings,
        details: {
          loop: {
            maxReviewCycles: processModel.taskLoop.maxReviewCycles,
            processedTasks: taskResults.length,
            unresolvedTasks,
            taskResults
          }
        },
        error: {
          code: "run.task_loop_unresolved",
          message: t(
            runState.locale,
            "请按 review 结论继续修复并更新任务台账后再重试。",
            "Apply review fixes and update task records before retrying."
          )
        }
      };
    }

    return {
      status: "passed",
      summary: t(
        runState.locale,
        `任务开发评审循环完成：处理 ${taskResults.length} 个任务。`,
        `Task delivery loop completed for ${taskResults.length} task(s).`
      ),
      warnings,
      details: {
        loop: {
          maxReviewCycles: processModel.taskLoop.maxReviewCycles,
          processedTasks: taskResults.length,
          unresolvedTasks,
          taskResults
        }
      },
      outputs: {
        "task-loop-result": {
          processedTasks: taskResults.length,
          unresolvedTasks
        }
      }
    };
  }

  const handlers: Record<string, (stageContext: any) => AnyRecord> = {
    preflight: (stageContext: any) =>
      runStageWithCheckpointRecovery("preflight", () => handlePreflightStage(), stageContext),
    "policy-gate": (stageContext: any) =>
      runStageWithCheckpointRecovery("policy-gate", () => handlePolicyGateStage(), stageContext)
  };
  const reviewLoopByStageId = new Map(
    processModel.reviewLoops.map((loopConfig: any) => [loopConfig.stageId, loopConfig])
  );

  for (const stage of processModel.stages) {
    if (stage.kind === "system" && stage.id === "requirements-input") {
      handlers[stage.id] = (stageContext: any) =>
        runStageWithCheckpointRecovery(stage.id, () => handleRequirementsInputStage(), stageContext);
      continue;
    }

    if (stage.kind === "loop" && stage.id === processModel.taskLoop.stageId) {
      handlers[stage.id] = (stageContext: any) =>
        runStageWithCheckpointRecovery(stage.id, handleTaskLoopStage, stageContext);
      continue;
    }

    if (stage.kind === "loop" && reviewLoopByStageId.has(stage.id)) {
      handlers[stage.id] = (stageContext: any) =>
        runStageWithCheckpointRecovery(
          stage.id,
          () => handleReviewLoopStage(reviewLoopByStageId.get(stage.id)),
          stageContext
        );
      continue;
    }

    if (stage.id === "task-breakdown") {
      handlers[stage.id] = (stageContext: any) =>
        runStageWithCheckpointRecovery(stage.id, handleTaskBreakdownStage, stageContext);
      continue;
    }

    if (stage.kind === "ai") {
      handlers[stage.id] = (stageContext: any) =>
        runStageWithCheckpointRecovery(stage.id, () => handleAiStage(stage), stageContext);
      continue;
    }

    handlers[stage.id] = (stageContext: any) =>
      runStageWithCheckpointRecovery(
        stage.id,
        () => ({
          status: "passed",
          summary: t(
            runState.locale,
            `阶段 ${stage.id} 已跳过（无专用处理逻辑）。`,
            `Stage ${stage.id} skipped because no specialized handler is defined.`
          ),
          details: {
            stageId: stage.id
          }
        }),
        stageContext
      );
  }

  return handlers;
}

function flattenWorkflowWarnings(workflowResult: any) {
  return workflowResult.stages.flatMap((stageResult: any) => stageResult.warnings ?? []);
}

function buildRunSummary(workflowResult: any, preflightStatus: any) {
  const stageWarnings = flattenWorkflowWarnings(workflowResult);
  const failedStageCount = workflowResult.stages.filter((stageResult: any) => stageResult.status === "failed").length;
  const blockedStageCount = workflowResult.stages.filter((stageResult: any) => stageResult.status === "blocked").length;
  const errors = failedStageCount + blockedStageCount;
  const warnings = stageWarnings.length;
  const status = errors > 0 ? "fail" : warnings > 0 ? "warn" : "pass";
  let exitCode: number = EXIT_CODES.success;

  if (errors > 0) {
    exitCode =
      preflightStatus === "failed" ? EXIT_CODES.environmentError : EXIT_CODES.businessCheckFailed;
  }

  return {
    status,
    errors,
    warnings,
    passed: workflowResult.stages.filter((stageResult: any) => stageResult.status === "passed").length,
    exitCode
  };
}

function renderWorkflowStage(stageResult: any) {
  return {
    id: stageResult.id,
    status: stageResult.status,
    summary: stageResult.summary,
    dispatch: stageResult.details?.dispatch ?? null,
    loop: stageResult.details?.loop ?? null,
    blockedBy: stageResult.blockedBy ?? [],
    warnings: stageResult.warnings ?? []
  };
}

function buildRunPayload(runState: any, processModel: any, routingPlan: any, workflowResult: any, summary: any) {
  const preflightStage = workflowResult.stages.find((stage: any) => stage.id === "preflight");
  const preflightDetails = preflightStage?.details ?? {
    enabled: false,
    status: "unknown",
    reports: [],
    decisions: [],
    warnings: [],
    pausing: [],
    blocking: []
  };
  const policyStage = workflowResult.stages.find((stage: any) => stage.id === "policy-gate");
  const policyDetails = policyStage?.details?.policy ?? runState.policyGateResult ?? {
    decision: "unknown",
    reason: null,
    permissionTier: resolvePermissionTier(runState.permissions),
    nonInteractive: runState.nonInteractive,
    inputRef: runState.policyInputRef ? toRelativePath(runState.cwd, runState.policyInputRef) : null,
    requiredActions: [],
    permissions: cloneValue(runState.permissions),
    permissionViolations: [],
    riskTags: [],
    riskDetections: [],
    requiredApprovalTags: [],
    approvedRiskTags: [],
    missingApprovals: [],
    requiresHumanApproval: false,
    warnings: []
  };
  const taskLoopStage = processModel.taskLoop.stageId
    ? workflowResult.stages.find((stage: any) => stage.id === processModel.taskLoop.stageId)
    : null;
  const stageCheckpoints = buildStageCheckpoints(workflowResult);
  const keyActions = buildRunKeyActions(workflowResult);
  const failureReason =
    workflowResult.failure?.stageResult?.summary ??
    workflowResult.stages.find((stage: any) => stage.status === "failed" || stage.status === "blocked")?.summary ??
    null;
  const auditRecordRef = runState.auditEnabled
    ? toRelativePath(runState.cwd, runState.auditPaths.recordFile)
    : null;
  const latestAuditRef = runState.auditEnabled
    ? toRelativePath(runState.cwd, runState.auditPaths.latestFile)
    : null;

  return {
    kind: RUN_AUDIT_KIND,
    schemaVersion: RUN_AUDIT_SCHEMA_VERSION,
    command: "run",
    status: summary.status,
    generatedAt: runState.executionFinishedAt,
    executionId: runState.executionId,
    execution: {
      id: runState.executionId,
      startedAt: runState.executionStartedAt,
      finishedAt: runState.executionFinishedAt,
      durationMs: runState.executionDurationMs
    },
    mode: runState.mode,
    dryRun: runState.dryRun,
    locale: runState.locale,
    cwd: runState.cwd,
    configFile: runState.resolvedConfig.paths.configFile,
    currentProject: runState.resolvedConfig.config.execution.currentProject,
    currentSprint: runState.resolvedConfig.config.execution.currentSprint,
    process: {
      source: processModel.source,
      stages: processModel.stages.map((stage: any) => ({
        id: stage.id,
        kind: stage.kind,
        routeKey: stage.routeKey,
        requiredSurface: stage.requiredSurface
      })),
      reviewLoops: processModel.reviewLoops.map((loopConfig: any) => ({
        stageId: loopConfig.stageId,
        routeSequence: loopConfig.routeSequence,
        maxReviewCycles: loopConfig.maxReviewCycles,
        completionPolicy: loopConfig.completionPolicy
      })),
      taskLoop: {
        ...cloneValue(processModel.taskLoop),
        completionStatuses: runState.taskCompletionStatuses
      },
      snapshot: buildCompiledProcessSnapshot(
        processModel,
        {
          profileId: routingPlan.profileId,
          defaultSurface: routingPlan.defaultSurface,
          routes: preflightDetails.decisions ?? routingPlan.routes
        },
        runState.workflowTemplate
      )
    },
    routing: {
      profile: routingPlan.profileId,
      defaultSurface: routingPlan.defaultSurface,
      routes: preflightDetails.decisions ?? []
    },
    preflight: {
      enabled: preflightDetails.enabled ?? false,
      status: preflightDetails.status ?? "unknown",
      reports: preflightDetails.reports ?? [],
      pausing: preflightDetails.pausing ?? [],
      blocking: preflightDetails.blocking ?? [],
      warnings: preflightDetails.warnings ?? []
    },
    policy: {
      stageStatus: policyStage?.status ?? "skipped",
      decision: policyDetails.decision ?? "unknown",
      reason: policyDetails.reason ?? null,
      permissionTier: policyDetails.permissionTier ?? resolvePermissionTier(runState.permissions),
      nonInteractive: policyDetails.nonInteractive ?? runState.nonInteractive,
      inputRef: policyDetails.inputRef ?? null,
      requiredActions: policyDetails.requiredActions ?? [],
      permissions: policyDetails.permissions ?? cloneValue(runState.permissions),
      permissionViolations: policyDetails.permissionViolations ?? [],
      riskTags: policyDetails.riskTags ?? [],
      riskDetections: policyDetails.riskDetections ?? [],
      requiredApprovalTags: policyDetails.requiredApprovalTags ?? [],
      approvedRiskTags: policyDetails.approvedRiskTags ?? [],
      missingApprovals: policyDetails.missingApprovals ?? [],
      requiresHumanApproval: policyDetails.requiresHumanApproval ?? false,
      warnings: policyDetails.warnings ?? []
    },
    taskLoop: taskLoopStage?.details?.loop ?? null,
    workflow: {
      status: workflowResult.status,
      selectedStageIds: workflowResult.selectedStageIds,
      summary: workflowResult.summary,
      stages: workflowResult.stages.map(renderWorkflowStage),
      failure: workflowResult.failure
        ? {
            stageId: workflowResult.failure.stageId,
            message: workflowResult.failure.stageResult?.summary ?? null,
            code: workflowResult.failure.stageResult?.error?.code ?? null
          }
        : null
    },
    checkpoints: {
      stages: stageCheckpoints
    },
    auditTrail: {
      policyDecision: policyDetails.decision ?? "unknown",
      stageStatuses: stageCheckpoints.map((checkpoint: any) => ({
        id: checkpoint.id,
        status: checkpoint.status
      })),
      keyActions,
      failureReason
    },
    audit: {
      enabled: runState.auditEnabled,
      recordFile: auditRecordRef,
      latestFile: latestAuditRef
    },
    reportFile: auditRecordRef,
    summary
  };
}

function writeRunSummary(logger: any, payload: any, format: any) {
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# run",
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "执行编号", "Execution ID")}: \`${payload.executionId}\``,
        `- ${t(locale, "模式", "Mode")}: \`${payload.mode}\``,
        `- ${t(locale, "流程来源", "Process source")}: \`${payload.process?.source ?? "default"}\``,
        `- ${t(locale, "项目", "Project")}: \`${payload.currentProject}\``,
        `- Sprint: \`${payload.currentSprint}\``,
        `- ${t(locale, "预检状态", "Preflight status")}: \`${payload.preflight.status}\``,
        `- ${t(locale, "审计记录", "Audit record")}: \`${payload.audit?.recordFile ?? "-"}\``,
        `- ${t(locale, "流程摘要", "Workflow summary")}: \`${JSON.stringify(payload.workflow.summary)}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  if (payload.status === "pass") {
    logger.success(t(locale, "自动化编排执行通过", "Automation run passed"));
  } else if (payload.status === "warn") {
    logger.warn(t(locale, "自动化编排执行完成（含告警）", "Automation run completed with warnings"));
  } else {
    logger.error(t(locale, "自动化编排执行失败", "Automation run failed"));
  }

  logger.keyValue(t(locale, "模式", "Mode"), payload.mode);
  logger.keyValue(t(locale, "执行编号", "Execution ID"), payload.executionId);
  logger.keyValue(t(locale, "流程来源", "Process source"), payload.process?.source ?? "default");
  logger.keyValue(t(locale, "项目", "Project"), payload.currentProject);
  logger.keyValue("Sprint", payload.currentSprint);
  logger.keyValue(t(locale, "路由档", "Routing profile"), payload.routing.profile);
  logger.keyValue(t(locale, "默认入口", "Default surface"), payload.routing.defaultSurface);
  logger.keyValue(t(locale, "预检状态", "Preflight status"), payload.preflight.status);
  logger.keyValue(t(locale, "权限层级", "Permission tier"), payload.policy.permissionTier);
  logger.keyValue(t(locale, "门禁决策", "Policy decision"), payload.policy.decision);
  logger.keyValue(t(locale, "审计记录", "Audit record"), payload.audit?.recordFile ?? "-");
  logger.keyValue(t(locale, "流程摘要", "Workflow summary"), JSON.stringify(payload.workflow.summary));

  if (payload.taskLoop) {
    logger.keyValue(
      t(locale, "任务循环", "Task loop"),
      JSON.stringify({
        processedTasks: payload.taskLoop.processedTasks,
        unresolvedTasks: payload.taskLoop.unresolvedTasks
      })
    );
  }

  for (const stage of payload.workflow.stages) {
    const dispatchSurface = stage.dispatch?.resolvedSurface ?? "-";
    logger.keyValue(`Stage ${stage.id}`, `${stage.status}: ${dispatchSurface}`);
  }

  for (const block of payload.preflight.blocking) {
    logger.error(`${block.stageId}: ${block.message}`);
    if (block.suggestion) {
      logger.info(`${t(locale, "建议", "Suggestion")}: ${block.suggestion}`);
    }
  }

  for (const pause of payload.preflight.pausing ?? []) {
    logger.warn(`${pause.stageId}: ${pause.message}`);
    if (pause.suggestion) {
      logger.info(`${t(locale, "建议", "Suggestion")}: ${pause.suggestion}`);
    }
  }
}

function writeProcessExplainSummary(logger: any, payload: any, format: any) {
  const locale = normalizeLocale(payload.locale);

  if (format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (format === "markdown") {
    logger.raw(
      [
        "# run process",
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "模式", "Mode")}: \`${payload.mode}\``,
        `- ${t(locale, "流程来源", "Process source")}: \`${payload.process.source}\``,
        `- ${t(locale, "解释模式", "Explain mode")}: \`${payload.explainProcess}\``,
        `- ${t(locale, "校验模式", "Validate mode")}: \`${payload.validateProcess}\``,
        `- ${t(locale, "路由档", "Routing profile")}: \`${payload.process.snapshot.routing.profile ?? "-"}\``,
        `- ${t(locale, "默认入口", "Default surface")}: \`${payload.process.snapshot.routing.defaultSurface ?? "-"}\``,
        "",
        `## ${t(locale, "阶段顺序", "Stage order")}`,
        "",
        payload.process.snapshot.workflow.stageOrder
          .map((stageId: any, index: any) => `${index + 1}. \`${stageId}\``)
          .join("\n"),
        "",
        `## ${t(locale, "任务循环", "Task loop")}`,
        "",
        `- stageId: \`${payload.process.snapshot.taskLoop.stageId ?? "-"}\``,
        `- implementationRouteKey: \`${payload.process.snapshot.taskLoop.implementationRouteKey ?? "-"}\``,
        `- codeReviewRouteKey: \`${payload.process.snapshot.taskLoop.codeReviewRouteKey ?? "-"}\``,
        `- maxReviewCycles: \`${payload.process.snapshot.taskLoop.maxReviewCycles ?? "-"}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  logger.success(
    payload.validateProcess
      ? t(locale, "流程配置校验通过", "Process configuration validation passed")
      : t(locale, "流程解释已生成", "Process explanation generated")
  );
  logger.keyValue(t(locale, "流程来源", "Process source"), payload.process.source);
  logger.keyValue(
    t(locale, "阶段数量", "Stage count"),
    String(payload.process.snapshot.stages.length)
  );
  logger.keyValue(
    t(locale, "Review loops", "Review loops"),
    String(payload.process.snapshot.reviewLoops.length)
  );
  logger.keyValue(
    t(locale, "Task loop stage", "Task loop stage"),
    payload.process.snapshot.taskLoop.stageId ?? "-"
  );
  logger.keyValue(
    t(locale, "路由档", "Routing profile"),
    payload.process.snapshot.routing.profile ?? "-"
  );
}

function buildRunState(commandContext: any): AnyRecord {
  const cwd = path.resolve(commandContext.globalOptions.cwd ?? process.cwd());
  const resolvedConfig = loadResolvedConfig({
    cwd,
    configPath: commandContext.globalOptions.config,
    cliOverrides: {
      ...commandContext.globalOptions,
      ...commandContext.commandOptions
    }
  });
  const locale = normalizeLocale(
    commandContext.globalOptions.locale ?? resolvedConfig.config.standards.locales?.default ?? "zh-CN"
  );
  const automationConfig = (resolvedConfig.config.automation ?? {}) as AnyRecord;
  const mode = commandContext.commandOptions.mode ?? automationConfig.mode ?? "assisted";
  const explainProcess = commandContext.commandOptions.explainProcess === true;
  const validateProcess = commandContext.commandOptions.validateProcess === true;

  if (!RUN_MODES.has(mode)) {
    throw new InputError(t(locale, `不支持的执行模式：${mode}`, `Unsupported run mode: ${mode}`), {
      code: "cli.run_invalid_mode",
      details: {
        mode,
        supportedModes: [...RUN_MODES]
      }
    });
  }

  const preflightEnabled =
    commandContext.commandOptions.skipPreflight === true
      ? false
      : (automationConfig.preflight?.enabled ?? true);
  const failOnMissingRequiredSurface =
    automationConfig.preflight?.failOnMissingRequiredSurface ?? true;
  const artifactPaths = buildRunArtifactPaths(cwd, resolvedConfig, locale);
  const inputRef = commandContext.commandOptions.input
    ? path.resolve(cwd, commandContext.commandOptions.input)
    : null;

  if (inputRef && !fs.existsSync(inputRef)) {
    throw new InputError(
      t(locale, `未找到 run 输入文件：${inputRef}`, `Run input file not found: ${inputRef}`),
      {
        code: "cli.run_input_missing",
        details: {
          inputRef
        }
      }
    );
  }

  const taskCompletionStatuses = Array.isArray(
    automationConfig.taskLoop?.completionStatuses
  )
    ? automationConfig.taskLoop.completionStatuses.map(normalizeTaskStatus)
    : [...DEFAULT_TASK_COMPLETION_STATUSES];
  const policyInputRef =
    inputRef ?? (fs.existsSync(artifactPaths.planFile) ? artifactPaths.planFile : null);
  const automationPermissions = {
    ...(automationConfig.permissions ?? {})
  };
  const requiredApprovalTags = new Set(
    parseRiskTagList(automationConfig.gates?.requireApprovalFor ?? [])
  );
  const approvedRiskTags = new Set(parseRiskTagList(commandContext.commandOptions.approveRisk));
  const resumeFromPath = commandContext.commandOptions.resumeFrom
    ? path.resolve(cwd, commandContext.commandOptions.resumeFrom)
    : null;
  const resumeStageOverride = commandContext.commandOptions.resumeStage
    ? String(commandContext.commandOptions.resumeStage).trim()
    : null;
  const executionStartedAtDate = new Date();
  const executionId = createRunExecutionId(executionStartedAtDate);
  const auditEnabled = automationConfig.audit?.enabled !== false;
  const auditPaths = buildRunAuditPaths(cwd, resolvedConfig, executionId);
  const processSource = resolveProcessSourceFromConfigFile(resolvedConfig.paths.configFile);

  if (resumeFromPath && !fs.existsSync(resumeFromPath)) {
    throw new InputError(
      t(
        locale,
        `未找到恢复来源文件：${resumeFromPath}`,
        `Resume source file not found: ${resumeFromPath}`
      ),
      {
        code: "cli.run_resume_source_missing",
        details: {
          resumeFrom: resumeFromPath
        }
      }
    );
  }

  if (resumeStageOverride && !resumeFromPath) {
    throw new InputError(
      t(
        locale,
        "--resume-stage 需要与 --resume-from 一起使用。",
        "--resume-stage requires --resume-from."
      ),
      {
        code: "cli.run_resume_stage_without_source",
        details: {
          resumeStage: resumeStageOverride
        }
      }
    );
  }

  if ((explainProcess || validateProcess) && (resumeFromPath || resumeStageOverride)) {
    throw new InputError(
      t(
        locale,
        "--explain-process/--validate-process 不能与恢复参数同时使用。",
        "--explain-process/--validate-process cannot be used with resume options."
      ),
      {
        code: "cli.run_process_only_mode_conflict",
        details: {
          explainProcess,
          validateProcess,
          resumeFromPath,
          resumeStageOverride
        }
      }
    );
  }

  return {
    cwd,
    locale,
    mode,
    dryRun: commandContext.globalOptions.dryRun === true,
    nonInteractive: commandContext.globalOptions.nonInteractive === true,
    preflightEnabled,
    failOnMissingRequiredSurface,
    routingProfile:
      commandContext.commandOptions.routingProfile ??
      automationConfig.routingProfile ??
      "multi-ai-dev-review",
    defaultSurfaceOverride: commandContext.commandOptions.defaultSurface
      ? normalizeSurfaceId(commandContext.commandOptions.defaultSurface)
      : null,
    rawRouteOverrides: commandContext.commandOptions.route,
    maxReviewCyclesOverride: commandContext.commandOptions.maxReviewCycles
      ? Number(commandContext.commandOptions.maxReviewCycles)
      : null,
    executionId,
    executionStartedAt: executionStartedAtDate.toISOString(),
    executionFinishedAt: null,
    executionDurationMs: null,
    auditEnabled,
    auditPaths,
    processSource,
    explainProcess,
    validateProcess,
    resumeFromPath,
    resumeStageOverride,
    resumePlan: null,
    inputRef,
    policyInputRef,
    policyInputContent: readTextFileIfExists(policyInputRef),
    permissions: automationPermissions,
    approvalPolicy: {
      requiredTags: requiredApprovalTags,
      approvedTags: approvedRiskTags
    },
    taskCompletionStatuses,
    surfaceDefinitions: automationConfig.surfaces ?? {},
    resolvedConfig,
    artifactPaths,
    slotRuntime: buildSlotRuntime({
      config: resolvedConfig.config,
      slotDefinitions: resolvedConfig.slotDefinitions as any
    })
  };
}

export async function executeRunCommand(commandContext: any, logger: any) {
  const runState: AnyRecord = buildRunState(commandContext);
  const processModel = resolveProcessModel(runState);
  runState.routeOverrides = parseRouteOverrides(runState.rawRouteOverrides, processModel, runState.locale);
  const routingPlan = buildRoutingPlan(runState, processModel);
  const workflowTemplate = buildRunWorkflowTemplate(processModel);
  runState.workflowTemplate = workflowTemplate;

  if (runState.explainProcess || runState.validateProcess) {
    const payload = buildProcessExplainPayload(runState, processModel, routingPlan, workflowTemplate, {
      status: "pass"
    });
    writeProcessExplainSummary(logger, payload, commandContext.format);
    return EXIT_CODES.success;
  }

  runState.resumePlan = resolveResumePlan(runState, workflowTemplate);
  const workflowResult = (await executeWorkflow({
    template: workflowTemplate as unknown as ExecuteWorkflowOptions["template"],
    handlers: createRunHandlers(runState, processModel, routingPlan),
    slotRuntime: runState.slotRuntime,
    metadata: {
      command: "run",
      mode: runState.mode,
      dryRun: runState.dryRun,
      currentProject: runState.resolvedConfig.config.execution.currentProject,
      currentSprint: runState.resolvedConfig.config.execution.currentSprint,
      language: runState.resolvedConfig.config.project.language,
      framework: runState.resolvedConfig.config.project.framework
    }
  })) as AnyRecord;
  const finishedAt = new Date();
  runState.executionFinishedAt = finishedAt.toISOString();
  runState.executionDurationMs =
    finishedAt.getTime() - new Date(runState.executionStartedAt).getTime();
  const preflightStage = (workflowResult.stages as AnyRecord[]).find((stage) => stage.id === "preflight");
  const preflightStatus = preflightStage?.details?.status ?? "unknown";
  const summary: AnyRecord = buildRunSummary(workflowResult, preflightStatus);
  const payload: AnyRecord = buildRunPayload(runState, processModel, routingPlan, workflowResult, summary);
  payload.recovery = buildRunRecoveryMetadata(
    runState,
    payload,
    payload.audit?.recordFile ?? null
  );
  const auditWriteResult = writeRunAuditRecord(runState, payload);

  if (auditWriteResult) {
    payload.audit = {
      ...payload.audit,
      ...auditWriteResult
    };
    payload.reportFile = auditWriteResult.recordFile;
    payload.recovery = buildRunRecoveryMetadata(runState, payload, auditWriteResult.recordFile);
  }

  writeRunSummary(logger, payload, commandContext.format);
  return summary.exitCode;
}
