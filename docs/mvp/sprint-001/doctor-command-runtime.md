# Doctor Command Runtime

- Status: done
- Date: 2026-03-13
- Task: `TK-105`

## Scope

为 `repo-ai-governor doctor` 提供首个可执行的仓库自检实现，覆盖运行时环境、主配置加载、标准目录结构检查以及安全目录修复。

## Implemented Behavior

1. 检查 Node.js 版本是否满足 `package.json` 中的 `engines.node` 约束。
2. 检查主配置文件是否存在，并尝试加载 resolved config。
3. 检查 `AGENTS.md`、`.repo-ai-governor/` 目录及 `docs/<project>/sprint-xxx/` 标准目录与关键文件是否存在。
4. `--strict` 会把 warning 视为失败；普通模式下仅 error 导致非零退出。
5. `--fix` 仅自动创建安全的缺失目录，不会覆盖或重写已有文件。
6. 支持 `summary`、`markdown`、`json` 输出格式，其中 JSON 会返回结构化检查结果。

## Verification

1. `/opt/homebrew/bin/npm run test`
2. `/opt/homebrew/bin/node ./bin/repo-ai-governor.js doctor --cwd <tmp> --format json`
3. `/opt/homebrew/bin/node ./bin/repo-ai-governor.js doctor --cwd <tmp> --fix --format json`
