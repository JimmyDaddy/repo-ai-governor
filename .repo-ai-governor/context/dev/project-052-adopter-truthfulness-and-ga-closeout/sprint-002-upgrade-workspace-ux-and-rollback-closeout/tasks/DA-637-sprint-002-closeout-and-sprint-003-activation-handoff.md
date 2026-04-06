# DA-637 sprint-002 closeout and sprint-003 activation handoff

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-637`
- Produced By: `TK-637`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 出口结论

`accept`

`project-052 / sprint-002-upgrade-workspace-ux-and-rollback-closeout` 已满足当前 sprint 的退出条件。upgrade/workspace adopter truth、repo-external acceptance evidence、troubleshooting guidance、以及 scoped CR loop 收口都已形成可回放事实链，可以作为 `sprint-003` 的正式输入。

本次 closeout 窗口继承了 `CR-001` 同窗口内对 `apps/cli/test/cli-output-contract.integration.test.ts` 的最小安全修复，因此 closeout 结论沿用该轮已通过的同窗口 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check` 作为完成证据。

## 2. 验收范围

1. contract and docs truth：
   - `upgrade` 的正式 adopter 路径已冻结为 `preview -> apply -> rollback`
   - `workspace` 的正式 adopter 路径已冻结为 `dry-run -> execute -> rollback`
2. acceptance evidence：
   - `.tmp/project-052-sprint-002-command-rehearsal-summary.json` 已记录 repo-external upgrade/workspace rehearsal 成功结果
3. troubleshooting and review closure：
   - `docs/local-adoption-playbook*.md` 与 `docs/support-matrix*.md` 已收口 troubleshooting / acceptance truth
   - `CR-001` 已在两次 fresh reviewer timeout 后按放宽策略完成 fallback local recheck，并修复唯一 accepted finding
4. activation handoff：
   - `current-context.md` 已切到 `sprint-003`
   - `sprint-002` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`
   - `TK-595` 已激活为下一条 primary task

## 3. 出口判定

1. Exit Criteria 1：通过
   - `upgrade / workspace migration / rollback` 的正式用户路径、artifact hand-off 与 rollback truth 已冻结。
2. Exit Criteria 2：通过
   - adopter-facing 文档与 repo-external acceptance evidence 已形成可操作闭环。
3. Exit Criteria 3：通过
   - troubleshooting、acceptance 与 scoped CR output 已形成统一 closeout 输入。
4. Review Closure：通过
   - `CR-001` 已 `resolved`，最新 round 未留下新的 actionable finding。

## 4. sprint-003 激活约束

1. `sprint-003` 只收口 GA support truthfulness evidence schema、maintainer validation 与 project closeout，不回退到 sprint-002 重新定义 upgrade/workspace UX contract。
2. `TK-595` 先冻结 evidence schema 与 maintainer cross-link contract，再进入 `TK-596` 的统一 truth surface 汇总。
3. 若后续发现 sprint-002 truth 与 GA evidence 新事实冲突，应先回写 GA truth surface，再推进 `TK-596 / TK-597`。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-592-upgrade-workspace-migration-rollback-user-path-contract-freeze.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-593-upgrade-preview-apply-rollback-and-workspace-migration-closeout-path.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-594-upgrade-and-workspace-ux-troubleshooting-and-acceptance-closeout.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/review/resolved_code_review_working-tree-20260406-2143.md`
5. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
6. `.repo-ai-governor/context/current-context.md`
7. `.repo-ai-governor/context/completed-streams-history.md`

## 6. 验证

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-worktree-review-target.js`
8. `pnpm run check`
