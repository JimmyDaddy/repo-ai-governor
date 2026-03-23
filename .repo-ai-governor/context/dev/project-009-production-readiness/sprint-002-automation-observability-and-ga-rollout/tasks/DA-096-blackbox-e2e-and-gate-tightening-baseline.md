# DA-096 黑盒 E2E 与门禁收紧基线产物

- Status: active
- Date: 2026-03-23
- Owner: AI-Agent
- Source Task: `TK-084`
- Version: `v1`

## 1. 目标

建立可复跑的外部用户黑盒路径验证，并收紧关键测试入口的“无测试放行”策略，降低 Stage 9 第二轮中的假阳性通过风险。

## 2. 关键决策

1. 黑盒 E2E 采用真实 CLI 进程边界（`dist/bin/repo-ai-governor.js`）执行，而非 runtime 级单测替代。
2. 黑盒路径固定覆盖两条主链：
   - `init -> doctor -> check`（验证只读接入语义下仓库根目录不被命令链路写入）。
   - `plan -> run -> review -> review-verify -> replay`（通过 `run --replay` 验证 report/replay 闭环）。
3. 收紧关键测试脚本，移除 `test:packages`、`test:contract`、`test:e2e` 的 `--passWithNoTests`，将“未发现测试”从通过态升级为阻断态。

## 3. 实施内容

1. 新增黑盒 E2E：
   - `test/e2e/blackbox-governance-flow.e2e.test.ts`
   - 覆盖路径 A：`init -> doctor -> check` 并断言目标仓库根目录零漂移。
   - 覆盖路径 B：`plan -> run -> review -> review-verify -> run --replay` 并断言 `execution_report/replay_explain` 产物可回链消费。
2. 收紧测试脚本：
   - `package.json` 移除 `test:packages/test:contract/test:e2e` 的 `--passWithNoTests`。
3. 台账同步：
   - `TK-084` 卡片、`checklist.md`、`tasks.csv`、sprint `plan.md` 已同步执行态与完成态记录。

## 4. 验证证据

1. `pnpm run test:e2e -- --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:contract -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `pnpm run check`（通过）

## 5. 消费约束

1. `TK-085/TK-086` 默认消费本产物定义的双黑盒主链，不得回退为仅仓库内 smoke 的自证路径。
2. 后续新增 CLI 主命令或阶段时，需同步补齐黑盒 E2E 链路断言与 `report/replay` 产物回链断言。
3. 若后续需要临时恢复 `passWithNoTests`，必须在同一变更中登记风险窗口、回滚条件与到期收敛任务，禁止静默放宽。
