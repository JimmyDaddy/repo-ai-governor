# TK-006 Command Smoke Checklist

- Status: active
- Date: 2026-03-19
- Type: baseline/checklist
- Producer Task: `TK-006`

## 1. Smoke Gate Commands

1. `pnpm run build`
2. `node ./dist/bin/repo-ai-governor.js --help`
3. `node ./dist/bin/repo-ai-governor.js init --locale en-US`
4. `node ./dist/bin/repo-ai-governor.js review-verify`
5. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run check`

## 2. Pass Criteria

1. `--help` 输出包含 8 个骨架命令：`init/doctor/check/run/review/review-verify/plan/upgrade`。
2. `init --locale en-US` 输出英文 skeleton 文案，并携带 locale/profile/configSource 上下文。
3. `review-verify` 输出中文 skeleton 文案（默认 locale）。
4. smoke 测试与门禁命令均通过，且无台账同步漂移错误。
