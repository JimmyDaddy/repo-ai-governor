# DA-097 CI 与发布流水线生产化接线产物

- Status: active
- Date: 2026-03-23
- Owner: AI-Agent
- Source Task: `TK-085`
- Version: `v1`

## 1. 目标

将质量门禁与发布候选治理链路接入真实 GitHub Actions workflows，显式消费 `DA-092` 输入约束，并补齐 GA 失败场景的回滚演练信号与审计回链产物。

## 2. 关键决策

1. 将 `integrations/ci` 模板正式落地到 `.github/workflows`，避免“模板存在但生产 workflow 缺失”的治理断层。
2. 新增 `check:stage9-handoff` / `gate:stage9-handoff`，在 CI 与本地门禁中显式校验 `DA-092` 关键约束片段。
3. `release-governance` workflow 统一接线 `canary/rc/ga`：
   - canary：`release:check + test:contract`
   - rc：`release:candidate`
   - ga：`release:ga-candidate-unified-gate`
4. GA 失败场景触发 `release:rollback-rehearsal`，并始终产出 `release-channel-summary.json` 与报告 artifact，形成失败信号与审计回链。

## 3. 实施内容

1. Workflow 生产化落地：
   - `.github/workflows/quality-gate.yml`
   - `.github/workflows/release-governance.yml`
2. CI 模板同步：
   - `integrations/ci/github-actions/quality-gate.yml`
   - `integrations/ci/github-actions/release-governance.yml`
   - `integrations/ci/README.md`
3. 新增 handoff 显式校验脚本：
   - `scripts/ci/check-stage9-handoff-constraints.js`
   - 校验 `DA-092` 中 Stage 9A 结论、黑盒前置、运营指标与 B4 约束。
4. 门禁链路接线：
   - `package.json` 新增 `check:stage9-handoff` 与 `gate:stage9-handoff`。
   - `turbo.json` 将 `//#gate:stage9-handoff` 纳入 `//#gate:check` 依赖图。

## 4. 验证证据

1. `pnpm run check:stage9-handoff`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `pnpm run check`（通过）

## 5. 失败信号与审计回链

1. `release-governance` workflow 对 channel 命令与 rollback 演练分别输出 `exit_code`。
2. workflow `always()` 产出 `.tmp/ci/release/release-channel-summary.json`。
3. workflow `always()` 上传 `.tmp/ci/release/*.json` artifact，确保失败场景可回放。
4. 最终 `Fail workflow on release/rollback failure signals` 步骤统一执行失败判定，避免失败被吞掉。

## 6. 消费约束

1. `TK-086` 默认消费本产物中的 workflow 与失败信号链路，作为 project-009 出口验收的发布治理基线。
2. 后续若调整发布渠道命令，必须同步更新：
   - `.github/workflows/release-governance.yml`
   - `integrations/ci/github-actions/release-governance.yml`
   - `integrations/ci/README.md`
3. 若 `DA-092` 结构发生变化，需同步更新 `check-stage9-handoff-constraints.js` 的必需片段列表，禁止静默绕过。
