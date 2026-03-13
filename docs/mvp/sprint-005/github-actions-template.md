# GitHub Actions Template

- Task: `TK-504`
- Date: 2026-03-14
- Status: done

## Goal

提供一个主流 CI 场景的示例模板，演示如何把当前仓库的治理脚本接入 GitHub Actions。

## Template File

1. `examples/ci/github-actions-governance.yml`

## Flow

模板当前执行以下步骤：

1. Checkout
2. Setup Node.js
3. `npm ci`
4. 执行 `scripts/ci/run-governance-check.sh`
5. 执行 `scripts/ci/render-governance-report.sh`
6. 上传 `.repo-ai-governor/reports/` 作为 artifact

## Tunable Variables

模板通过环境变量暴露：

1. `REPO_AI_GOVERNOR_PROJECT`
2. `REPO_AI_GOVERNOR_SPRINT`
3. `REPO_AI_GOVERNOR_FORMAT`
4. `REPO_AI_GOVERNOR_REPORT_FORMAT`
5. `REPO_AI_GOVERNOR_REPORT_OUT`

## Notes

1. 当前模板以 `doctor + check + report` 为主线，更适合作为 PR 或主分支治理门禁。
2. `review` 与 `review-verify` 脚本已准备好，可在后续 PR 细分场景中接入。

## Artifacts

1. `examples/ci/github-actions-governance.yml`
2. `scripts/ci/run-governance-check.sh`
3. `scripts/ci/render-governance-report.sh`
