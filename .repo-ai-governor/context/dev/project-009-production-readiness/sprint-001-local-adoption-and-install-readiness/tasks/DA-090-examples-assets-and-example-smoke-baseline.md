# DA-090 examples 资产与 example smoke 门禁基线

- Status: active
- Date: 2026-03-22
- Producer Task: `TK-078`
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 目标

建立根级 `examples/` 可执行示例基线，并将 example smoke 接入阻断门禁，避免示例与主实现、治理 gate、外部消费契约矩阵和支持矩阵长期漂移。

## 2. 交付内容

1. 根级 `examples/` 目录已建立并纳入发布文件清单。
2. 示例覆盖已补齐：
   - `single-role-minimal-flow`
   - `multi-role-collaboration-flow`
   - `hitl-escalation-flow`
   - `restricted-network-degrade-flow`
3. 每个示例均包含：
   - 输入
   - 命令
   - 预期输出
   - 排障
4. 每个示例均补齐可执行资产：
   - `scenario.json`（机器可执行命令链路）
   - `fixtures/input.md`（固定输入约束）
   - `expected/runtime-baseline.json`（运行基线断言）
5. 完整闭环位置已在多角色示例中显式标注：
   - `review -> review-verify -> ledger backfill`
6. 受限网络示例已显式标注边界：
   - `read-only attach`
   - `tool_managed` / `repo_local`

## 3. 门禁与阻断语义

1. 新增 example smoke 脚本：
   - `scripts/examples/check-examples-smoke.js`
   - `scripts/examples/check-examples-runtime.js`
2. 新增命令：
   - `check:examples-doc-smoke`
   - `check:examples-runtime-smoke`
   - `gate:examples-doc-smoke`
   - `gate:examples-runtime-smoke`
3. `turbo` 门禁图已接入 `//#gate:examples-smoke`（doc）与 `//#gate:examples-runtime-smoke`，并纳入 `//#gate:check`。
4. 触发阻断条件：
   - 根级 `examples/` 缺失。
   - 必需示例文档缺失或结构不完整（输入/命令/预期输出/排障）。
   - 示例命令与 CLI 当前命令契约不一致。
   - 示例缺失完整闭环与边界说明（`review-verify` / `ledger backfill` / `read-only attach` / workspace mode）。
   - 示例与 `requiredGateScripts`、外部消费契约矩阵或支持矩阵引用不一致。

## 4. 外部回链

1. 外部消费契约矩阵：
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. 最小支持矩阵：
   - `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. README/本地采用手册回链入口：
   - `README.md`
   - `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-079-user-docs-and-local-adoption-playbook.md`

## 5. 验证

1. `node ./scripts/examples/check-examples-smoke.js`（通过）
2. `node ./scripts/examples/check-examples-runtime.js`（通过）
3. `pnpm run check`（通过）
