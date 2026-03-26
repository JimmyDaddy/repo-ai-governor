# Memory Provider Loading Contract

- Status: active
- Date: 2026-03-26
- Contract ID: `contract.memory-provider.loading.v1`
- Producer Module: `runtime.memory-provider-loading`

## 1. 目标

定义 memory provider 选择、allowlist、host surface 与 fail-closed truthfulness 的最小契约。

## 2. Minimum Fields

1. `provider_id`
2. `module_specifier`
3. `export_name`
4. `host_surface`
5. `runtime_mode`
6. `options`
7. `resolution_outcome`
8. `summary`

## 3. Behavioral Constraints

1. 默认模式必须支持 built-in provider 与 optional plugin 的区分。
2. 不允许无约束地执行任意 module specifier。
3. provider contract 校验失败必须 fail-closed。
4. `host_surface` 与 `runtime_mode` 必须对 CLI、desktop host 与 service-backed runtime 保持稳定 machine-readable 语义。

## 4. Consumers

1. `runtime.orchestration`

## 5. Compatibility

1. `v1` 不要求 provider 自带版本协商。
2. `v1` 保持 `host_surface / runtime_mode` 为稳定 machine-readable 字段。
3. `v1` 允许 `summary` 作为 diagnostics / health / execution list 的共享裁剪视图。
