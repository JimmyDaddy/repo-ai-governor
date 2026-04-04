# project-046-p1-product-surface-and-delivery-closure 计划

- Status: completed
- Date: 2026-04-05
- Stage Mapping: P1 product-surface closure / delivery completeness / adopter readiness
- Phase Mapping: Desktop artifact contract / adapter support truth / standards runtime loader / CI template publication / GA readiness final closure
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
  - `.repo-ai-governor/context/current-context.md`
  - `docs/support-matrix.md`
  - `docs/ga-readiness-evidence.zh-CN.md`
  - `apps/desktop/README.md`
  - `packages/standards/README.md`
  - `packages/adapters/local-model/README.md`

## 1. 目标

1. 将 `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md -> P1` 的五项缺口转成一条正式 product-delivery primary stream，并在同一执行窗口内完整收口。
2. 为 desktop 补齐 service-owned `artifact / review / transcript` query seam，使 renderer 能通过 typed contract 消费真实查询结果，同时继续禁止 filesystem bypass。
3. 将 adapter 正式支持口径、standards runtime loader、GitLab/Jenkins 官方模板与 GA readiness 最后一个 conditional 统一收口为可验证产物。

## 2. Sprint 细化

## 2.1 sprint-001-p1-five-gap-closure

- Status: completed
- Sprint Goal: 在同一 sprint 内完成 backlog 指定的五个 P1 任务，并补齐验证、review 与 project closeout 证据。
- Task Package: `TK-551`、`TK-552`、`TK-553`、`TK-554`、`TK-555`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-551 | sprint-001 | close desktop artifact pane query contract and typed renderer consumption | desktop/query-contract | project-044 desktop foundation + orchestration service client | completed |
| TK-552 | sprint-001 | strengthen formal adapter support matrix and local-model positioning evidence | adapter/support-truth | TK-551 independent | completed |
| TK-553 | sprint-001 | land standards runtime loader and governor config assembly contract | standards/runtime-loader | config baseline + standards package baseline | completed |
| TK-554 | sprint-001 | publish official GitLab CI and Jenkins templates for P1 baseline | ci/template-publication | release baseline + support matrix truth | completed |
| TK-555 | sprint-001 | close GA readiness signal #1 with normalized onboarding timing evidence | ga/evidence-closure | support matrix truth + pilot evidence references | completed |

## 4. 依赖产物策略

1. Desktop renderer 只能消费 service-owned DTO / query seam，不得直读 `.repo-ai-governor/**` 文件系统。
2. Standards runtime loader 必须建立在 `governor.yaml` 结构化配置真值上，不得用 README 示例替代运行时 contract。
3. Adapter support matrix 与 GA readiness evidence 需要中英双文档保持同步，避免对外 truthfulness 漂移。
4. GitLab / Jenkins 模板需保持最小官方模板口径，覆盖 install、quality gate、release governance 基础链路，不扩大为完整平台适配矩阵。

## 5. DoD（project-046）

1. Desktop `artifact pane` 已从 deferred note 升级为 typed query contract 消费面，且仍保留 no-filesystem-bypass 边界。
2. `docs/support-matrix*.md` 已明确 `codex / github-copilot / claude-code / local-model / desktop` 的正式支持口径与证据来源。
3. `packages/standards` 已具备从 `governor.yaml.standards` 自动装配 `official / team / repository` pack 的 runtime loader contract，并有真实测试覆盖。
4. 仓库内已新增可复用的 GitLab CI 与 Jenkins 官方模板资产。
5. `docs/ga-readiness-evidence*.md` 已将 signal #1 从 conditional 收口为 pass，并记录统一的 onboarding timing rows。

## 6. 里程碑记录

1. 2026-04-05：用户要求在 `P0` 完成后，按当前项目任务执行流程继续把 backlog 指定的五个 `P1` 任务全部执行完成。
2. 2026-04-05：创建 `project-046-p1-product-surface-and-delivery-closure`，并激活 `sprint-001-p1-five-gap-closure` 作为新的 primary stream。
3. 2026-04-05：完成 `TK-551 ~ TK-555` 的 code/docs/config/template/evidence 收口，验证通过 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check:desktop-entry-smoke`。
4. 2026-04-05：项目完成态审计摘要已记录为 [project-046-p1-product-surface-and-delivery-closure-completion-audit-summary.md](./project-046-p1-product-surface-and-delivery-closure-completion-audit-summary.md)。
