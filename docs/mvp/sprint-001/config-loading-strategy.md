# TK-103 配置加载与合并策略

- Status: done
- Date: 2026-03-13
- Project: `mvp`
- Sprint: `sprint-001`
- Related Task: [tasks/TK-103.md](./tasks/TK-103.md)

## Goal

把 schema bundle 接成统一的运行时配置入口，使 CLI 和后续治理命令可以按稳定顺序加载默认配置、仓库配置、插槽定义、适配器定义、环境变量覆盖和 CLI 覆盖。

## Implementation

当前实现位于：

1. `src/config/errors.js`
2. `src/config/schema/validator.js`
3. `src/config/load-config.js`

其中：

1. `validator.js` 使用 `Ajv2020` 编译 schema bundle，并提供默认配置装配和文档校验。
2. `load-config.js` 负责加载 `governor.yaml`、读取 `slots/` 和 `adapters/` 目录、解析环境变量覆盖、构造 CLI 覆盖，以及输出统一的 resolved config。
3. `errors.js` 负责把类型冲突、重复定义、文件读取失败和 schema 校验失败区分成明确错误类型。

## Layer Order

当前加载顺序如下：

1. built-in schema defaults
2. repository config
3. slot definitions
4. adapter definitions
5. environment override
6. CLI override

说明：

1. slot 和 adapter 定义本身不直接覆写主配置对象，而是作为独立 definition 集合随 resolved config 一起返回。
2. 主配置对象上的字段仍遵循默认值、仓库配置、环境变量和 CLI 覆盖顺序。
3. CLI 当前映射到配置的字段包括 `project`、`sprint`、`locale`、`language`、`preset`、`adapter`。

## Environment Override

环境变量前缀固定为：

```text
REPO_AI_GOVERNOR__
```

映射规则：

1. 使用双下划线 `__` 表示路径层级。
2. 使用下划线风格字段名并在运行时转成 camelCase。
3. 支持基础标量自动转换：
   - `true` / `false`
   - `null`
   - 数字
   - JSON 数组或对象字符串

示例：

```text
REPO_AI_GOVERNOR__EXECUTION__CURRENT_PROJECT=mvp
REPO_AI_GOVERNOR__EXECUTION__CURRENT_SPRINT=sprint-001
REPO_AI_GOVERNOR__REPORTING__FORMATS=["json"]
```

## Conflict Rules

当前实现遵循以下规则：

1. 标量值以后者覆盖前者。
2. 对象按键递归合并。
3. 数组整体替换。
4. 同一路径如果出现对象/数组/标量类型冲突，则直接抛出 `ConfigurationConflictError`。
5. 插槽或适配器目录中如出现重复 `id`，直接失败。
6. 主配置中启用了不存在的 slot 或 adapter 定义，也直接失败。

## Validation

当前测试位于 `test/config/load-config.test.js`，覆盖：

1. CLI 覆盖字段映射
2. defaults + repository + environment + cli 合并
3. 无主配置文件时的默认配置装配
4. 重复 slot `id` 检测
5. 启用不存在 adapter 时的明确报错

配套 smoke：

1. `node ./bin/repo-ai-governor.js doctor --project mvp --sprint sprint-001 --verbose`
2. `REPO_AI_GOVERNOR__EXECUTION__CURRENT_PROJECT=platform REPO_AI_GOVERNOR__EXECUTION__CURRENT_SPRINT=sprint-009 node ./bin/repo-ai-governor.js init --format json`

## Follow-ups

1. `TK-104` 直接复用 `loadResolvedConfig()` 生成初始化模板与只读预览。
2. `TK-105` 直接复用同一入口做配置校验、目录检查和修复建议输出。
3. 后续如需要语言模板默认层，可在 `loadResolvedConfig()` 中插入 schema 默认层之后、仓库配置层之前。
