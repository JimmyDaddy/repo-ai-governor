# @repo-ai-governor/config

- Status: baseline
- Date: 2026-03-19
- Scope: `project-001-foundation / TK-005`

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

## CLI Consumption Contract

```ts
import {
  ConfigLoader,
  ProfileResolver,
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
```

## Notes

1. `json` 机器输出字段不依赖 locale，i18n 配置仅影响人类可读文案渲染。
2. 配置 Profile 只允许覆盖 `workspace` 与 `i18n` 基线字段，避免跨域配置漂移。
3. `i18n.runtimeEngine` 当前固定为 `i18next`，用于显式锁定 runtime 选型。
4. `WorkspaceResolver` 默认按仓库根路径生成稳定 `workspaceId`，并将 `tool_managed` workspace 隔离到仓库指纹目录。
5. `WorkspaceMigrationService` 的 rollback 只恢复 target 侧切换状态；源 workspace 默认保留用于审计与二次恢复。
