# checklist

- [x] TK-520 freeze upgrade controlled apply state machine and artifact contracts baseline
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` command 的状态机冻结与 contract 对齐，不在本任务里直接实现 apply path。
  - 2026-04-04：开始执行；先同步 `current-context`、project/sprint plan 与 sprint 台账真值，然后对读 `upgrade` contract、`upgrade-command` 与 companion runtime/input surface。
  - 2026-04-04：已冻结 `upgrade` 的 action/confirmation/apply-readiness/apply-status/verify-status/rollback-source/receipt artifact id 等有限集合，并补齐 `main.ts` 参数解析、command registration 与 runtime option seam，为 `TK-521/TK-522` 提供单写源实现边界。
- [x] TK-521 implement upgrade explicit confirm controlled apply and verify receipts
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` explicit confirm / controlled apply / verify receipt 实现。
  - 2026-04-04：已实现 `upgrade preview -> explicit confirm -> apply -> verify receipt` 闭环；apply 现在要求 preview report linkage、source drift 校验与 `--confirm-upgrade approve|reject`，并在 verify 失败时保留恢复证据。
- [x] TK-522 add upgrade rollback execution path interactive shell presenter and regression acceptance
  - 2026-04-04：任务创建，状态初始化为 `planned`；承接 `upgrade` rollback / presenter / regression acceptance 收口。
  - 2026-04-04：已补齐 `upgrade rollback` execution path、rollback/verify receipt、React shell / pretty output / i18n explainability，以及 preview/apply/rollback 定向回归与 build evidence。
  - 2026-04-04：任务完成；已补齐 upgrade rollback execution path、receipt baseline、React shell / pretty output explainability 与定向回归证据。
