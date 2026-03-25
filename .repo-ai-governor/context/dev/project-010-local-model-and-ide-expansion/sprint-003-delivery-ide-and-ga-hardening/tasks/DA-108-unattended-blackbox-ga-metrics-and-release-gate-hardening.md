# DA-108 黑盒 E2E、CI/release gate 与 GA 指标收口

- Status: active
- Date: 2026-03-24
- Owner: AI-Agent
- Artifact ID: `DA-108`
- Produced By: `TK-108`
- Scope: `project-010-local-model-and-ide-expansion`

## 1. 目的

将 Stage 9 的黑盒主路径、受限网络降级路径、release gate 和 GA 指标沉淀为同一份可复跑、可回链、可阻断的稳定性基线。

## 2. 关键实现

1. 新增 `scripts/ci/stage9-blackbox-ga-lib.js`，统一封装 Stage 9 黑盒场景夹具、repo-local task fixture、HITL resume 路径和本地模型 mock server。
2. 新增 `scripts/ci/run-stage9-blackbox-ga-baseline.js` 与 `pnpm run test:stage9-blackbox-ga`：
   - 生成 `.tmp/ci/stage9-blackbox-ga/stage9-blackbox-ga-report.json`
   - 以阻断语义校验 Stage 9 场景矩阵
   - 输出统一 GA 指标快照
3. 将 Stage 9 baseline gate 接入 `check`：
   - `package.json` 新增 `gate:stage9-blackbox-ga`
   - `turbo.json` 将该 gate 挂入 `//#gate:check`
4. 保持黑盒 E2E 真实 CLI 进程边界，并在 [blackbox-governance-flow.e2e.test.ts](/Users/jimmydaddy/study/ai-governor/test/e2e/blackbox-governance-flow.e2e.test.ts) 新增 Stage 9 task-driven delivery 路径断言。
5. release 侧完成回链：
   - `release-governance-policy.json` 将 `stage9_blackbox_ga_report` 纳入 GA 最小审计证据，并通过 `auditEvidenceSources` 显式声明 report path 与 `requiredStatus=passed`
   - `run-rollback-rehearsal.js` 现在会消费并校验该外部证据，不再因缺少 scenario mapping 让 unified gate 稳定失败
   - `check-ga-candidate-unified-gate.js` 改为从 policy 解析同一 report source，并在 report 缺失或 `status!=passed` 时阻断
   - `check-release-ready.js` 将新脚本、package script 与 `auditEvidenceSources` 配置形态纳入发布资产检查
   - `release-governance-spec.md` 已同步 Stage 9 GA 证据与回放基线，消除 policy/spec 漂移

## 3. 场景矩阵

1. `unattended-delivery-rehearsal`
   - blackbox task-driven `run`
   - 断言 inline review、delivery rehearsal、report/replay 全链路可用
2. `hitl-approve-resume-delivery`
   - migration 风险命中后消费 `approve -> resume` 决策回执
   - 断言 HITL notification / decision receipt / delivery rehearsal 仍在同链路回放
3. `restricted-network-local-fallback-success`
   - 通过 compiled `runCli()` + localhost mock local model 验证 restricted-network local fallback takeover
4. `provider-outage-retry-exhausted`
   - 验证 provider outage / retry exhaustion 时 runtime 进入失败态并留下 diagnostics/report/replay 证据

## 4. GA 指标快照

指标来源：`pnpm run test:stage9-blackbox-ga` 在当前运行窗口生成的 `.tmp/ci/stage9-blackbox-ga/stage9-blackbox-ga-report.json`

1. `time_to_first_success_ms`: `96`
2. `unattended_success_rate`: `0.6667`
3. `human_intervention_rate`: `0.25`
4. `fallback_rate`: `0.25`
5. `delivery_rehearsal_pass_rate`: `1`

## 5. Gate 集成结果

1. `pnpm run check`
   - 现在包含 `gate:stage9-blackbox-ga`
   - 任一 Stage 9 blackbox 场景失败会直接阻断
2. `pnpm run release:ga-check`
   - 通过 `ci:quality -> check` 间接消费该 baseline
3. `pnpm run release:ga-candidate-unified-gate`
   - 现在要求 Stage 9 blackbox GA report 可检索且 `status=passed`，否则 unified gate 失败
4. `pnpm run release:rollback-rehearsal`
   - 现在会把 `stage9_blackbox_ga_report` 作为外部审计证据一并校验，确保 rollback rehearsal 与 unified gate 消费同一份 GA supporting report

## 6. 关键产物

1. `DA-108` 本文档
2. 运行时 Stage 9 blackbox GA supporting report：`.tmp/ci/stage9-blackbox-ga/stage9-blackbox-ga-report.json`
3. `resolved_code_review_tk-108-unattended-blackbox-ga-metrics-and-release-gate-hardening.md`

## 7. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:stage9-blackbox-ga`
5. `pnpm run release:rollback-rehearsal`
6. `pnpm run release:ga-candidate-unified-gate`
7. `pnpm run release:ga-check`
8. `pnpm run check`

## 8. 结论

1. `TK-108` 已完成 Stage 9 黑盒/GA/release gate 的最小生产化收口。
2. 复核 follow-up CR 后，release policy、rollback rehearsal、unified gate 与 release governance spec 已重新对齐，不再存在 Stage 9 证据缺口导致的稳定失败路径。
3. 后续 `TK-112` 可直接消费 `DA-107 + DA-108`，不再需要重新定义 delivery 与 GA 指标基线。
