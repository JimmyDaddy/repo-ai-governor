# DA-1001 optional external ACP consumer availability and rehearsal disposition

- Status: active
- Date: 2026-04-20
- Owner: AI-Agent
- Task: `TK-1001`
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-005-external-interoperability-and-rollout-closeout`

## 1. Summary

1. 本地 external ACP consumer 可用性检查已完成；当前工作区没有现成可执行的 `paseo`、`a2a` 或 `acp` 命令，也没有仓库内可直接复用的 external-consumer rehearsal scaffold。
2. `npx` 虽然存在，但它只代表潜在的联网安装入口，不构成“本地已有 external ACP consumer”的事实，因此本任务不把它当作可用 rehearsal surface。
3. 按 sprint-005 的保守边界，本轮将 optional interoperability rehearsal 记录为 `unavailable optional evidence`，不通过新安装第三方工具来伪造 availability，也不阻断 project-115 closeout。

## 2. Availability Checks

1. 命令可用性检查：
   - `command -v paseo`
   - `command -v a2a`
   - `command -v acp`
   - `command -v npx`
2. 结果：
   - `paseo`：未找到
   - `a2a`：未找到
   - `acp`：未找到
   - `npx`：存在于 `/opt/homebrew/bin/npx`
3. 本地仓库搜索：
   - `rg -n "Paseo|paseo|external ACP consumer|interoperability rehearsal|acp consumer" . -g '!node_modules' -g '!dist'`
4. 搜索结果没有发现可直接执行的本地 external ACP consumer binary、fixture harness 或 rehearsal playbook。

## 3. Boundary Decision

1. 当前 project-115 的 rollout claim 仍以 internal/runtime-service/packaged-distribution/clean-room evidence 为主，不要求为了 optional rehearsal 额外引入新的本地依赖。
2. 本轮明确不执行以下动作：
   - 不下载或安装新的 third-party ACP consumer
   - 不把 `npx` 临时联网安装解释成“本地已具备 consumer”
   - 不把缺失 external consumer availability 误写成 rollout blocker
3. `TK-1001` 的完成结论因此是：
   - optional external ACP interoperability rehearsal：`unavailable`
   - evidence class：`optional / non-blocking`
   - follow-up requirement：仅在未来出现真实本地 external consumer 时再补做独立 rehearsal

## 4. Impact On Sprint-005

1. sprint-005 可以继续执行 support wording boundary review，但 public/support claim 必须保持保守，不得升级成“external ACP consumer 已完成真实互操作验证”。
2. `TK-1002` 应明确消费本 artifact，并把既有 ACP public wording 维持在 evidence-backed readiness / bootstrap boundary。

## 5. Outputs

1. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/tasks/DA-1001-optional-external-acp-consumer-availability-and-rehearsal-disposition.md`
