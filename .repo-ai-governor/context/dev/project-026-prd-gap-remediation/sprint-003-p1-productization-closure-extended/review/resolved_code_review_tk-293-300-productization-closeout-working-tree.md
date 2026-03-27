# Code Review: TK-293~300 Productization Closeout Working Tree

- Status: resolved
- Date: 2026-03-28
- Reviewer: AI-Agent
- Task: `TK-293/TK-294/TK-295/TK-296/TK-297/TK-298/TK-299/TK-300`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/plan.md`
4. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/sprint-002-p1-productization-closure-baseline/**`
5. `.repo-ai-governor/context/dev/project-026-prd-gap-remediation/sprint-003-p1-productization-closure-extended/**`
6. `README.md`
7. `README.zh-CN.md`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `apps/cli/src/cli-output-presenter.ts`
11. `apps/cli/test/cli-output-presenter.unit.test.ts`
12. `packages/standards/README.md`
13. `packages/standards/src/index.ts`
14. `packages/standards/src/examples/**`
15. `packages/standards/test/standards-projection-parity.integration.test.ts`
16. `packages/standards/test/language-minimal-governance-packs.integration.test.ts`
17. `test/i18n-translation-key-coverage.integration.test.ts`
18. `test/public-package-exports.integration.test.ts`
19. `pnpm-lock.yaml`

## 2. Findings
### 2.1 [P1] pretty 输出会截断带空格的 workspace 路径
- 位置: `apps/cli/src/cli-output-presenter.ts:644`, `apps/cli/src/cli-output-presenter.ts:662`, `apps/cli/src/cli-output-presenter.ts:687`, `apps/cli/src/commands/workspace-command.ts:355`, `apps/cli/src/commands/workspace-command.ts:527`
- 问题描述: 新增的人类可读化逻辑依赖 `parseSpaceSeparatedKeyValueDetail()`，但该解析器直接按空格切分 `key=value` 字符串。`workspace_target` 和 `workspace_scratch_cleanup` 的 detail 都会携带绝对路径；一旦 workspace 根目录或 scratch 目录中包含空格，`root=/Users/me/My Repo` / `scratch_root_retained=/tmp/my scratch` 这类值会在第一个空格处被截断，pretty 输出只保留前半段路径。
- 影响: 对 macOS 或常见“带空格目录名”的仓库路径，rollback / workspace 迁移提示会展示错误路径，直接削弱 `TK-299` 要补强的 adopter-facing 回滚与排障指引。
- 建议: 不要再用空格分隔的扁平字符串承载路径值；改为结构化字段、JSON detail，或至少实现支持带空格值的专用解析格式，并补一条包含空格路径的 presenter 测试。

### 2.2 [P2] README 把安装用户引到了不会随包发布的 `packages/standards/README.md`
- 位置: `README.md:189`, `README.zh-CN.md:189`, `package.json:27`
- 问题描述: 新增“下一步”入口要求用户查看 `packages/standards/README.md` 获取 Python / Go 最小治理模板说明，但根包的 `files` 白名单只发布 `bin`、`dist`、`docs`、`examples` 等目录，并不包含 `packages/**`。因此 path/link 源码用户能看到该文档，tgz / 已发布包用户却拿不到这个路径。
- 影响: 这会让外部 adopter 在按照根 README 操作时遇到死链，和本轮“产品化收口 / adopter 文档回灌”的目标相冲突。
- 建议: 把最小模板说明迁到已发布的 `docs/` 下，或把 `packages/standards/README.md` 纳入发布面；同时保持中英文 README 指向同一已发布路径。

### 2.3 [P2] `workspace_target` 的 pretty-output 测试覆盖了一个真实命令不会产生的状态
- 位置: `apps/cli/src/cli-output-presenter.ts:118`, `apps/cli/src/commands/workspace-command.ts:350`, `apps/cli/src/commands/workspace-command.ts:522`, `apps/cli/test/cli-output-presenter.unit.test.ts:385`
- 问题描述: `renderPrettySuccess()` 只会把 `WARN/FAIL` checks 展示到“关注项”区，但真实 `workspace` dry-run/execute/rollback 都把 `workspace_target` 标为 `PASS`。当前新增单测为了断言这段人类可读化文案，手工把 `workspace_target` 伪造成了 `WARN`，因此测试通过并不能证明真实用户在成功路径里能看到该输出。
- 影响: `TK-299` 声称完成了 workspace adopter UX 可读性补强，但至少这部分文案在真实 success path 里仍然不可见，测试给出了过强的完成性信号。
- 建议: 要么在 pretty success 中显式展示一小组关键 PASS checks（如 `workspace_action` / `workspace_target` / `rollback_reference`），要么把这些信息移入 summary/artifacts/next steps 等真实可见区，并用真实状态补测试。

## 3. Notes
1. `packages/standards` 的最小 Python / Go pack、投影链路增强测试、i18n key 覆盖测试、public package exports 审计测试本身都能跑通。
2. 台账同步、sprint 状态同步和 `Worktree Review Target` 门禁也都通过，说明本轮主要问题集中在 adopter-facing pretty 输出边界和发布面文档路径，而不是台账治理漂移。

## 4. Verification
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-worktree-review-target.js`（通过）
4. `pnpm exec vitest run apps/cli/test/cli-output-presenter.unit.test.ts packages/standards/test/standards-projection-parity.integration.test.ts packages/standards/test/language-minimal-governance-packs.integration.test.ts test/i18n-translation-key-coverage.integration.test.ts test/public-package-exports.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-03-28）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] pretty 输出会截断带空格的 workspace 路径`
   - 判定：**认可**
   - 证据：`workspace_target` / `workspace_scratch_cleanup` 的 pretty 文本最初依赖空格分隔字符串，遇到带空格路径时确实会被截断。
   - 处理：已接受，改为由 `workspace-command` 输出结构化 JSON detail，并让 presenter 先按 JSON 解析再回退到旧格式。

2. `2.2 [P2] README 把安装用户引到了不会随包发布的 packages/standards/README.md`
   - 判定：**认可**
   - 证据：根包 `package.json` 的 `files` 仅发布 `docs/`、`dist/` 等目录，不包含 `packages/**`；外部发布包用户无法依赖该内部 README 路径。
   - 处理：已接受，把最小语言模板入口改回已发布的 `docs/local-adoption-playbook*.md`。

3. `2.3 [P2] workspace_target 的 pretty-output 测试覆盖了一个真实命令不会产生的状态`
   - 判定：**认可**
   - 证据：真实 `workspace` dry-run/execute/rollback 都把 `workspace_target` 标为 `PASS`，原单测通过手工构造 `WARN` 才触发“关注项”展示，不能证明真实 success path 可见。
   - 处理：已接受，在 pretty success path 新增关键成功项展示，并补一条真实 `workspace dry-run` pretty 集成测试。

### 验证命令
1. `pnpm vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-presenter.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/standards/test/language-minimal-governance-packs.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-03-28）

1. `2.1 [P1] pretty 输出会截断带空格的 workspace 路径`：已完成
   - 变更文件：`apps/cli/src/commands/workspace-command.ts`、`apps/cli/src/cli-output-presenter.ts`、`apps/cli/test/cli-output-presenter.unit.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-presenter.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：`workspace_target` / `workspace_scratch_cleanup` 改为结构化 JSON detail，presenter 支持 JSON 优先解析，覆盖带空格路径。

2. `2.2 [P2] README 把安装用户引到了不会随包发布的 packages/standards/README.md`：已完成
   - 变更文件：`README.md`、`README.zh-CN.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`
   - 验证：`pnpm vitest run apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：根 README 已改为只指向已发布的 `docs/` 路径，并把最小语言模板说明回灌到发布面文档。

3. `2.3 [P2] workspace_target 的 pretty-output 测试覆盖了一个真实命令不会产生的状态`：已完成
   - 变更文件：`apps/cli/src/cli-output-presenter.ts`、`apps/cli/test/cli-output-presenter.unit.test.ts`、`apps/cli/test/cli-output-contract.integration.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/cli-output-presenter.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：pretty success path 现在显式展示关键成功项，新增真实 `workspace dry-run` pretty 集成测试，移除了对手工伪造 `WARN` 状态的依赖。

## 后续 Diff Comment 修复（2026-03-28）

1. `apps/cli/src/cli-output-presenter.ts` check id 管理：已完成
   - 处理：新增 `apps/cli/src/constants/cli-command-result-check.constant.ts`，将新增 check id、adapter tool prefix 与 workspace detail key/status 收敛到统一常量源，并把 presenter 的分支判断改为 enum + switch。
   - 说明：解决“能否 enum 管理 / if 是否改 switch”的后续评论，减少 presenter 与 command 侧字符串漂移。

2. `apps/cli/src/cli-output-presenter.ts` / `apps/cli/src/main.ts` pretty 文案 i18n runtime 接入：已完成
   - 处理：为新增 pretty check labels/detail 文案接入 `CliOutputPresenter.translateText(...)`，在 `main.ts` 将 `runtimeI18n.t(...)` 注入 presenter，并补齐 `packages/shared/src/i18n/locales/en-us.ts` / `packages/shared/src/i18n/locales/zh-cn.ts` 中对应翻译键。
   - 说明：解决“这种可以用 i18n runtime 处理么”的后续评论，同时保留 presenter 在无 translator 场景下的 locale fallback。

3. `test/i18n-translation-key-coverage.integration.test.ts` presenter 翻译键覆盖：已完成
   - 处理：将 coverage 扫描范围从 `apps/cli/src/main.ts` 扩展到 `apps/cli/src/cli-output-presenter.ts` 的 `translateText(...)` 调用，确保新增 key 同步受双语资源校验。
   - 验证：`pnpm vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-presenter.unit.test.ts apps/cli/test/cli-output-contract.integration.test.ts test/i18n-translation-key-coverage.integration.test.ts --maxWorkers=1 --maxConcurrency=1 && pnpm run typecheck`（通过）
