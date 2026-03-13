# TK-102 治理配置 Schema v1

- Status: done
- Date: 2026-03-13
- Project: `mvp`
- Sprint: `sprint-001`
- Related Task: [tasks/TK-102.md](./tasks/TK-102.md)

## Goal

把配置草案升级为可直接消费的 schema bundle，覆盖仓库主配置、插槽配置和适配器配置，并提供默认值策略与本地校验入口。

## Schema Bundle

当前 v1 schema bundle 已落在 `src/config/schema/`：

1. `shared.schema.json`
2. `governor.schema.json`
3. `slot.schema.json`
4. `adapter.schema.json`
5. `index.js`

其中：

1. `shared.schema.json` 提供共享命名规则、路径规则、locale、stage、JSON value 等通用定义。
2. `governor.schema.json` 约束 `.repo-ai-governor/governor.yaml` 的结构、默认值和版本。
3. `slot.schema.json` 约束 `.repo-ai-governor/slots/*.yaml` 的结构。
4. `adapter.schema.json` 约束 `.repo-ai-governor/adapters/*.yaml` 的结构。
5. `index.js` 提供 schema 路径解析和 schema bundle 加载入口，供 `TK-103` 直接复用。

## Defaults Strategy

默认值策略按以下方式固定：

1. 只有 `schemaVersion` 为必填，且 v1 固定为 `"1"`。
2. 其余顶层配置块允许缺省，由 schema 提供默认对象。
3. 路径默认值与 `TK-101` 中的仓库布局规范保持一致。
4. 任务产物默认值与当前 sprint 的 checklist、CSV 和 CR 命名规则保持一致。
5. `automation.permissions`、`reporting`、`artifacts`、`agentEntry` 都已写入默认值，可直接被运行时 validator 消费。

## Validation Strategy

本地校验使用 `Ajv 8` 和 `ajv-formats`：

1. 使用 Draft 2020-12 schema。
2. 通过 `Ajv2020` 编译 schema bundle。
3. 使用 `useDefaults: true` 验证默认值注入是否符合预期。
4. 当前校验样例覆盖：
   - 最小仓库配置
   - 非法 `schemaVersion`
   - 非法 sprint 命名
   - 合法 slot 配置
   - 合法 adapter 配置

对应测试位于 `test/config/schema.test.js`。

## Representative Examples

最小主配置样例：

```yaml
schemaVersion: "1"
project:
  name: repo-ai-governor
execution:
  currentProject: mvp
  currentSprint: sprint-001
```

最小插槽样例：

```yaml
id: security-review
version: "1"
kind: governance-slot
meta:
  name:
    zh-CN: 安全审查
    en-US: Security Review
  owner: platform
```

最小适配器样例：

```yaml
id: codex
version: "1"
type: ide-or-cli
```

## Follow-ups

1. `TK-103` 直接复用 `src/config/schema/index.js` 加载 schema bundle。
2. `TK-104` 用 `governor.schema.json` 驱动初始化模板生成。
3. `TK-105` 用同一 bundle 输出配置校验错误和修复建议。
4. `TK-106` 继续基于 `artifacts` 字段固化项目/sprint 产物目录规范。
