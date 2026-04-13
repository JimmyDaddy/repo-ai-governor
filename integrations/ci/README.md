# integrations/ci Baseline

- Status: active
- Date: 2026-04-13
- Scope: `project-001-foundation / TK-004` + `project-046 / sprint-001 / TK-554`

## Purpose

提供可复用的 CI 基线模板与调用约定，确保本地门禁与 CI 门禁命令一致，避免“双标准”漂移。

## Directory Contract

1. `integrations/ci/github-actions/`: GitHub Actions 模板。
2. `integrations/ci/gitlab-ci/`: GitLab CI 官方模板。
3. `integrations/ci/jenkins/`: Jenkins declarative pipeline 官方模板。
4. 模板最小集合：
   - quality gate：PR / merge-request / 主分支质量门禁
   - release governance：`canary` / `rc` / `ga` 发布治理与失败回滚信号
   - npm publish：面向显式人工触发的 npm 包发布
5. 后续新增 CI 平台模板时，保持同级目录命名并复用同一命令契约。

## Gate Command Contract

1. 安装依赖：`pnpm install --frozen-lockfile`
2. Stage9 handoff 显式消费：`pnpm run check:stage9-handoff`
3. 质量门禁：`pnpm run check`
4. 可选增强：`pnpm run ci:quality`

## Release Channel Contract

1. canary：`pnpm run release:check` + `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`
2. rc：`pnpm run release:candidate`
3. ga：`pnpm run release:ga-candidate-unified-gate -- --output <report>`
4. ga 失败时：`pnpm run release:rollback-rehearsal -- --output <report>`

## Publish Contract

1. 发布前校验：`pnpm run release:check`
2. 发布包准备：`pnpm run release:prepare-npm-cli-publish -- --output <dir>`
3. tarball 校验：`npm pack --dry-run <dir>`
4. live publish：`npm publish --provenance --access public --tag <dist-tag>`

## Template Set

1. GitHub Actions
   - `github-actions/quality-gate.yml`
   - `github-actions/release-governance.yml`
   - `github-actions/publish-npm-cli.yml`
2. GitLab CI
   - `gitlab-ci/quality-gate.gitlab-ci.yml`
   - `gitlab-ci/release-governance.gitlab-ci.yml`
3. Jenkins
   - `jenkins/Jenkinsfile.quality-gate`
   - `jenkins/Jenkinsfile.release-governance`

## High-Risk Change Reminder

CI 工作流属于高风险变更类型。变更模板或接线策略时，应在任务记录中补充风险说明和回滚路径。
