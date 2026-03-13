# CI Invocation Contract

- Task: `TK-503`
- Date: 2026-03-14
- Status: done

## Goal

为当前 CLI 提供稳定的非交互式调用方式、退出码语义和脚本入口，让治理能力可以直接接入 CI 流水线。

## Recommended Defaults

推荐在 CI 中统一附加：

1. `--non-interactive`
2. `--quiet`
3. `--format json`

对于 `review` 与 `review-verify`，当 warning 也应阻断流水线时，额外使用：

1. `--strict`

## Exit Codes

1. `0`
   - 成功完成，或帮助/版本输出正常结束
2. `1`
   - 业务检查失败
   - 例如 `check`、`review --strict`、`review-verify --strict`
3. `2`
   - 配置错误
4. `3`
   - 环境错误
5. `4`
   - 输入错误
6. `5`
   - 内部执行错误

## Provided CI Scripts

1. `scripts/ci/run-governance-check.sh`
   - 运行 `doctor --strict`
   - 运行 `check --write-report`
   - 可选渲染报告
2. `scripts/ci/run-governance-review.sh`
   - 运行 `review`
   - 支持 `REPO_AI_GOVERNOR_FAIL_ON_WARNING=1`
3. `scripts/ci/run-governance-review-verify.sh`
   - 运行 `review-verify`
   - 支持 `REPO_AI_GOVERNOR_FAIL_ON_WARNING=1`
4. `scripts/ci/render-governance-report.sh`
   - 将已有结果渲染为报告文件

## Recommended CI Order

1. `run-governance-check.sh`
2. `run-governance-review.sh`
3. `run-governance-review-verify.sh`
4. `render-governance-report.sh`

## Code Artifacts

1. `src/cli/command-registry.js`
2. `src/commands/review-command.js`
3. `src/commands/review-verify-command.js`
4. `scripts/ci/run-governance-check.sh`
5. `scripts/ci/run-governance-review.sh`
6. `scripts/ci/run-governance-review-verify.sh`
7. `scripts/ci/render-governance-report.sh`
8. `test/ci/ci-scripts.test.js`
9. `test/commands/review-command.test.js`
10. `test/commands/review-verify-command.test.js`
