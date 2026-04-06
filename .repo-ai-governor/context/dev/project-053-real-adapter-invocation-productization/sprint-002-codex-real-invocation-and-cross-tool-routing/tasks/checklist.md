# checklist

- [x] TK-601 freeze Codex real invocation and cross-tool routing handoff contract
- [x] TK-602 implement Codex real invocation fallback and route handoff hardening
- [x] TK-603 close first-batch multi-tool real invocation routing acceptance
- [x] CR-001 sprint-002-codex-real-invocation-and-cross-tool-routing delegated review loop round 1
  - 2026-04-07：任务创建，状态初始化为 `review_pending`。
  - 2026-04-07：fresh reviewer Aquinas round 1 对 sprint-002 review surface 给出 1 条 actionable finding，指出 dry-run playbook 把“不会改动 governed workspace”表述得过宽；另记录 fallback-surface parity 与 `localModel` preservation coverage 的 residual notes，等待主 agent 复核。
  - 2026-04-07：主 agent 复核 round 1 结论后认可唯一 finding，判定需要把 dry-run 文案收紧为“不会修改 governed repo 内容，但仍会把审计 artifacts 写入 active governor workspace”；fallback parity 保留为 residual note，`localModel` coverage note 进入同窗口补强。
  - 2026-04-07：已完成 accepted finding 修复，同步补入 `OLLAMA` local-model preservation test，并重跑 targeted vitest、`pnpm run build`、`--adapters verify` 与 `--dry-run --trace run`；本轮 CR 收口为 `resolved`。
- [x] CR-002 sprint-002-codex-real-invocation-and-cross-tool-routing delegated recheck loop round 2
  - 2026-04-07：任务创建，状态初始化为 `review_pending`。
  - 2026-04-07：fresh reviewer Schrodinger round 2 clean；当前 review surface 未发现新的 actionable finding，仅保留非 `codex` fallback parity 与 `verify --adapters` 预期 warn 的 residual notes。
  - 2026-04-07：主 agent 在同窗口补跑 `pnpm run check`，将两处 test-only formatter drift 归一化后 gate 通过；由于该变更仅为 formatter 输出且不改变语义，round 2 维持 `resolved`。
- [x] TK-608 sprint-002 exit acceptance and sprint-003 handoff readiness
