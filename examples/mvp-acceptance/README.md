# MVP Acceptance Kit

该目录提供 `TK-505` 的最小验收资产：

1. `request.md`：用于 `plan` 命令的需求输入
2. `acceptance-record-template.md`：验收记录模板
3. `../../scripts/acceptance/run-mvp-acceptance.sh`：一键跑通当前 MVP 闭环的验收脚本

推荐执行：

```bash
./scripts/acceptance/run-mvp-acceptance.sh
```

脚本会：

1. 初始化一个临时仓库
2. 注入 `TK-303` 的示例插槽
3. 跑通 `plan`、`check`、`review`、`review-verify`、`report`
4. 输出验收工作目录，并生成 `acceptance-record.md`
