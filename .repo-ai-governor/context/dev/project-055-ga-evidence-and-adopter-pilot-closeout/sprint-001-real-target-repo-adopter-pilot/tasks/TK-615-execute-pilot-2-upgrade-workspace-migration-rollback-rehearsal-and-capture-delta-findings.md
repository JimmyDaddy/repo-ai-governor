# TK-615 execute pilot-2 upgrade workspace migration rollback rehearsal and capture delta findings

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-615`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`

## 1. 任务目标

在 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 上执行 pilot-2 upgrade/workspace migration/rollback rehearsal，并记录 delta findings。

## 2. Depends On

1. `TK-613`
2. `DA-613`

## 3. 预期产物

1. `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`
2. pilot-2 rehearsal
3. delta findings
4. rollback evidence

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/plan.md`
3. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/TK-613-freeze-adopter-pilot-repository-selection-and-acceptance-rubric.md`
4. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-613-adopter-pilot-repository-selection-and-acceptance-rubric-freeze.md`
5. `docs/local-adoption-playbook.md`
6. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`
3. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`

## 6. 实施计划

1. 在 `TK-613` 冻结的 rehearsal boundary 内使用 `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 作为唯一 pilot-2 仓库。
2. 顺序执行 upgrade / workspace migration / rollback rehearsal，并记录 delta findings。
3. 汇总 rollback evidence、问题分类与后续建议。

## 7. Development Verification

1. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js init --output json`
2. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --output json`
3. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js check --output json`
4. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js upgrade --output json`
5. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js upgrade apply <report-path> --confirm-upgrade approve --output json`
6. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js upgrade rollback <apply-receipt-path> --output json`
7. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js workspace dry-run --workspace-mode repo_local --output json`
8. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js workspace execute --workspace-mode repo_local --output json`
9. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --output json`
10. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js workspace rollback <plan-path> --output json`
11. `cd /Users/jimmydaddy/study/react-native-image-marker-1.1.x && node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --output json`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-613` 完成。
2. 2026-04-07：`TK-613 / DA-613` 已冻结 pilot-2 边界，当前任务切换为 `in_progress` 并开始 `react-native-image-marker-1.1.x` complex rehearsal。
3. 2026-04-07：一次误把 `--workspace-root <repo-root>` 传给 `repo_local` 的操作把目标根错误解析成仓库根目录；随后已用现有本地 `react-native-image-marker` clone 的 `origin/1.1.x` 重建 `react-native-image-marker-1.1.x`，并恢复两条 baseline dirty files 以继续本轮 acceptance run。
4. 2026-04-07：最终 acceptance run 使用默认 `repo_local` 解析语义重新执行 `upgrade preview/apply/rollback` 与 `workspace dry-run/execute/rollback`，恢复后 baseline 的 rerun 全链路成功，总耗时 `5326ms`。
5. 2026-04-07：`git status --short --branch` 在 execute/rollback 前后保持一致，dirty worktree 仍为 `example/ios/Podfile.lock` 与 `example/react-native.config.js`；`doctor` 在 execute 后切到 `workspaceMode=repo_local`，rollback 后恢复 `tool_managed`。
6. 2026-04-07：repo-local `.repo-ai-governor` 在 execute 后存在、rollback 后被移除，`scratch_cleanup_status=removed`，说明历史 `workspace_migration_scratch_cleanup_gap` 已不再复现。
7. 2026-04-07：本任务的成功结论仅覆盖“恢复后 1.1.x baseline 的 rerun”窗口；原冻结 complex pilot worktree 未能在整个执行窗内保持连续不变，这一点已在 `DA-615` 中单独记录。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-055-ga-evidence-and-adopter-pilot-closeout/sprint-001-real-target-repo-adopter-pilot/tasks/DA-615-pilot-2-rehearsal-delta-findings-and-rollback-evidence.md`
2. `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`
3. `.tmp/project-055-sprint-001-pilot-2/workspace-execute.stdout.json`
4. `.tmp/project-055-sprint-001-pilot-2/workspace-rollback.stdout.json`
5. `/Users/jimmydaddy/.repo-ai-governor/workspaces/430e90943d37/.repo-ai-governor/context/workspace/1775535819607-tool_managed-to-repo_local.rollback.json`
