# checklist

- [ ] TK-829 isolate a provisional ACP extension seam behind non-canonical internal runtime boundaries
  - 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-003 激活后执行。
  - 2026-04-13：随着 `TK-828` 完成，任务状态切换为 `active`；已新增 `NativeCliExecInternalAcpExtensionSeam` internal-only seam，并通过 root export guardrail 保持其不进入 adapter-sdk public surface；当前等待 sprint-003 delegated CR。
- [ ] TK-830 add guardrails so ACP remains additive non-default and non-public without a separate solution
  - 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-829` 完成后执行。
  - 2026-04-13：随着 `TK-828` 完成，任务状态切换为 `active`；已增加 config guardrail，明确拒绝把 `acp` authoring 成 adapter tool 的 canonical transport，同时保持 ACP 不进入 public support wording；当前等待 sprint-003 delegated CR。
- [ ] TK-831 produce regression and evidence packets for native cli_exec convergence and ACP seam non-regression
  - 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 `TK-830` 完成后执行。
  - 2026-04-13：随着 `TK-828` 完成，任务状态切换为 `active`；internal ACP seam unit test、config public-boundary guardrail test 与 package-level non-regression suite 已准备完成，当前等待 sprint-003 delegated CR。
  - 2026-04-13: TK-831 activated after lining up seam unit tests, config guardrails, and package-level non-regression evidence for sprint-003 review.
- [ ] TK-832 finalize project-098 rollout closeout and delivery evidence handoff
  - 2026-04-13：任务通过 `DA-819` 创建，当前保持 `planned`，等待 sprint-003 与 evidence gate clean 收口后执行。
