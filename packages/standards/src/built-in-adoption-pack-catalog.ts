import {
  ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
  AdoptionPackManagedAssetGroup,
  AdoptionPackRemovePolicy,
  AdoptionPackSourceKind,
  AdoptionPackUpgradePolicy,
  AdoptionPackWorkspaceModePolicy,
  BUILT_IN_ADOPTION_PACK_ID,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS,
  BUILT_IN_ADOPTION_PACK_VERSION,
} from './constants/adoption-pack.constant.js';
import { HostDistributionHandoffBridge, HostDistributionTarget } from './constants/index.js';
import type {
  AdoptionPackManifest,
  AdoptionPackTemplateRecord,
  ResolvedAdoptionPackDefinition,
} from './types/index.js';
import type { StructuredWorkflowAssetRecord } from './types/interfaces/host-distribution.interface.js';

interface BuiltInAdoptionPackDefinition {
  manifest: AdoptionPackManifest;
  workflowRecords: StructuredWorkflowAssetRecord[];
  templateRecords: AdoptionPackTemplateRecord[];
  capabilityCoverage: Record<string, string[]>;
}

const BUILT_IN_ALL_PROFILE_IDS = [
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE,
];

const BUILT_IN_WORKFLOW_RECORDS: StructuredWorkflowAssetRecord[] = [
  createWorkflowRecord(
    'workspace-code-review-workflow',
    'Workspace Code Review Workflow',
    'Review the current workspace, write CR lifecycle artifacts, and keep review status synchronized with sprint ledgers.',
    `---
name: workspace-code-review-workflow
description: Review the current workspace, write CR lifecycle artifacts, and keep review status synchronized with sprint ledgers.
---

# Workspace Code Review Workflow

Review only the requested workspace boundary, write review artifacts to the resolved sprint review directory, and keep the paired CR task lifecycle synchronized.
`,
  ),
  createWorkflowRecord(
    'workspace-delivery-finisher',
    'Workspace Delivery Finisher',
    'Run the repository delivery gate, create a Conventional Commit, and stop before push unless the user explicitly requests it.',
    `---
name: workspace-delivery-finisher
description: Run the repository delivery gate, create a Conventional Commit, and stop before push unless the user explicitly requests it.
---

# Workspace Delivery Finisher

Inspect git state, run \`pnpm run check\`, stage the intended changes, create a Conventional Commit, and keep push opt-in.
`,
  ),
  createWorkflowRecord(
    'workspace-scoped-cr-loop',
    'Workspace Scoped CR Loop',
    'Execute one task, sprint, or project boundary and require fresh delegated reviewer rechecks until no actionable findings remain.',
    `---
name: workspace-scoped-cr-loop
description: Execute one task, sprint, or project boundary and require fresh delegated reviewer rechecks until no actionable findings remain.
---

# Workspace Scoped CR Loop

Execute the declared scope, write ledger truth, spawn a fresh reviewer for each CR round, fix accepted findings, and repeat until the latest round is clean.
`,
  ),
  createWorkflowRecord(
    'technical-solution-review',
    'Technical Solution Review',
    'Review draft technical solutions, produce approval evidence, and prepare promotion handoff when the draft is ready.',
    `---
name: technical-solution-review
description: Review draft technical solutions, produce approval evidence, and prepare promotion handoff when the draft is ready.
---

# Technical Solution Review

Review one draft technical solution against governance contracts, record approval evidence, and decide whether it is ready for promotion.
`,
  ),
  createWorkflowRecord(
    'technical-solution-promotion',
    'Technical Solution Promotion',
    'Promote approved draft technical solutions into final lifecycle-managed docs and registries.',
    `---
name: technical-solution-promotion
description: Promote approved draft technical solutions into final lifecycle-managed docs and registries.
---

# Technical Solution Promotion

Move one approved draft into formal lifecycle-managed surfaces, synchronize registries, and record promotion evidence in the owning sprint.
`,
  ),
  createWorkflowRecord(
    'gh-pr-remediation',
    'GH PR Remediation',
    'Inspect the pull request linked to the current branch, summarize unresolved review threads, and implement approved fixes before closeout.',
    `---
name: gh-pr-remediation
description: Inspect the pull request linked to the current branch, summarize unresolved review threads, and implement approved fixes before closeout.
---

# GH PR Remediation

Use GitHub CLI-backed review data to summarize unresolved threads, implement accepted changes, and keep the repository delivery gate green.
`,
  ),
];

const BUILT_IN_TEMPLATE_RECORDS: AdoptionPackTemplateRecord[] = [
  createTemplateRecord(
    '.repo-ai-governor/adoption/docs/README.adoption.md',
    `# Repo AI Governor Adoption Pack

- Installed Pack: \`repo-ai-governor-adoption-pack\`
- Profiles: \`adopter-complete\`, \`self-host-complete\`

## What This Install Owns

1. Host-consumable repository assets such as \`AGENTS.md\`, \`.agents/**\`, \`.claude/**\`, \`.github/**\`, and \`.mcp.json\`.
2. Installer metadata under \`.repo-ai-governor/adoption/installations/**\`.
3. Guide, reference, and bootstrap files under \`.repo-ai-governor/adoption/docs/**\`, \`.repo-ai-governor/adoption/guides/**\`, and \`.repo-ai-governor/adoption/bootstrap/**\`.

## Important Boundaries

1. Built-in adoption packs do not require pre-existing source-local \`.codex/skills/**\` in the target repository.
2. Installed repository assets are managed projections, not canonical workflow/runtime truth.
3. \`self-host-complete\` only seeds template-backed repo-local governance surfaces; it does not clone any live execution state.

## Lifecycle Commands

1. \`repo-ai-governor adopt verify --repo .\`
2. \`repo-ai-governor adopt diff --repo .\`
3. \`repo-ai-governor adopt upgrade adopter-complete --repo .\`
4. \`repo-ai-governor adopt remove adopter-complete --repo . --force\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Adoption-pack README/reference for installed repositories.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/docs/troubleshooting.md',
    `# Adoption Pack Troubleshooting

## Common Checks

1. Re-run \`repo-ai-governor adopt verify --repo .\` to confirm the active receipt, managed files, and projected host artifacts still match.
2. Run \`repo-ai-governor adopt diff --repo .\` before upgrade or remove if you suspect local drift.
3. If apply reports an unmanaged-file conflict, inspect the existing repository file first instead of forcing an overwrite blindly.

## Workspace Notes

1. \`adopter-complete\` keeps runtime-owned operational truth outside the repository unless you later migrate to \`repo_local\`.
2. \`self-host-complete\` requires \`workspace.mode=repo_local\` and only seeds empty/template-backed governance surfaces.
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Troubleshooting guide for installed adoption-pack repositories.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/connect.md',
    `# Connect Guide

Use this after \`adopt apply\` when you want adapter readiness facts for the installed repository.

\`\`\`bash
pnpm exec repo-ai-governor connect --tools codex,claude-code --preset multi-tool-default --output json
pnpm exec repo-ai-governor doctor --adapters --fix --output json
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Quick-start guide for adapter onboarding after adoption-pack install.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/verify.md',
    `# Verify Guide

Use these checks after install and before real governed execution.

\`\`\`bash
pnpm exec repo-ai-governor verify --adapters --output json
pnpm exec repo-ai-governor adopt verify --repo .
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Verification guide for adapter readiness and install lifecycle checks.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/run.md',
    `# Run Guide

Once onboarding and verification are clean, start with a dry-run governance loop:

\`\`\`bash
pnpm exec repo-ai-governor plan --output json
pnpm exec repo-ai-governor run --output json --dry-run --trace
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Governed run guide for installed repositories.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/review.md',
    `# Review Guide

Use the managed review chain when the installed repository exposes sprint task surfaces:

\`\`\`bash
pnpm exec repo-ai-governor review --output json
pnpm exec repo-ai-governor review-verify --output json
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Review-chain guide for installed repositories.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/upgrade.md',
    `# Upgrade Guide

Keep installed assets source-aware and upgradeable:

\`\`\`bash
pnpm exec repo-ai-governor adopt diff --repo .
pnpm exec repo-ai-governor adopt upgrade adopter-complete --repo .
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Upgrade guide for managed adoption-pack installations.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/guides/workspace.md',
    `# Workspace Guide

Default installs keep runtime-owned workspace truth outside the repository. Move to \`repo_local\` only when the repository itself should host the governance workspace.

\`\`\`bash
pnpm exec repo-ai-governor workspace dry-run --workspace-mode repo_local --output json
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local --output json
\`\`\`
`,
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    BUILT_IN_ALL_PROFILE_IDS,
    'Workspace-mode guide for installed repositories.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/adoption/bootstrap/governor.repo-local.template.yaml',
    `schemaVersion: "1.1"
workspace:
  mode: repo_local
  migrationPolicy: copy_verify_switch_rollback
i18n:
  runtimeEngine: i18next
  defaultLocale: zh-CN
  fallbackLocale: en-US
  supportedLocales:
    - zh-CN
    - en-US
`,
    AdoptionPackManagedAssetGroup.BOOTSTRAP_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Repo-local governor config template for self-host bootstrap.',
  ),
  {
    relativePath: '.repo-ai-governor/context/current-context.md',
    content: `# Workspace Current Context

## Primary Stream

- Status: idle
- Project: \`project-template\`
- Sprint: \`sprint-template\`
- Docs root: \`.repo-ai-governor/context/dev/project-template\`
- Task records: \`.repo-ai-governor/context/dev/project-template/sprint-template/tasks/\`
- Review records: \`.repo-ai-governor/context/dev/project-template/sprint-template/review/\`
- Note: \`template\` self-host bootstrap seeded an empty execution surface; update this file before real execution.

## Active Streams

- none currently registered.

## Planned Follow-Up Streams

- none currently registered.

## Completed Stream History

- File: \`.repo-ai-governor/context/completed-streams-history.md\`
- Scope: completed streams only; use for historical tracebacks, migration, or audit lookup.
- Default Load: \`false\`
`,
    assetGroup: AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Empty self-host execution context template.',
  },
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/plan.md',
    `# project-template 计划

- Status: planned
- Date: 1970-01-01

## 1. Goal

1. Replace this template with the first real self-host project plan.

## 2. Milestones

1. Create the first real \`project-xxx\` and \`sprint-xxx\` entries before execution starts.
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host project-plan template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/sprint-template/plan.md',
    `# sprint-template 计划

- Status: planned
- Date: 1970-01-01
- Project: \`project-template\`
- Sprint Goal: replace this template before real execution.

## 1. Task Package

1. \`TK-001\` template task
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host sprint-plan template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/checklist.md',
    `# checklist

- [ ] TK-001 template task
  - 1970-01-01：replace this template entry before real execution.
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host checklist template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv',
    `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at
template-execution,TK-001,template task,AI-Agent,P1,1970-01-01,planned,project-template,sprint-template,replace this template before real execution,待执行,待验证,待执行,1970-01-01
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host tasks.csv template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/TK-001-template-task.md',
    `# TK-001 template task

- Status: planned
- Date: 1970-01-01
- Owner: \`AI-Agent\`
- Priority: \`P1\`
- Project: \`project-template\`
- Sprint: \`sprint-template\`

## 1. 任务目标

Replace this template before real execution starts.
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host task-card template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/context/dev/project-template/sprint-template/review/README.md',
    `# Review Surface Template

Use this directory for future \`code_review_*\`, \`verified_code_review_*\`, and \`resolved_code_review_*\` artifacts.
`,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Empty self-host review-surface template.',
  ),
  {
    relativePath: '.repo-ai-governor/context/completed-streams-history.md',
    content: `# Workspace Completed Stream History

- Status: active
- Date: 1970-01-01
- Scope: completed execution streams removed from \`current-context.md\` default startup surface

## Usage

1. Record completed execution streams here instead of keeping them inside the default startup surface.

## Completed Streams

- none currently recorded.
`,
    assetGroup: AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Empty completed-stream history template.',
  },
  {
    relativePath: '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml',
    content: `schema_version: 1
generated_at: 1970-01-01
status: active
owner: self-host-template
solutions: []
`,
    assetGroup: AdoptionPackManagedAssetGroup.GOVERNANCE_AUTHORING_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Empty technical-solution lifecycle registry template.',
  },
  {
    relativePath: '.repo-ai-governor/context/technical-solution-delivery-registry.yaml',
    content: `schema_version: 1
generated_at: 1970-01-01
status: active
owner: self-host-template
deliveries: []
`,
    assetGroup: AdoptionPackManagedAssetGroup.GOVERNANCE_AUTHORING_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Empty technical-solution delivery registry template.',
  },
  {
    relativePath: '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
    content: `schema_version: 1
generated_at: 1970-01-01
status: active
owner: self-host-template

default_policy:
  baseline_tiers:
    - L0
  escalate_load_order:
    - L1
    - L2
    - L3
  allow_direct_l3_load: false

external_required_inputs:
  - doc_id: current_context
    path: .repo-ai-governor/context/current-context.md
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks

documents:
  - doc_id: normative_loading_manifest
    path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks
`,
    assetGroup: AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Minimal normative-loading manifest template for self-host authoring.',
  },
  {
    relativePath: '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
    content: `# Product Requirements Brief

- Status: draft
- Date: 1970-01-01

## Purpose

Describe the target repository governance product line before expanding into detailed requirements or technical solutions.
`,
    assetGroup: AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Minimal PRD brief template for self-host authoring.',
  },
  createTemplateRecord(
    '.repo-ai-governor/draft/README.md',
    `# Draft Technical Solutions

Place draft technical solutions under this directory before they enter the formal lifecycle.
`,
    AdoptionPackManagedAssetGroup.GOVERNANCE_AUTHORING_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Draft technical-solution authoring template.',
  ),
  createTemplateRecord(
    '.repo-ai-governor/normative_knowledge_sources/technical-solutions/README.md',
    `# Technical Solutions

Create formal module overviews, contracts, and ADRs here after a draft technical solution is approved for promotion.
`,
    AdoptionPackManagedAssetGroup.GOVERNANCE_AUTHORING_TEMPLATES,
    [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    'Technical-solution module authoring template.',
  ),
];

const BUILT_IN_MANIFEST: AdoptionPackManifest = {
  schemaVersion: ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
  packId: BUILT_IN_ADOPTION_PACK_ID,
  packVersion: BUILT_IN_ADOPTION_PACK_VERSION,
  status: 'active',
  ownerModule: 'runtime.governance-clients',
  sourceKind: AdoptionPackSourceKind.BUILT_IN,
  sourceRef: 'builtin://repo-ai-governor/adoption-pack',
  profiles: [
    {
      profileId: BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE,
      displayName: 'Adopter Complete',
      workflowAssetIds: BUILT_IN_WORKFLOW_RECORDS.map((record) => record.workflowId),
      commandEntrypoints: [
        'init',
        'connect',
        'verify',
        'plan',
        'run',
        'review',
        'review-verify',
        'host export',
        'host verify',
        'host pack',
        'adopt apply',
        'adopt verify',
      ],
      guideEntrypoints: ['README.md', 'docs/local-adoption-playbook.md', 'docs/support-matrix.md'],
      standardsPackRefs: ['pack.repo-ai-governor.adoption-complete@1.0.0'],
      hostTargets: [
        HostDistributionTarget.CODEX_PROJECT_LOCAL,
        HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
        HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
      ],
      bootstrapActions: [
        'materialize-host-assets',
        'write-adoption-guides',
        'write-adoption-metadata',
      ],
      workspaceModePolicy: AdoptionPackWorkspaceModePolicy.TOOL_MANAGED_DEFAULT,
    },
    {
      profileId: BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE,
      displayName: 'Self Host Complete',
      workflowAssetIds: BUILT_IN_WORKFLOW_RECORDS.map((record) => record.workflowId),
      commandEntrypoints: [
        'init',
        'plan',
        'run',
        'review',
        'review-verify',
        'adopt apply',
        'adopt diff',
        'adopt upgrade',
        'adopt remove',
        'adopt verify',
      ],
      guideEntrypoints: ['README.md', 'docs/local-adoption-playbook.md', 'docs/support-matrix.md'],
      standardsPackRefs: ['pack.repo-ai-governor.self-host-complete@1.0.0'],
      hostTargets: [
        HostDistributionTarget.CODEX_PROJECT_LOCAL,
        HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
        HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
      ],
      bootstrapActions: [
        'materialize-host-assets',
        'seed-empty-execution-workspace',
        'seed-empty-sqlite-registries',
        'seed-governance-authoring-templates',
      ],
      workspaceModePolicy: AdoptionPackWorkspaceModePolicy.REPO_LOCAL_REQUIRED,
    },
  ],
  managedAssetGroups: [
    AdoptionPackManagedAssetGroup.COMMAND_GUIDES,
    AdoptionPackManagedAssetGroup.INSTRUCTIONS,
    AdoptionPackManagedAssetGroup.SKILLS,
    AdoptionPackManagedAssetGroup.AGENTS,
    AdoptionPackManagedAssetGroup.HOOKS,
    AdoptionPackManagedAssetGroup.MCP_BRIDGE,
    AdoptionPackManagedAssetGroup.BOOTSTRAP_TEMPLATES,
    AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
    AdoptionPackManagedAssetGroup.MANAGEMENT_METADATA,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
    AdoptionPackManagedAssetGroup.GOVERNANCE_AUTHORING_TEMPLATES,
  ],
  managedPaths: [
    '.repo-ai-governor/adoption/**',
    '.repo-ai-governor/context/**',
    '.repo-ai-governor/normative_knowledge_sources/**',
    'AGENTS.md',
    '.agents/**',
    '.claude/**',
    '.github/**',
    '.mcp.json',
  ],
  canonicalSourceRefs: [
    '.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md',
    '.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md',
  ],
  sourcePackRefs: ['pack.repo-ai-governor.adoption-pack@1.0.0'],
  hostTargets: [
    HostDistributionTarget.CODEX_PROJECT_LOCAL,
    HostDistributionTarget.CODEX_PLUGIN,
    HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
    HostDistributionTarget.CLAUDE_CODE_PLUGIN,
    HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
    HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
  ],
  handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
  verificationProfileRefs: ['host.verify', 'adoption.verify'],
  upgradePolicy: AdoptionPackUpgradePolicy.MANAGED_WITH_DRIFT_REPORT,
  removePolicy: AdoptionPackRemovePolicy.MANAGED_WITH_CONFIRM,
  docsEntrypoints: ['README.md', 'docs/local-adoption-playbook.md', 'docs/support-matrix.md'],
};

/**
 * Lists built-in adoption-pack definitions shipped by the current standards surface.
 * @returns Built-in definitions in deterministic pack-id order.
 */
export function listBuiltInAdoptionPackDefinitions(): ResolvedAdoptionPackDefinition[] {
  return [toResolvedDefinition()].sort((left, right) =>
    left.manifest.packId.localeCompare(right.manifest.packId),
  );
}

/**
 * Resolves one built-in definition by pack id.
 * @param packId Pack id requested by installer/runtime consumers.
 * @returns Built-in definition when the pack id is supported, otherwise null.
 */
export function resolveBuiltInAdoptionPackDefinition(
  packId: string,
): ResolvedAdoptionPackDefinition | null {
  return packId === BUILT_IN_ADOPTION_PACK_ID ? toResolvedDefinition() : null;
}

function toResolvedDefinition(): ResolvedAdoptionPackDefinition {
  const definition: BuiltInAdoptionPackDefinition = {
    manifest: BUILT_IN_MANIFEST,
    workflowRecords: BUILT_IN_WORKFLOW_RECORDS,
    templateRecords: BUILT_IN_TEMPLATE_RECORDS,
    capabilityCoverage: {
      [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE]: [
        'host-projection',
        'management-metadata',
        'docs-entrypoints',
        'service-host-handoff',
      ],
      [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE]: [
        'host-projection',
        'management-metadata',
        'docs-entrypoints',
        'repo-local-execution-templates',
        'sqlite-registry-bootstrap',
        'governance-authoring-templates',
      ],
    },
  };

  return {
    manifest: {
      ...definition.manifest,
      resolvedSourceKind: definition.manifest.sourceKind,
      resolvedSourceRef: definition.manifest.sourceRef,
      resolutionOrder: [
        AdoptionPackSourceKind.REPO_LOCAL,
        AdoptionPackSourceKind.GLOBAL,
        AdoptionPackSourceKind.BUILT_IN,
      ],
      installSupported: true,
    },
    workflowRecords: definition.workflowRecords.map((record) => ({ ...record })),
    templateRecords: definition.templateRecords.map((record) => ({ ...record })),
    capabilityCoverage: { ...definition.capabilityCoverage },
  };
}

function createWorkflowRecord(
  workflowId: string,
  displayName: string,
  description: string,
  projectedSkillMarkdown: string,
): StructuredWorkflowAssetRecord {
  return {
    workflowId,
    workflowVersion: 'built-in',
    workflowStatus: 'active',
    semanticOwnerModule: 'runtime.governance-clients',
    displayName,
    description,
    canonicalSourceRefs: [`builtin://repo-ai-governor/skills/${workflowId}`],
    sourcePackRefs: ['pack.repo-ai-governor.adoption-pack@1.0.0'],
    hostTargetMatrix: [
      HostDistributionTarget.CODEX_PROJECT_LOCAL,
      HostDistributionTarget.CODEX_PLUGIN,
      HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL,
      HostDistributionTarget.CLAUDE_CODE_PLUGIN,
      HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL,
      HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN,
      HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT,
    ],
    triggerHints: workflowId.split('-'),
    inputs: ['adoption_pack'],
    artifacts: ['host_projection', 'installer_metadata'],
    riskTier: workflowId.includes('delivery') ? 'high' : 'medium',
    handoffBridge: HostDistributionHandoffBridge.CLI_WRAPPER,
    handoffTarget: `repo-ai-governor ${workflowId}`,
    verificationProfileRefs: ['host.verify', 'adoption.verify'],
    driftChecks: ['canonical_source_refs', 'staged_to_applied_drift'],
    projectedSkillMarkdown,
  };
}

function createTemplateRecord(
  relativePath: string,
  content: string,
  assetGroup: AdoptionPackManagedAssetGroup,
  profileIds: string[],
  description: string,
): AdoptionPackTemplateRecord {
  return {
    relativePath,
    content,
    assetGroup,
    profileIds,
    description,
  };
}
