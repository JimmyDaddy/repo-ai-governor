# Init Command Bootstrap

- Status: done
- Date: 2026-03-13
- Task: `TK-104`

## Scope

为 `repo-ai-governor init` 提供首个可落盘的仓库初始化实现，覆盖主配置、adapter 模板、`AGENTS.md` 和当前项目/sprint 的基础任务目录。

## Implemented Behavior

1. 支持从默认配置、CLI 参数和可选主配置路径生成初始化计划。
2. 支持 `--dry-run` 预览待创建目录与文件，不落盘。
3. 默认生成 `.repo-ai-governor/governor.yaml`、`.repo-ai-governor/adapters/*.yaml`、`AGENTS.md`。
4. 默认生成 `docs/<project>/sprint-xxx/` 下的 `index.md`、`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 和 `code-review/` 目录。
5. 检测已有目标文件，未显式传入 `--force` 时拒绝覆盖。
6. 初始化文案已抽离为独立模板模块，为后续 i18n 和模板覆盖扩展预留接口。

## Verification

1. `/opt/homebrew/bin/npm run test`
2. `/opt/homebrew/bin/node ./bin/repo-ai-governor.js init --cwd <tmp> --project mvp --sprint sprint-001 --adapter codex --format json --dry-run`
3. `/opt/homebrew/bin/node ./bin/repo-ai-governor.js init --cwd <tmp> --project mvp --sprint sprint-001 --adapter codex --format json`
