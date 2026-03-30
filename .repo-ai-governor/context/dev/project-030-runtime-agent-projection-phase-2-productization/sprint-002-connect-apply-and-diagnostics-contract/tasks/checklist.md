# checklist

- [x] TK-424 implement connect diff, apply, and rollback receipt workflow
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：`sprint-002` 激活后转为 `active`，开始实现 `connect diff/apply` 入口与 rollback/apply receipt workflow。
  - 2026-03-30：完成 `connect diff` / `connect apply`、`--latest` / candidate path 解析、source fingerprint guard、rollback snapshot、apply receipt，以及 CLI integration coverage。
- [x] TK-425 emit candidate diff and merge explain artifacts
  - 2026-03-30：任务创建，状态初始化为 `planned`。
  - 2026-03-30：完成 candidate diff JSON/Markdown、merge explain artifacts 与 diagnostics companion contract，并通过 targeted tests 与 `pnpm run build`。
