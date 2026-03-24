import type { IdeStandardsSourceDescriptor } from "../types/interfaces/ide-command-wrapper.interface.js";

/**
 * Defines stable standards source identifiers injected by IDE and agent surfaces.
 */
export enum IdeStandardsSourceId {
  PRODUCT_REQUIREMENTS_BRIEF = "product_requirements_brief",
  OVERALL_TECHNICAL_SOLUTION = "overall_technical_solution",
  ARCHITECTURE_AND_REPO_LAYERING = "architecture_and_repo_layering",
  CODE_STANDARDS = "code_standards",
  LONG_TERM_MAINTENANCE_GUIDE = "long_term_maintenance_guide",
  AGENTS_PROJECTION = "agents_projection",
}

/**
 * Defines standards source categories used by the self-hosted resolver registry.
 */
export enum IdeStandardsSourceKind {
  PRODUCT = "product",
  SOLUTION = "solution",
  ARCHITECTURE = "architecture",
  GOVERNANCE = "governance",
  PROJECTION = "projection",
}

/**
 * Defines baseline standards source IDs injected for IDE and multi-entry surfaces.
 */
export const IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS = [
  IdeStandardsSourceId.PRODUCT_REQUIREMENTS_BRIEF,
  IdeStandardsSourceId.OVERALL_TECHNICAL_SOLUTION,
  IdeStandardsSourceId.ARCHITECTURE_AND_REPO_LAYERING,
  IdeStandardsSourceId.CODE_STANDARDS,
  IdeStandardsSourceId.LONG_TERM_MAINTENANCE_GUIDE,
  IdeStandardsSourceId.AGENTS_PROJECTION,
] as const;

/**
 * Defines the self-hosted resolver registry used by this repository to map source IDs to files.
 */
export const IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY: readonly IdeStandardsSourceDescriptor[] =
  [
    {
      sourceId: IdeStandardsSourceId.PRODUCT_REQUIREMENTS_BRIEF,
      sourceKind: IdeStandardsSourceKind.PRODUCT,
      defaultSelfHostedPath:
        ".repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md",
      description: "Brief PRD baseline used as the default execution target.",
    },
    {
      sourceId: IdeStandardsSourceId.OVERALL_TECHNICAL_SOLUTION,
      sourceKind: IdeStandardsSourceKind.SOLUTION,
      defaultSelfHostedPath:
        ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md",
      description: "Tool-level implementation north star for runtime and integration work.",
    },
    {
      sourceId: IdeStandardsSourceId.ARCHITECTURE_AND_REPO_LAYERING,
      sourceKind: IdeStandardsSourceKind.ARCHITECTURE,
      defaultSelfHostedPath:
        ".repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md",
      description: "Layering and dependency-boundary blueprint for repository architecture.",
    },
    {
      sourceId: IdeStandardsSourceId.CODE_STANDARDS,
      sourceKind: IdeStandardsSourceKind.GOVERNANCE,
      defaultSelfHostedPath:
        ".repo-ai-governor/normative_knowledge_sources/governance/code_standards.md",
      description: "Repository-level non-negotiable coding and verification rules.",
    },
    {
      sourceId: IdeStandardsSourceId.LONG_TERM_MAINTENANCE_GUIDE,
      sourceKind: IdeStandardsSourceKind.GOVERNANCE,
      defaultSelfHostedPath:
        ".repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md",
      description: "Operational maintenance baseline and startup loading policy.",
    },
    {
      sourceId: IdeStandardsSourceId.AGENTS_PROJECTION,
      sourceKind: IdeStandardsSourceKind.PROJECTION,
      defaultSelfHostedPath: "AGENTS.md",
      description: "AI/IDE execution-entry projection for self-hosted repositories.",
    },
  ] as const;
