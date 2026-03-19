# TK-005 Config Contract Baseline

- Status: active
- Date: 2026-03-19
- Type: baseline/contract
- Producer Task: `TK-005`

## 1. Scope

1. 仅定义 Stage 1 所需最小配置契约，不前置实现升级迁移或 workspace 双模式切换执行器。
2. 对外只承诺 `ConfigLoader`、`SchemaValidator`、`ProfileResolver` 三个能力入口。

## 2. Contract Surface

1. `ConfigLoader`
   - 输入：`governor.yaml` 文件路径。
   - 输出：通过 schema 校验的 `GovernorConfig`。
2. `SchemaValidator`
   - 输入：原始配置对象（`unknown`）。
   - 输出：校验通过返回 `GovernorConfig`，失败抛出包含字段定位的错误。
3. `ProfileResolver`
   - 输入：`GovernorConfig` + 可选 `requestedProfileId`。
   - 输出：`ResolvedConfig`，包含最终生效配置与 `profileId`（可用于审计）。

## 3. Schema Baseline

1. 根字段：`schemaVersion`、`workspace`、`i18n`（必填）。
2. 可选字段：`activeProfile`、`profiles`。
3. `workspace.mode` 允许值：`tool_managed`、`repo_local`。
4. `i18n` 至少包含：`runtimeEngine`（当前固定 `i18next`）、`defaultLocale`、`fallbackLocale`、`supportedLocales`。
5. `profiles` 仅允许覆盖 `workspace` 与 `i18n`，防止跨域配置漂移。

## 4. Profile Merge Precedence

1. 选择优先级：`requestedProfileId` > `activeProfile` > 不启用 profile。
2. 合并策略：`profile` 覆盖 `baseConfig` 的 `workspace` 与 `i18n` 局部字段。
3. 兜底策略：命中不存在的 profile 时立即失败，避免静默降级。

## 5. CLI Consumption Interface

1. CLI 应先调用 `ConfigLoader.loadFromFile`，再调用 `ProfileResolver.resolve`。
2. CLI 命令输出应记录 `profileId` 以支持后续审计与回放。
3. 机器可读输出字段保持稳定，不受 locale 文案变化影响。
