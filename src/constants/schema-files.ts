export enum SchemaFileNameEnum {
  Shared = "shared.schema.json",
  Governor = "governor.schema.json",
  WorkflowTemplate = "workflow-template.schema.json",
  StandardsPackage = "standards-package.schema.json",
  Slot = "slot.schema.json",
  Adapter = "adapter.schema.json",
  SkillManifest = "skill-manifest.schema.json",
  SkillCatalog = "skill-catalog.schema.json",
}

export const SCHEMA_FILE_NAMES = Object.freeze({
  shared: SchemaFileNameEnum.Shared,
  governor: SchemaFileNameEnum.Governor,
  workflowTemplate: SchemaFileNameEnum.WorkflowTemplate,
  standardsPackage: SchemaFileNameEnum.StandardsPackage,
  slot: SchemaFileNameEnum.Slot,
  adapter: SchemaFileNameEnum.Adapter,
  skillManifest: SchemaFileNameEnum.SkillManifest,
  skillCatalog: SchemaFileNameEnum.SkillCatalog,
} as const);
