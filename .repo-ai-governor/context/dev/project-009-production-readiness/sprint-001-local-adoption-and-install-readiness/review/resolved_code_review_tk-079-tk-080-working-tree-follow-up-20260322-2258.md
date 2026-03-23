# Code Review: TK-079/TK-080 working tree follow-up

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-079/TK-080`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `AGENTS.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `README.md`
2. `README.zh-CN.md`
3. `CHANGELOG.md`
4. `CHANGELOG.zh-CN.md`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-089-local-installation-modes-and-cleanroom-validation.md`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-091-user-docs-and-local-adoption-playbook-baseline.md`
9. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-079-user-docs-and-local-adoption-playbook.md`
10. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
11. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
12. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
13. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
14. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
15. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

### 2.1 [P1] README / playbook 把 `tgz` 写成可选接入路径，但它仍是已知失败模式

- 位置: `README.md:36`、`README.zh-CN.md:36`、`docs/local-adoption-playbook.md:13`、`docs/local-adoption-playbook.zh-CN.md:13`
- 问题描述: 文档把 `tgz` 列为“recommended for release-like local validation / 接近发布态的本地预演”，但 `DA-089` 和 `TK-080` 明确把 `tgz` 标记为 `deferred (Stage 9B)` / fix-forward。为避免依赖旧台账，我直接复跑了 `node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1`，结果在 `pnpm exec repo-ai-governor --help` 阶段仍报 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`。
- 影响: 用户按 README 的安装选项选择 `tgz` 时，会在最早的启动链路就失败，破坏 `DA-091` 所承诺的“5~15 分钟完成本地安装与初始化验证”，也使 `TK-080` 的文档 readiness 证据带入了已知坏路径。
- 建议: 在 README/本地采用手册中把 `tgz` 明确标为 Stage 9B follow-up 或当前已知限制，不要与 `path/link` 并列为可直接采用的推荐入口；若希望保留示例命令，也应同步附上失败风险和升级前置条件。

### 2.2 [P2] 文档把 `<target-repo>` 的 CLI 步骤和 `<governor-repo>` 的仓库脚本混在一起，未重新声明执行目录

- 位置: `README.md:48`、`README.md:97`、`docs/local-adoption-playbook.md:19`、`docs/local-adoption-playbook.md:91`
- 问题描述: README 和 playbook 先明确要求在 `<target-repo>` 运行 `pnpm exec repo-ai-governor ...`，后续又直接给出 `pnpm run check:examples-*`、`pnpm run check`、`pnpm run release:verify-local`、`pnpm run release:ga-check`，但中间没有重新切回 `<governor-repo>`。这些命令实际上是 governor 仓库根的 package scripts（`package.json` 中定义），不是安装到目标仓库后可在任意接入仓库执行的 CLI 子命令。
- 影响: 接入方按文档顺序操作时，很容易在目标仓库里执行错误的 `pnpm run` 脚本，得到“script missing”或跑到目标仓库自己的同名脚本，从而把 adoption 验证做偏，文档也无法稳定复现 `TK-079/TK-080` 宣称的 readiness 路径。
- 建议: 对每一段命令显式标注执行目录，例如“在 `<target-repo>` 运行 CLI 链路”“回到 `<governor-repo>` 运行 examples/release gates”；或者把仓库维护脚本和接入仓库命令拆成两个小节，避免上下文切换依赖读者自行推断。

## 3. Notes

1. `check:examples-smoke` 与 runtime parity 这两条在当前代码里已经补齐，我复跑 `pnpm run check:examples-smoke` 时确认 doc/runtime 双 smoke 都会执行，因此不再是本轮 finding。
2. `TK-079` 与 `TK-080` 已各自生成 resolved review，但当前 working tree 的新增文档改动仍然存在上述接入可执行性问题，所以本次 follow-up 需要重新进入 `review_pending`。

## 4. Verification

1. `pnpm run check:examples-smoke`（通过）
2. `node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1`（失败：`pnpm exec repo-ai-governor --help` 报 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`）
3. `node ./dist/bin/repo-ai-governor.js doctor --output json`（通过）

## 复核结论（2026-03-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] README / playbook 把 tgz 写成可选接入路径，但它仍是已知失败模式`
   - 判定：**认可**
   - 证据：复跑 `node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1` 仍在 `pnpm exec repo-ai-governor --help` 阶段失败，报 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)`；与 `DA-089` 的 deferred 结论一致。
   - 处理：将 README 与 playbook 中 `tgz` 调整为 Stage 9B follow-up/已知限制，不再与 Stage 9A 推荐路径并列。
2. `2.2 [P2] 文档把 <target-repo> CLI 步骤和 <governor-repo> 仓库脚本混用，未声明执行目录`
   - 判定：**认可**
   - 证据：`check:examples-*`、`release:verify-local`、`release:ga-check` 均定义在 governor 根 `package.json` scripts；在 target repo 直接执行存在 script missing/错跑风险。
   - 处理：在 README 与 playbook 显式区分 `<target-repo>` CLI 链路与 `<governor-repo>` 维护脚本执行目录。

### 验证命令
1. `node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1`（失败，符合已知限制）
2. `rg -n "\"check:examples-doc-smoke\"|\"check:examples-runtime-smoke\"|\"check:examples-smoke\"|\"release:verify-local\"|\"release:ga-check\"" package.json`（通过）

## 修复执行记录（2026-03-22）

1. `2.1 [P1] README / playbook 把 tgz 写成可选接入路径，但它仍是已知失败模式`：已完成
   - 变更文件：`README.md`、`README.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-091-user-docs-and-local-adoption-playbook-baseline.md`
   - 验证：`node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1`（失败，符合已知限制复现）
   - 说明：已把 `tgz` 从 Stage 9A 推荐入口收敛为 Stage 9B follow-up/已知限制，并显式注明当前失败症状与回避策略。
2. `2.2 [P2] 文档把 <target-repo> CLI 步骤和 <governor-repo> 仓库脚本混用，未声明执行目录`：已完成
   - 变更文件：`README.md`、`README.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`rg -n "\"check:examples-doc-smoke\"|\"check:examples-runtime-smoke\"|\"check:examples-smoke\"|\"release:verify-local\"|\"release:ga-check\"" package.json`（通过）
   - 说明：已显式区分 `<target-repo>` CLI 命令与 `<governor-repo>` 维护脚本执行目录，消除命令上下文混淆。
