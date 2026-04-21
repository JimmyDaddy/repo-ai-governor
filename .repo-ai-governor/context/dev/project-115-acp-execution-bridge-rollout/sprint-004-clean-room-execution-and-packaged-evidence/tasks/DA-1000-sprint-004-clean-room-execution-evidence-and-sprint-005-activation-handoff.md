# DA-1000 sprint-004 clean-room execution evidence and sprint-005 activation handoff

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1000`
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-004-clean-room-execution-and-packaged-evidence`

## 1. Summary

1. sprint-004 已把 ACP execution clean-room evidence 扩展到 source-checkout 与 packaged distribution 场景，并通过同一窗口的 `pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 保留可交付证据。
2. `.tmp/project-115-sprint-004-acp-cleanroom-report.json` 现在同时记录 `acpHostTransportScenarios` 与 `acpExecutionScenarios`，覆盖 routed `invokeStage`、`streamEvents` tool-call replay、permission bridge 与 cancel cleanup。
3. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`、`acp-cleanroom-verification.receipts/**` 与 `acp-cleanroom-verification.provenance/**` 已刷新为当前 sprint-004 report provenance，三种安装模式下的 runtime-service / packaged-distribution evidence 均为 `pass`。

## 2. Current Evidence Boundary

1. clean-room execution evidence 现在可以证明 `acp_exec` 在安装包内的真实执行语义，而不是 `cli_exec` alias 或双执行：
   - routed `invokeStage` 返回 ACP-local session / invocation truth
   - `terminal/create` 与 `fs/read_text_file` 的 `tool_call` replay 顺序稳定
   - permission bridge 可以从 active ACP tool-call metadata 收敛到 live confirmation request
   - cancel path 会返回 `PROCESS_RUNTIME_CANCELLED` 且清空 tracked terminal ids
2. support-facing readiness 仍通过现有 `CliAcpHostEvidenceRuntime` 消费 refreshed clean-room summary；本 sprint 不新增单独 execution-summary runtime consumer，避免在 support surface 提前暴露超出当前 rollout claim 的细粒度语义。

## 3. Support Truth Boundary

1. 当前窗口可以保守宣称：
   - runtime-service evidence 已具备
   - packaged distribution evidence 已具备
   - clean-room execution evidence 已具备
2. 当前窗口仍不得宣称：
   - 外部 ACP consumer 已完成真实互操作验证
   - public/support wording 已可以无保留提升为 fully supported external ACP rollout
3. 若 sprint-005 未找到可用的本地 external ACP consumer，允许把 rehearsal 记录为 unavailable optional evidence，但 support wording 仍必须保持保守边界。

## 4. Next Activation Recommendation

1. 下一条建议激活的 implementation stream 固定为 `project-115 / sprint-005-external-interoperability-and-rollout-closeout`，前提仍是当前 sprint 完成 fresh delegated review、accepted finding 修复、`pnpm run check` 与 boundary local commit。
2. sprint-005 必须聚焦：
   - optional external ACP consumer rehearsal
   - support wording uplift / rollout claim boundary review
   - project-115 completion audit 与 active stream closeout
3. 若 reviewer 在 sprint-004 指出 clean-room evidence 与 support summary 之间仍有可执行漂移，应先在 sprint-004 内修复，不把 claim debt 带入 sprint-005。

## 5. Outputs

1. `scripts/release/verify-cleanroom-local-install.js`
2. `package.json`
3. `.tmp/project-115-sprint-004-acp-cleanroom-report.json`
4. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
5. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/`
6. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/`
