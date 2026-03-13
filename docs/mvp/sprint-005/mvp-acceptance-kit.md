# MVP Acceptance Kit

- Task: `TK-505`
- Date: 2026-03-14
- Status: done

## Goal

提供一套可重复执行的 MVP 验收资产，验证当前仓库已经实现的 `init -> plan -> check -> review -> review-verify -> report` 闭环。

## Assets

1. `examples/mvp-acceptance/README.md`
2. `examples/mvp-acceptance/request.md`
3. `examples/mvp-acceptance/acceptance-record-template.md`
4. `scripts/acceptance/run-mvp-acceptance.sh`

## Script Behavior

验收脚本会：

1. 创建临时工作目录
2. 初始化治理脚手架
3. 复制并启用 `TK-303` 的示例插槽
4. 生成计划与任务拆解
5. 执行 CI 风格的 `doctor + check`
6. 执行 `review`、两轮 `review-verify`
7. 渲染 Markdown 报告
8. 生成 `acceptance-record.md`

## Verification

新增测试 `test/acceptance/mvp-acceptance-kit.test.js` 会真实调用验收脚本，并检查：

1. `acceptance-record.md` 存在
2. `.repo-ai-governor/reports/acceptance-latest.md` 存在
3. `code-review/` 下出现 `resolved_review_*.md`

## Artifacts

1. `scripts/acceptance/run-mvp-acceptance.sh`
2. `examples/mvp-acceptance/README.md`
3. `examples/mvp-acceptance/request.md`
4. `examples/mvp-acceptance/acceptance-record-template.md`
5. `test/acceptance/mvp-acceptance-kit.test.js`
