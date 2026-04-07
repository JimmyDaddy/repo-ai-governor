# @repo-ai-governor/config

- Status: baseline
- Date: 2026-03-20
- Scope: `project-001-foundation / TK-005, TK-011`

## Purpose

提供 `governor.yaml` 的最小配置契约与装配入口，确保 CLI/Runtime 在读取配置时复用同一套加载、校验、Profile 解析逻辑。

## Baseline API

1. `ConfigLoader`
   - 从文件加载 YAML 并返回通过 schema 校验的 `GovernorConfig`。
2. `SchemaValidator`
   - 对配置对象执行结构化校验，失败时返回可定位错误。
3. `ProfileResolver`
   - 根据 `requestedProfileId` 或 `activeProfile` 合成最终生效配置。
4. `WorkspaceResolver`
   - 统一解析 `tool_managed/repo_local` 模式下的 `workspaceId/workspaceRoot/configPath`。
   - 解析优先级：`runtime overrides > config.workspace > default(tool_managed)`。
5. `WorkspaceMigrationService`
   - 执行 `copy -> verify -> switch -> rollback` 迁移链路。
   - 迁移失败时输出结构化 step 结果并自动尝试 rollback。
6. `UpgradeSchemaDiffService`
   - 输出 `schema diff -> 迁移建议 -> 人工确认决策` 结果。
   - 支持从 `schemaVersion: 1.0` 升级到 `1.1` 的自动建议草案（例如补齐 `workspace.migrationPolicy`）。
7. `standards` config
   - 允许声明 `official / team / repository` runtime pack sources、`renderTargets`、`projectionTargets` 与 locale defaults，供 `@repo-ai-governor/standards` 的 `StandardsRuntimeLoader` 自动装配。

## CLI Consumption Contract

```ts
import {
  ConfigLoader,
  ProfileResolver,
  GovernorSchemaVersion,
  UpgradeSchemaDiffService,
  WorkspaceMigrationService,
  WorkspaceMode,
  WorkspaceResolver,
} from "@repo-ai-governor/config";

const loader = new ConfigLoader();
const profileResolver = new ProfileResolver();

const config = loader.loadFromFile("./.repo-ai-governor/governor.yaml");
const resolved = profileResolver.resolve(config, process.env.GOVERNOR_PROFILE);

const workspaceResolver = new WorkspaceResolver();
const workspace = workspaceResolver.resolve({
  currentWorkingDirectory: process.cwd(),
  config: resolved.config,
});

const migrationService = new WorkspaceMigrationService();
const migrationPlan = migrationService.plan({
  currentWorkingDirectory: process.cwd(),
  config: resolved.config,
  targetWorkspace: {
    mode: WorkspaceMode.REPO_LOCAL,
  },
});
const migrationResult = await migrationService.execute(migrationPlan);

if (resolved.config.standards) {
  const { StandardsRuntimeLoader } = await import("@repo-ai-governor/standards");
  const standardsLoader = new StandardsRuntimeLoader();
  const standardsRuntime = await standardsLoader.load({
    baseDirectory: process.cwd(),
    standards: resolved.config.standards,
  });
  const renderedTargets = await standardsLoader.renderConfiguredTargets({
    baseDirectory: process.cwd(),
    standards: resolved.config.standards,
  });
  const agentsProjections = await standardsLoader.projectAgents({
    baseDirectory: process.cwd(),
    standards: resolved.config.standards,
  });
}

const upgradeService = new UpgradeSchemaDiffService();
const upgradeReport = upgradeService.analyze({
  sourceConfig: resolved.config,
  targetVersion: GovernorSchemaVersion.V1_1,
});
```

## Standards Runtime Contract

`governor.yaml.standards` 现在承载同一条正式产品路径：

```yaml
standards:
  packSources:
    official:
      - module: "@repo-ai-governor/standards/examples"
        exportName: "workflowReviewGovernancePack"
    team:
      - module: "@acme/governor-standards-team"
        exportName: "teamDeliveryPack"
    repository:
      - module: "./.repo-ai-governor/standards/repository-pack.ts"
        exportName: "repositoryOverridePack"
  renderTargets:
    - human
    - ai
  projectionTargets:
    - targetFile: ".repo-ai-governor/generated/AGENTS.generated.md"
      locale: en-US
  defaultLocale: zh-CN
  fallbackLocale: en-US
```

约束说明：

1. `official / team / repository` 三层 pack source 是标准运行时的唯一 layering 入口。
2. 相对 `packSources.*.module` 与相对 `projectionTargets[].targetFile` 都以 `StandardsRuntimeLoader.load({ baseDirectory })` 的 `baseDirectory` 为解析根。
3. `renderConfiguredTargets()` 返回配置声明的渲染结果，适合 CLI / docs / runtime presenter 消费。
4. `projectAgents()` 返回 `AGENTS.md` projection payload，但不会自动写 root `AGENTS.md`；写回权仍归调用方。

## Notes

1. `json` 机器输出字段不依赖 locale，i18n 配置仅影响人类可读文案渲染。
2. 配置 Profile 只允许覆盖 `workspace` 与 `i18n` 基线字段，避免跨域配置漂移。
3. `i18n.runtimeEngine` 当前固定为 `i18next`，用于显式锁定 runtime 选型。
4. `WorkspaceResolver` 默认按仓库根路径生成稳定 `workspaceId`，并将 `tool_managed` workspace 隔离到仓库指纹目录。
5. `WorkspaceMigrationService` 的 rollback 只恢复 target 侧切换状态；源 workspace 默认保留用于审计与二次恢复。
6. `SchemaValidator` 当前支持 `schemaVersion`：`1.0`、`1.1`；其中 `1.1` 要求显式 `workspace.migrationPolicy`。
7. `UpgradeSchemaDiffService` 生成的 `autoMigratedConfig` 只包含可自动应用建议，`schemaVersion` 变更默认保留人工确认入口。
8. `standards` 配置当前只作为 top-level runtime contract 校验，不进入 profile override，避免把团队/仓库级 pack layering 做成一次命令级临时切换。
