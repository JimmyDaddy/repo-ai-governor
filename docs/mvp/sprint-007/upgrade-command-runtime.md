# Upgrade Command Runtime

- Date: 2026-03-14
- Task: `TK-005`
- Status: done

## Goal

补齐 `upgrade` 命令最小版本，让仓库可以对治理配置和生成式入口文件执行可预览、可备份的升级流程。

## What Landed

1. 新增 [upgrade-command.js](/Users/jimmydaddy/study/repo-ai-governor/src/commands/upgrade-command.js)
   - 支持 `--to-version`
   - 支持 `--preview`
   - 支持 `--backup`
   - 输出升级计划、警告和迁移结果
2. 新增 [bootstrap-shared.js](/Users/jimmydaddy/study/repo-ai-governor/src/commands/bootstrap-shared.js)
   - 抽出 bootstrap 模板生成逻辑
   - 复用到 `init`/`upgrade` 两类场景
3. 更新 [index.js](/Users/jimmydaddy/study/repo-ai-governor/src/cli/index.js)
   - 将 `upgrade` 命令接入真实执行链路
4. 新增 [upgrade-command.test.js](/Users/jimmydaddy/study/repo-ai-governor/test/commands/upgrade-command.test.js)

## Runtime Behavior

当前 `upgrade` 最小版本会：

1. 读取现有 `governor.yaml`
2. 校验目标版本是否受支持
3. 生成标准化后的配置、`AGENTS.md` 和 `current-context.md`
4. 在 `--preview` 下只输出计划，不落盘
5. 在 `--backup` 下把被覆盖文件备份到 `.repo-ai-governor/backups/upgrade-<timestamp>/`

## Why This Works

1. 当前 schema 版本仍是 `1`，因此最小升级能力的重点不是跨版本迁移矩阵，而是“规范化 + 生成文件刷新”。
2. 先做 `preview/backup`，可以把风险压到最低，为后续真正的版本升级预留接口。

## Verification

1. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/commands/upgrade-command.test.js`
2. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check`
