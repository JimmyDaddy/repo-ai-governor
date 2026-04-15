import {
  ADOPTION_PACK_MANIFEST_SCHEMA_VERSION,
  AdoptionPackApplicabilityScope,
  AdoptionPackCompositionPolicy,
  AdoptionPackManagedAssetGroup,
  AdoptionPackParityClass,
  AdoptionPackPlaceholderPolicy,
  AdoptionPackReadinessGroup,
  AdoptionPackReadinessSink,
  AdoptionPackRemovePolicy,
  AdoptionPackSourceKind,
  AdoptionPackSourceMode,
  AdoptionPackSurfaceKind,
  AdoptionPackUpgradePolicy,
  AdoptionPackWorkspaceModePolicy,
  BUILT_IN_ADOPTION_PACK_ID,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS,
  BUILT_IN_ADOPTION_PACK_VERSION,
} from './constants/adoption-pack.constant.js';
import { HostDistributionHandoffBridge, HostDistributionTarget } from './constants/index.js';
import type {
  AdoptionPackManifest,
  AdoptionPackReadinessMatrixRecord,
  AdoptionPackRuntimeBootstrapRecord,
  AdoptionPackSourceCatalogRecord,
  AdoptionPackTemplateRecord,
  ResolvedAdoptionPackDefinition,
} from './types/index.js';
import type { StructuredWorkflowAssetRecord } from './types/interfaces/host-distribution.interface.js';

interface BuiltInAdoptionPackDefinition {
  manifest: AdoptionPackManifest;
  workflowRecords: StructuredWorkflowAssetRecord[];
  templateRecords: AdoptionPackTemplateRecord[];
  runtimeBootstrapRecords: AdoptionPackRuntimeBootstrapRecord[];
  sourceCatalogRecords: AdoptionPackSourceCatalogRecord[];
  readinessMatrixRecords: AdoptionPackReadinessMatrixRecord[];
  capabilityCoverage: Record<string, string[]>;
}

const BUILT_IN_ALL_PROFILE_IDS = [
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS.ADOPTER_COMPLETE,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE,
];
const SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE = '- Placeholder Status: replace_before_execution';

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
- Stream: \`none\`
- Project: \`project-template\`
- Sprint: \`sprint-template\`
- Docs: \`.repo-ai-governor/context/dev/project-template\`
- Plan: \`.repo-ai-governor/context/dev/project-template/sprint-template/plan.md\`
- Tasks: \`.repo-ai-governor/context/dev/project-template/sprint-template/tasks/\`
- Checklist: \`.repo-ai-governor/context/dev/project-template/sprint-template/tasks/checklist.md\`
- CSV: \`.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv\`
- Review: \`.repo-ai-governor/context/dev/project-template/sprint-template/review/\`
- Note: \`template\` self-host bootstrap seeded an empty execution surface; replace starter paths and placeholder values before real execution.

## Active Streams

- none

## Planned Follow-Up Streams

- none

## Completed Stream History

- File: \`.repo-ai-governor/context/completed-streams-history.md\`
- Scope: completed streams only; use for historical tracebacks, migration, or audit lookup.
- Default Load: \`false\`

## Update Rules

1. 切换项目或 sprint 时，优先更新本文件而不是修改 \`AGENTS.md\`。
2. 如需并发执行多个任务流，请在 \`Active Streams\` 中追加新条目，并保持只有一个 \`primary\`。
3. 当某个 stream 进入 \`completed\` 时，将其从 \`Active Streams\` 移入 \`.repo-ai-governor/context/completed-streams-history.md\`。
4. 若 project-final CR rounds 继续复用 final sprint 的 \`tasks/\` 与 \`review/\` surface，则该 final sprint 可在最后一个 project-final \`CR\` \`resolved\` 前保持 active closeout surface。
5. 已拆解但尚未启动的 follow-up sprint 可登记到 \`Planned Follow-Up Streams\`，避免与默认 active execution surface 混淆。
`,
    assetGroup: AdoptionPackManagedAssetGroup.EXECUTION_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Empty self-host execution context template.',
    sourceCatalogId: buildTemplateSurfaceId('.repo-ai-governor/context/current-context.md'),
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
    sourceCatalogId: buildTemplateSurfaceId(
      '.repo-ai-governor/context/completed-streams-history.md',
    ),
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
    sourceCatalogId: buildTemplateSurfaceId(
      '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml',
    ),
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
    sourceCatalogId: buildTemplateSurfaceId(
      '.repo-ai-governor/context/technical-solution-delivery-registry.yaml',
    ),
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
    owner: workspace-runtime
    last_reviewed_at: 1970-01-01
    notes: operational state source outside normative_knowledge_sources

  - doc_id: technical_solution_lifecycle_registry
    path: .repo-ai-governor/context/technical-solution-lifecycle-registry.yaml
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - technical_solution_promotion_change
      - technical_solution_module_change
      - governance_engine_change
    owner: architecture
    last_reviewed_at: 1970-01-01
    notes: lifecycle state source outside normative_knowledge_sources

  - doc_id: technical_solution_delivery_registry
    path: .repo-ai-governor/context/technical-solution-delivery-registry.yaml
    tier: L1
    status: active
    default_load: false
    load_trigger:
      - technical_solution_promotion_change
      - technical_solution_module_change
      - governance_engine_change
    owner: architecture
    last_reviewed_at: 1970-01-01
    notes: solution-to-execution handoff source outside normative_knowledge_sources

documents:
  - doc_id: normative_loading_manifest
    path: .repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks
    owner: governance
    last_reviewed_at: 1970-01-01
    notes: source of truth for normative loading policy

  - doc_id: product_requirements_brief
    path: .repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks
    owner: product
    last_reviewed_at: 1970-01-01
    notes: default execution target

  - doc_id: code_standards
    path: .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks
    owner: governance
    last_reviewed_at: 1970-01-01
    notes: no explicit metadata header; treated as active by governance baseline

  - doc_id: long_term_maintenance_guide
    path: .repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md
    tier: L0
    status: active
    default_load: true
    load_trigger:
      - all_tasks
    owner: governance
    last_reviewed_at: 1970-01-01
`,
    assetGroup: AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Minimal normative-loading manifest template for self-host authoring.',
    sourceCatalogId: buildTemplateSurfaceId(
      '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
    ),
  },
  {
    relativePath: '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
    content: `# Product Requirements Brief

- Status: draft
- Date: 1970-01-01
${SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE}

## Purpose

Describe the target repository governance product line before expanding into detailed requirements or technical solutions.
`,
    assetGroup: AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description: 'Minimal PRD brief template for self-host authoring.',
    sourceCatalogId: buildTemplateSurfaceId(
      '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
    ),
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

const SELF_HOST_READINESS_SINK_IDS = [
  AdoptionPackReadinessSink.DOCTOR_DIAGNOSTICS,
  AdoptionPackReadinessSink.ADOPT_VERIFY,
  AdoptionPackReadinessSink.EXECUTION_PREFLIGHT,
];

const SELF_HOST_GOVERNOR_CONFIG_DESCRIPTION =
  'Self-host governor config is currently written by runtime bootstrap and therefore must stay visible in the parity inventory.';
const SELF_HOST_MODULE_REGISTRY_DESCRIPTION =
  'Self-host technical-solution module registry bootstrap remains a blank registry seed until the adopter formalizes real modules.';
const SELF_HOST_CODE_STANDARDS_DESCRIPTION =
  'Self-host code standards stay adopter-owned even though the bootstrap writes an initial placeholder file today.';
const SELF_HOST_LONG_TERM_MAINTENANCE_DESCRIPTION =
  'Self-host long-term maintenance guidance stays adopter-owned even though the bootstrap writes an initial placeholder file today.';

const BUILT_IN_SOURCE_CATALOG_RECORDS: AdoptionPackSourceCatalogRecord[] = [
  ...BUILT_IN_WORKFLOW_RECORDS.map((record) => createWorkflowSourceCatalogRecord(record)),
  ...BUILT_IN_TEMPLATE_RECORDS.map((record) => createTemplateSourceCatalogRecord(record)),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/governor.yaml',
    SELF_HOST_GOVERNOR_CONFIG_DESCRIPTION,
    AdoptionPackManagedAssetGroup.BOOTSTRAP_TEMPLATES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.NONE,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml',
    SELF_HOST_MODULE_REGISTRY_DESCRIPTION,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.PRODUCT_DIRECTION_READY,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
    SELF_HOST_CODE_STANDARDS_DESCRIPTION,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    AdoptionPackParityClass.ADOPTER_OWNED_PLACEHOLDER,
    AdoptionPackSourceMode.ADOPTER_PLACEHOLDER,
    AdoptionPackPlaceholderPolicy.ADOPTER_OWNED,
    AdoptionPackReadinessGroup.GOVERNANCE_RULES_READY,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
    SELF_HOST_LONG_TERM_MAINTENANCE_DESCRIPTION,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    AdoptionPackParityClass.ADOPTER_OWNED_PLACEHOLDER,
    AdoptionPackSourceMode.ADOPTER_PLACEHOLDER,
    AdoptionPackPlaceholderPolicy.ADOPTER_OWNED,
    AdoptionPackReadinessGroup.GOVERNANCE_RULES_READY,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
    'Canonical task-ledger sqlite is seeded as an empty registry for self-host execution bootstrap.',
    AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.NONE,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite',
    'Artifact-registry sqlite is seeded as an empty registry for self-host execution bootstrap.',
    AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.NONE,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/context/artifact-registry/artifacts.csv',
    'Rendered artifact-registry main view is seeded from an empty canonical registry bootstrap.',
    AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.NONE,
  ),
  createRuntimeBootstrapSourceCatalogRecord(
    '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv',
    'Rendered artifact-registry archive view is seeded from an empty canonical registry bootstrap.',
    AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
    AdoptionPackParityClass.TEMPLATE_SEED,
    AdoptionPackSourceMode.TEMPLATE_SEED,
    AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    AdoptionPackReadinessGroup.NONE,
  ),
];

const BUILT_IN_RUNTIME_BOOTSTRAP_RECORDS: AdoptionPackRuntimeBootstrapRecord[] = [
  createRuntimeBootstrapTemplateRecord(
    '.repo-ai-governor/governor.yaml',
    [
      'schemaVersion: "1.1"',
      'workspace:',
      '  mode: repo_local',
      '  migrationPolicy: copy_verify_switch_rollback',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: zh-CN',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - zh-CN',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    AdoptionPackManagedAssetGroup.BOOTSTRAP_TEMPLATES,
    SELF_HOST_GOVERNOR_CONFIG_DESCRIPTION,
  ),
  createRuntimeBootstrapTemplateRecord(
    '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml',
    [
      'schema_version: 2',
      'generated_at: 1970-01-01',
      'status: active',
      'owner: self-host-template',
      '',
      'allowed_layers:',
      '  - governance-core',
      '  - runtime-core',
      '',
      'change_impact_classes:',
      '  - local_detail_change',
      '  - exported_contract_change',
      '  - module_registry_change',
      '  - north_star_change',
      '  - layer_boundary_change',
      '',
      'sync_target_tokens:',
      '  - summary_doc',
      '  - module_registry',
      '  - direct_consumers',
      '  - overall_technical_solution',
      '  - architecture_and_repo_layering',
      '  - product_requirements',
      '  - product_requirements_brief',
      '',
      'modules: []',
      '',
    ].join('\n'),
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    SELF_HOST_MODULE_REGISTRY_DESCRIPTION,
  ),
  createRuntimeBootstrapTemplateRecord(
    '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
    `# Code Standards

- Status: draft
- Date: 1970-01-01
${SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE}

## Purpose

Define repository-specific code constraints before enabling unattended delivery.
`,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    SELF_HOST_CODE_STANDARDS_DESCRIPTION,
  ),
  createRuntimeBootstrapTemplateRecord(
    '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
    `# Long-Term Maintenance Guide

- Status: draft
- Date: 1970-01-01
${SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE}

## Purpose

Capture maintenance expectations for self-hosted governance repositories.
`,
    AdoptionPackManagedAssetGroup.NORMATIVE_TEMPLATES,
    SELF_HOST_LONG_TERM_MAINTENANCE_DESCRIPTION,
  ),
];

const BUILT_IN_READINESS_MATRIX_RECORDS: AdoptionPackReadinessMatrixRecord[] = [
  createReadinessMatrixRecord(
    AdoptionPackReadinessGroup.GOVERNANCE_RULES_READY,
    [
      buildRuntimeBootstrapSurfaceId(
        '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
      ),
      buildRuntimeBootstrapSurfaceId(
        '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
      ),
    ],
    'Only self-host repositories that opt into repo-local authoring should receive governance-rules readiness warnings; unattended execution remains fail-closed until placeholders are replaced.',
  ),
  createReadinessMatrixRecord(
    AdoptionPackReadinessGroup.PRODUCT_DIRECTION_READY,
    [
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml',
      ),
      buildTemplateSurfaceId('.repo-ai-governor/context/technical-solution-delivery-registry.yaml'),
      buildRuntimeBootstrapSurfaceId(
        '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml',
      ),
      buildTemplateSurfaceId(
        '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
      ),
    ],
    'Product-direction readiness stays scoped to self-host repo-local authoring surfaces and should first surface via diagnostics/verify before later promotion or execution gates rely on it.',
  ),
  createReadinessMatrixRecord(
    AdoptionPackReadinessGroup.EXECUTION_SURFACE_READY,
    [
      buildTemplateSurfaceId('.repo-ai-governor/context/current-context.md'),
      buildTemplateSurfaceId(
        '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
      ),
      buildTemplateSurfaceId('.repo-ai-governor/context/dev/project-template/plan.md'),
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/dev/project-template/sprint-template/plan.md',
      ),
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/checklist.md',
      ),
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv',
      ),
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/TK-001-template-task.md',
      ),
      buildTemplateSurfaceId(
        '.repo-ai-governor/context/dev/project-template/sprint-template/review/README.md',
      ),
      buildTemplateSurfaceId('.repo-ai-governor/context/completed-streams-history.md'),
    ],
    'Execution-surface readiness only applies to self-host repo-local execution paths: diagnostics and adopt verify should warn, and adopt verify should publish a downstream fail-closed execution preflight signal while starter placeholders are still present.',
  ),
];

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
    runtimeBootstrapRecords: BUILT_IN_RUNTIME_BOOTSTRAP_RECORDS,
    sourceCatalogRecords: BUILT_IN_SOURCE_CATALOG_RECORDS,
    readinessMatrixRecords: BUILT_IN_READINESS_MATRIX_RECORDS,
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
    runtimeBootstrapRecords: definition.runtimeBootstrapRecords.map((record) => ({ ...record })),
    sourceCatalogRecords: definition.sourceCatalogRecords.map((record) => ({
      ...record,
      profileIds: [...record.profileIds],
      readinessSinkIds: [...record.readinessSinkIds],
      ...(record.relativePath ? { relativePath: record.relativePath } : {}),
      ...(record.workflowId ? { workflowId: record.workflowId } : {}),
      ...(record.structureSourceRef ? { structureSourceRef: record.structureSourceRef } : {}),
      ...(record.instanceSourceMode ? { instanceSourceMode: record.instanceSourceMode } : {}),
      ...(record.instanceSourceRef ? { instanceSourceRef: record.instanceSourceRef } : {}),
      ...(record.instancePlaceholderPolicy
        ? { instancePlaceholderPolicy: record.instancePlaceholderPolicy }
        : {}),
    })),
    readinessMatrixRecords: definition.readinessMatrixRecords.map((record) => ({
      ...record,
      sinkIds: [...record.sinkIds],
      surfaceIds: [...record.surfaceIds],
    })),
    capabilityCoverage: { ...definition.capabilityCoverage },
  };
}

function createWorkflowSourceCatalogRecord(
  workflowRecord: StructuredWorkflowAssetRecord,
): AdoptionPackSourceCatalogRecord {
  return {
    surfaceId: buildWorkflowSurfaceId(workflowRecord.workflowId),
    surfaceKind: AdoptionPackSurfaceKind.WORKFLOW_ASSET,
    description: workflowRecord.description,
    profileIds: [...BUILT_IN_ALL_PROFILE_IDS],
    assetGroup: AdoptionPackManagedAssetGroup.SKILLS,
    parityClass: AdoptionPackParityClass.GENERATED_PROJECTION,
    sourceMode: AdoptionPackSourceMode.GENERATED_PROJECTION,
    sourceRef:
      workflowRecord.canonicalSourceRefs[0] ??
      `builtin://repo-ai-governor/skills/${workflowRecord.workflowId}`,
    compositionPolicy: AdoptionPackCompositionPolicy.CATALOG_ASSEMBLED,
    placeholderPolicy: AdoptionPackPlaceholderPolicy.NONE,
    applicabilityScope: AdoptionPackApplicabilityScope.ALL_PROFILES,
    readinessGroup: AdoptionPackReadinessGroup.NONE,
    readinessSinkIds: [],
    workflowId: workflowRecord.workflowId,
  };
}

function createTemplateSourceCatalogRecord(
  templateRecord: AdoptionPackTemplateRecord,
): AdoptionPackSourceCatalogRecord {
  const surfaceId = buildTemplateSurfaceId(templateRecord.relativePath);
  const defaultRecord: AdoptionPackSourceCatalogRecord = {
    surfaceId: templateRecord.sourceCatalogId ?? surfaceId,
    surfaceKind: AdoptionPackSurfaceKind.TEMPLATE_FILE,
    description: templateRecord.description,
    profileIds: [...templateRecord.profileIds],
    assetGroup: templateRecord.assetGroup,
    parityClass: AdoptionPackParityClass.TEMPLATE_SEED,
    sourceMode: AdoptionPackSourceMode.TEMPLATE_SEED,
    sourceRef: buildBuiltinTemplateSourceRef(templateRecord.relativePath),
    compositionPolicy: AdoptionPackCompositionPolicy.WHOLE_FILE,
    placeholderPolicy: AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
    applicabilityScope: templateRecord.profileIds.includes(
      BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE,
    )
      ? AdoptionPackApplicabilityScope.SELF_HOST_COMPLETE
      : AdoptionPackApplicabilityScope.ALL_PROFILES,
    readinessGroup: AdoptionPackReadinessGroup.NONE,
    readinessSinkIds: [],
    relativePath: templateRecord.relativePath,
  };

  if (
    templateRecord.relativePath.startsWith('.repo-ai-governor/adoption/docs/') ||
    templateRecord.relativePath.startsWith('.repo-ai-governor/adoption/guides/')
  ) {
    return {
      ...defaultRecord,
      parityClass: AdoptionPackParityClass.GENERATED_PROJECTION,
      sourceMode: AdoptionPackSourceMode.GENERATED_PROJECTION,
      compositionPolicy: AdoptionPackCompositionPolicy.CATALOG_ASSEMBLED,
      placeholderPolicy: AdoptionPackPlaceholderPolicy.NONE,
      applicabilityScope: AdoptionPackApplicabilityScope.ALL_PROFILES,
    };
  }

  switch (templateRecord.relativePath) {
    case '.repo-ai-governor/adoption/bootstrap/governor.repo-local.template.yaml':
      return {
        ...defaultRecord,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_COMPLETE,
      };
    case '.repo-ai-governor/context/current-context.md':
      return {
        ...defaultRecord,
        parityClass: AdoptionPackParityClass.EXACT_SYNC,
        sourceMode: AdoptionPackSourceMode.STRUCTURED_TEMPLATE_PROJECTION,
        sourceRef: '.repo-ai-governor/context/current-context.md',
        compositionPolicy: AdoptionPackCompositionPolicy.STRUCTURE_INSTANCE_SPLIT,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup: AdoptionPackReadinessGroup.EXECUTION_SURFACE_READY,
        readinessSinkIds: [...SELF_HOST_READINESS_SINK_IDS],
        structureSourceRef: '.repo-ai-governor/context/current-context.md',
        instanceSourceMode: AdoptionPackSourceMode.TEMPLATE_SEED,
        instanceSourceRef: buildBuiltinTemplateSourceRef(templateRecord.relativePath),
        instancePlaceholderPolicy: AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
      };
    case '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml':
      return {
        ...defaultRecord,
        parityClass: AdoptionPackParityClass.EXACT_SYNC,
        sourceMode: AdoptionPackSourceMode.STRUCTURED_TEMPLATE_PROJECTION,
        sourceRef: '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
        compositionPolicy: AdoptionPackCompositionPolicy.STRUCTURE_INSTANCE_SPLIT,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup: AdoptionPackReadinessGroup.EXECUTION_SURFACE_READY,
        readinessSinkIds: [...SELF_HOST_READINESS_SINK_IDS],
        structureSourceRef:
          '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml',
        instanceSourceMode: AdoptionPackSourceMode.TEMPLATE_SEED,
        instanceSourceRef: buildBuiltinTemplateSourceRef(templateRecord.relativePath),
        instancePlaceholderPolicy: AdoptionPackPlaceholderPolicy.TEMPLATE_SEED,
      };
    case '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md':
      return {
        ...defaultRecord,
        parityClass: AdoptionPackParityClass.ADOPTER_OWNED_PLACEHOLDER,
        sourceMode: AdoptionPackSourceMode.ADOPTER_PLACEHOLDER,
        placeholderPolicy: AdoptionPackPlaceholderPolicy.ADOPTER_OWNED,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup: AdoptionPackReadinessGroup.PRODUCT_DIRECTION_READY,
        readinessSinkIds: [...SELF_HOST_READINESS_SINK_IDS],
      };
    case '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml':
    case '.repo-ai-governor/context/technical-solution-delivery-registry.yaml':
      return {
        ...defaultRecord,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup: AdoptionPackReadinessGroup.PRODUCT_DIRECTION_READY,
        readinessSinkIds: [...SELF_HOST_READINESS_SINK_IDS],
      };
    case '.repo-ai-governor/context/completed-streams-history.md':
    case '.repo-ai-governor/context/dev/project-template/plan.md':
    case '.repo-ai-governor/context/dev/project-template/sprint-template/plan.md':
    case '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/checklist.md':
    case '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv':
    case '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/TK-001-template-task.md':
    case '.repo-ai-governor/context/dev/project-template/sprint-template/review/README.md':
      return {
        ...defaultRecord,
        parityClass: AdoptionPackParityClass.ADOPTER_OWNED_PLACEHOLDER,
        sourceMode: AdoptionPackSourceMode.ADOPTER_PLACEHOLDER,
        placeholderPolicy: AdoptionPackPlaceholderPolicy.ADOPTER_OWNED,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup: AdoptionPackReadinessGroup.EXECUTION_SURFACE_READY,
        readinessSinkIds: [...SELF_HOST_READINESS_SINK_IDS],
      };
    default:
      return defaultRecord;
  }
}

function createRuntimeBootstrapSourceCatalogRecord(
  relativePath: string,
  description: string,
  assetGroup: AdoptionPackManagedAssetGroup,
  parityClass: AdoptionPackParityClass,
  sourceMode: AdoptionPackSourceMode,
  placeholderPolicy: AdoptionPackPlaceholderPolicy,
  readinessGroup: AdoptionPackReadinessGroup,
): AdoptionPackSourceCatalogRecord {
  return {
    surfaceId: buildRuntimeBootstrapSurfaceId(relativePath),
    surfaceKind: AdoptionPackSurfaceKind.RUNTIME_BOOTSTRAP,
    description,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    assetGroup,
    parityClass,
    sourceMode,
    sourceRef: buildBuiltinRuntimeBootstrapSourceRef(relativePath),
    compositionPolicy: AdoptionPackCompositionPolicy.RUNTIME_BOOTSTRAP,
    placeholderPolicy,
    applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
    readinessGroup,
    readinessSinkIds:
      readinessGroup === AdoptionPackReadinessGroup.NONE ? [] : [...SELF_HOST_READINESS_SINK_IDS],
    relativePath,
  };
}

function createReadinessMatrixRecord(
  readinessGroup: AdoptionPackReadinessGroup,
  surfaceIds: string[],
  note: string,
): AdoptionPackReadinessMatrixRecord {
  return {
    readinessGroup,
    applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
    sinkIds: [...SELF_HOST_READINESS_SINK_IDS],
    surfaceIds,
    note,
  };
}

function buildWorkflowSurfaceId(workflowId: string): string {
  return `workflow:${workflowId}`;
}

function buildTemplateSurfaceId(relativePath: string): string {
  return `template:${relativePath}`;
}

function buildRuntimeBootstrapSurfaceId(relativePath: string): string {
  return `runtime_bootstrap:${relativePath}`;
}

function buildBuiltinTemplateSourceRef(relativePath: string): string {
  return `builtin://repo-ai-governor/adoption-pack/template/${relativePath}`;
}

function buildBuiltinRuntimeBootstrapSourceRef(relativePath: string): string {
  return `builtin://repo-ai-governor/adoption-pack/runtime-bootstrap/${relativePath}`;
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
  sourceCatalogId = buildTemplateSurfaceId(relativePath),
): AdoptionPackTemplateRecord {
  return {
    relativePath,
    content,
    assetGroup,
    profileIds,
    description,
    sourceCatalogId,
  };
}

function createRuntimeBootstrapTemplateRecord(
  relativePath: string,
  content: string,
  assetGroup: AdoptionPackManagedAssetGroup,
  description: string,
): AdoptionPackRuntimeBootstrapRecord {
  return {
    relativePath,
    content,
    assetGroup,
    profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
    description,
    sourceCatalogId: buildRuntimeBootstrapSurfaceId(relativePath),
  };
}
