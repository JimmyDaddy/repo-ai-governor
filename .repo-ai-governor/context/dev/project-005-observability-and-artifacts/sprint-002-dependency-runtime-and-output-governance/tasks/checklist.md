# checklist

- [ ] TK-050 CLI 输出契约与 non-TTY 自动降级基线
- [ ] TK-051 i18n parity/fallback 门禁与 output_locale 回放定位基线
- [ ] TK-052 审计隐私治理（保留/脱敏/导出删除）基线
- [ ] TK-053 project-005 出口验收与 project-006 输入约束
- [x] TK-054 Artifact Registry 单一事实源与人类视图收敛
  - 2026-03-21：任务创建，状态初始化为 `planned`，补充 sprint-002 中关于 artifact registry 收敛的独立维护任务。
  - 2026-03-21：任务启动，状态切换为 `in_progress`，开始将 `dependency-artifact-registry.md` 降级为 guide，并补充基于 CSV 的人类视图渲染入口。
  - 2026-03-21：完成 guide/index/view script 收敛与 `DA-059~DA-061` 依赖关系校准，`test:integration`、artifact lifecycle、task ledger、sprint status 与 `pnpm run check` 通过，状态切换为 `completed`。
- [x] TK-055 Artifact Registry triad canonical-source 同步
  - 2026-03-21：任务创建，状态初始化为 `planned`，补充 triad/brief 对 Artifact Registry canonical source 与 rendered view 的产品级口径同步。
  - 2026-03-21：任务启动，状态切换为 `in_progress`，开始同步 PRD、brief、overall、architecture 中的 artifact registry 事实源定义与落盘示意。
  - 2026-03-21：完成 triad/brief 文档同步与日期刷新，并通过 `check-docs-triad-sync`、`run-normative-loading-manifest-gate`、task ledger、sprint status 与 `pnpm run check`，状态切换为 `completed`。
