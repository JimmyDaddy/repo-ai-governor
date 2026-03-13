# Review Verify Command Runtime

- Date: 2026-03-14
- Task: `TK-208`
- Status: done

## Goal

把 `review-verify` 命令从占位输出推进为真实可执行的复核入口，复用 `review` 结果文件和当前治理规则，对同一范围重新校验并把复核结论回写到同一份 CR 生命周期里。

## Delivered

1. 新增 `src/commands/review-verify-command.js`，完成：
   - `--source` 指向已有 `review_<slug>.md` 或 `verified_review_<slug>.md`
   - 默认从 source review 文件解析目标范围
   - 支持 `--path`、`--base`、`--head` 覆盖复核范围
   - 复用 `review` 的目标分析逻辑重新生成 findings
   - 将复核结果追加到同一份 CR 生命周期内容中
   - 将 `review_<slug>.md` 流转为 `verified_review_<slug>.md`
   - 在剩余 findings 清零后，将 `verified_review_<slug>.md` 流转为 `resolved_review_<slug>.md`
2. 更新 `src/cli/index.js`，把 `review-verify` 命令从注册占位切到真实执行逻辑。
3. 新增 `test/commands/review-verify-command.test.js`，覆盖：
   - pending review 文件复核后进入 verified
   - verified review 文件在问题修复后进入 resolved

## Runtime Flow

1. 读取 `governor.yaml` 和当前 CLI 覆盖项。
2. 解析 source review 文件状态与生命周期。
3. 确定复核范围：
   - 优先使用 `--path`
   - 其次使用 `--base` / `--head`
   - 否则回退到 source review 文件里的 `Targets`
4. 通过 Governance Engine 执行 `review-verify` 阶段：
   - 重新计算 findings
   - 生成复核结论
   - 判断生命周期推进方向
5. 重写同一份 CR 内容并按需要重命名到 `verified_...` 或 `resolved_...`。

## Validation Scope

当前 MVP 最小复核重点覆盖：

1. source review 文件是否可被解析和推进状态
2. 复核是否保留原有 verify / resolution log 并追加新结论
3. pending -> verified 和 verified -> resolved 两段生命周期是否可走通
4. 复核输出是否继续沿用 `review` 的 findings 模型和稳定退出码

## Validation

1. `test/commands/review-verify-command.test.js`
2. `npm run check`
3. 当前仓库 55 个测试全部通过

## Follow-up

1. `TK-501` 可以把 `check`、`review`、`review-verify` 的结构化输出统一为一套报告模型。
2. `TK-502` 可直接消费当前 review 与 verify 结果文件，渲染 summary / markdown / json 报告。
