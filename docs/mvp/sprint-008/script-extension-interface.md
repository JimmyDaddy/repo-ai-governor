# Script Extension Interface

- Date: 2026-03-14
- Task: `TK-304`

## Goal

为高级用户预留脚本扩展接口，但保持当前 MVP 仍然停留在“声明能力、校验配置、输出运行时摘要”的边界，不把脚本执行本身承诺为正式能力。

## What Landed

1. `slot` schema 新增 `extensions.scripts`
   - 支持 `hook`
   - 支持 `failurePolicy`
   - 支持 `runtime`
   - 支持 `permissions`
   - 支持 `audit`
   - 支持 `isolation`
2. `slot-model` 新增脚本扩展常量与读取能力
   - 暴露脚本扩展 hook / runtime / 权限策略常量
   - 暴露 `listSlotScriptExtensions`
   - 拒绝同一 slot 内重复的 script extension id
3. `loadResolvedConfig` 补齐磁盘配置校验
   - YAML slot 定义中的重复脚本扩展 id 会在加载阶段失败
4. `slot runtime` 只输出扩展摘要
   - 在 active slot summary 中暴露脚本扩展描述
   - 不在 runtime 内执行任何脚本

## Interface Shape

示例：

```yaml
id: docs-output
version: "1"
kind: governance-slot
meta:
  owner: platform
extensions:
  scripts:
    - id: render-doc-index
      hook: after
      failurePolicy: stop
      runtime:
        kind: command
        entry: node ./scripts/render-doc-index.js
        args:
          - --format=markdown
        cwd: .
        timeoutMs: 30000
      permissions:
        filesystem:
          read:
            - docs/**
            - .repo-ai-governor/**
          write:
            - docs/**
        network: forbid
        git: forbid
        secrets: forbid
      audit:
        logKey: docs-output.render-doc-index
        capture:
          - exitCode
          - stdout
          - stderr
      isolation:
        mode: process
```

## Safety Boundary

1. 当前版本不负责执行脚本，只负责描述、校验和向运行时输出声明信息。
2. 默认权限是保守的：
   - `network: forbid`
   - `git: forbid`
   - `secrets: forbid`
3. 即便后续接入真实执行器，也必须保留：
   - 权限显式声明
   - 审计字段
   - 失败策略
   - 隔离模式
4. 当前 `slot runtime` 不会因为声明了脚本扩展而直接拉高自动化能力，避免“文档一加就能执行危险动作”的隐含升级。

## Division Of Responsibility

1. 声明式 slot 继续负责：
   - 触发条件
   - scope
   - 注入信息
   - 检查项
2. 脚本扩展接口只负责补充：
   - 在 slot 命中后可交给未来执行器消费的脚本描述
   - 执行所需的最小安全元数据
3. 这样可以避免重新发明一套与 slot 平行的扩展模型。

## Verification

1. 新增 / 更新：
   - `test/config/schema.test.js`
   - `test/config/load-config.test.js`
   - `test/slots/slot-model.test.js`
   - `test/slots/runtime.test.js`
2. 已验证：

```bash
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/schema.test.js
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/load-config.test.js
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/slots/slot-model.test.js
PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/slots/runtime.test.js
```
