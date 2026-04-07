# DA-636 sprint-001 closeout and sprint-002 activation handoff

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-636`
- Produced By: `TK-636`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 出口结论

`accept`

`project-052 / sprint-001-install-mode-truth-and-playbook-alignment` 已满足当前 sprint 的退出条件。install-mode 支持真值、README / local adoption playbook / support matrix 对齐、clean-room 与 local distribution 证据、以及 scoped CR loop 收口都已形成可回放事实链，可以作为 `sprint-002` 的正式输入。

本次 closeout 窗口只涉及文档、review artifact 与治理台账写回，未修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下的 executable surface，因此不要求额外 `pnpm run build` 作为本 closeout 的完成证据。

## 2. 验收范围

1. install-mode adopter truth：
   - `path / link / dist-binary / tgz` 的支持边界与 acceptance contract 已冻结。
2. adopter-facing 文档对齐：
   - `README`、双语 local adoption playbook 与双语 support matrix 已统一 install-mode 叙事与推荐顺序。
3. 证据与 review 收口：
   - clean-room install / local distribution rehearsal 已产出最新 evidence。
   - `CR-001` 已修复 accepted finding；`CR-002` 在 repeated reviewer timeout 后按放宽规则完成 fallback local recheck 并 clean。
4. closeout 与切换：
   - `current-context.md` 已切到 `sprint-002`。
   - `sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
   - `TK-592` 已激活为下一条 primary task。

## 3. 出口判定

1. Exit Criteria 1：通过
   - install mode 的正式支持口径已冻结，`DA-589` 与 adopter-facing 文档表述一致。
2. Exit Criteria 2：通过
   - README、local adoption playbook 与 support matrix 已完成双语同步，install-mode truth 不再分叉。
3. Exit Criteria 3：通过
   - `verify-cleanroom-local-install` 与 `verify-local-distribution` 证据已刷新到 `DA-591`。
4. Review Closure：通过
   - `CR-001`、`CR-002` 均已 `resolved`，最新 round 未留下新的 actionable finding。

## 4. sprint-002 激活约束

1. `sprint-002` 只收口 adopter-facing `upgrade / workspace migration / rollback` 路径，不回退到 install-mode truth 重新定义。
2. `TK-592` 先冻结用户路径 contract，再进入 `TK-593` 的实现与文档化。
3. 若后续发现 install-mode truth 与 upgrade/workspace UX 新事实冲突，应先回写 contract truth，再推进实现，不直接跳过到 `TK-593` / `TK-594`。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-589-install-mode-support-matrix-and-acceptance-contract.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-590-readme-playbook-and-support-matrix-install-mode-truth-sync.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-591-cleanroom-and-dist-binary-install-mode-evidence-refresh.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/review/resolved_code_review_working-tree-20260406-2013.md`
5. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/review/resolved_code_review_working-tree-20260406-2032.md`
6. `.repo-ai-governor/context/current-context.md`
7. `.repo-ai-governor/context/completed-streams-history.md`

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`
