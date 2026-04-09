# checklist

- [x] TK-658 implement adopt apply installer and materialization pipeline
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：已交付高层 `adopt` command surface 与 installer materialization pipeline，使 adopter 可以直接通过 `adopt apply` 安装整套受管仓库 baseline。
- [x] TK-659 write managed ownership install receipt and adoption metadata baseline
  - 2026-04-09：任务创建，状态初始化为 `planned`。
  - 2026-04-09：installer 已开始写入 install receipt、verification summary 与 managed ownership records，并把 installer metadata truth 固定到 `.repo-ai-governor/adoption/installations/**`。
- [x] TK-669 sprint-002 exit acceptance and sprint-003 handoff readiness
  - 2026-04-09：在 `TK-658` 与 `TK-659` 全部完成后回补 `sprint-002` closeout task，并将下一边界固定为 `sprint-003-complete-pack-content-and-host-materialization`。
  - Closeout task completed: sprint-002 fixed to completed truth.
