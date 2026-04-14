# sprint-002-verification-profiles-trigger-matrix-and-closeout 计划

- Status: completed
- Date: 2026-04-14
- Sprint Goal: 补齐 focused compatibility verification profile、trigger matrix 与 rollout closeout guidance。
- Project: `project-106-cli-exec-compatibility-and-stability-rollout`
- Upstream:
  - `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-001-compatibility-taxonomy-and-regression-harness/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 1. Scope

1. 将 `cli_exec_compatibility_full / runtime_foundation / adapter_slice` profile 拆成真实 rollout-owned verification route。
2. 固定 trigger matrix，明确 shared runtime、cross-adapter parser 与 single-adapter slice 的执行边界。
3. 产出兼容性基线 evidence pack 与 closeout guidance，供后续 runtime windows 复用。

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-864 | wire focused compatibility verification profiles and trigger-matrix routing without promoting them to governance gates | TK-863 | completed |
| TK-865 | capture compatibility baseline evidence pack and closeout guidance for future runtime windows | TK-864 | completed |
| TK-866 | finalize project-106 closeout and delivery evidence handoff | TK-864、TK-865、activation-time local CR-001 | completed |

## 3. Exit Criteria

1. focused compatibility verification usage 已成为真实 rollout scope，而非留在 ADR 文字层。
2. compatibility baseline evidence pack 与 closeout guidance 已具备独立实施窗口的 handoff 边界。
3. 激活该 sprint 时有清晰的本地 `CR-001` 入口与 project-final closeout 边界。

## 4. Sprint Notes

1. 激活后先预留本地 `CR-001`，再开始 implementation 与 reviewer loop。
2. 当前 sprint 不得把 compatibility profile 变成新的 `governance.execution-gates` contract truth。
3. `TK-866` 负责 project-106 final closeout，但只有在 sprint-002 local `CR-001` clean 后才允许完成。
4. 2026-04-14：sprint-001 clean closeout 后，当前 sprint 已被激活为新的 primary execution surface，`TK-864` 进入执行前准备状态。
5. 2026-04-14：`TK-864` 已落地 compatibility profile runner 与 trigger-matrix routing；`TK-865` 已形成 evidence pack / closeout guidance artifact。
6. 2026-04-14：fresh reviewer round 4 暴露 shared `adapter-sdk` trigger surface 仍是目录级；当前已完成收窄修复与回归覆盖，下一步发起新的 clean recheck。
7. 2026-04-14：fresh reviewer round 5 暴露 adapter-slice 仍包含 contract-only `constants / interfaces`；当前已将 adapter-slice 触发面收窄到真实 runtime entry 与 smoke test，并继续等待新的 clean recheck。
8. 2026-04-14：fresh reviewer round 6 暴露 shared native `cli_exec` internal ACP seam 仍未进入 shared profile、且 `DA-865` 将 adapter-slice 入口写得过宽；当前已补 seam routing、explicit adapter invocation guidance 与回归覆盖，继续等待新的 clean recheck。
9. 2026-04-14：fresh reviewer round 7 暴露 CI `git_range` 分支仍缺少回归保护；当前已补临时 git repo 的 deterministic routing regression，继续等待新的 clean recheck。
10. 2026-04-14：fresh reviewer round 8 暴露 compatibility router 自身与 guarding integration suite 仍可能绕过 baseline；当前已将两者纳入 `cli_exec_compatibility_full` 触发面，并继续等待新的 clean recheck。
11. 2026-04-14：fresh reviewer round 9 暴露显式无效 `--base-ref` 会静默降级到 working-tree mode；当前已改为 fail-fast，并补齐 invalid-base-ref regression coverage 与 handoff guidance。
12. 2026-04-14：fresh reviewer round 10 继续暴露两个路由缺口：explicit invalid `--base-ref` 仍可能被 env base-ref 接管，且 `package.json` 中的 verify entrypoint 改动还不会命中 full profile；当前已补 explicit-ref 优先级修复、`package.json` full-profile routing 与两条 regression coverage。
13. 2026-04-14：fresh reviewer round 11 clean recheck 未发现新的 actionable finding；当前 sprint-002 implementation boundary 已达到 closeout-ready，下一步继续在该 surface 上执行 project-final fresh review。
14. 2026-04-14：native `cli_exec` timeout/abort partial-output preservation 的 full-gate flake 已通过 focused stabilization、`pnpm run build` 与 `pnpm run check` 重新转绿；当前继续保留 active closeout surface，并等待 latest fresh clean recheck 结论后再执行最终收口。
15. 2026-04-14：project-final `CR-020` latest fresh clean recheck 未发现新的 actionable finding；`TK-866` 已完成 completion audit、delivery registry、completed stream history 与 next-project activation write-back，当前 sprint 正式收口为 `completed`。
