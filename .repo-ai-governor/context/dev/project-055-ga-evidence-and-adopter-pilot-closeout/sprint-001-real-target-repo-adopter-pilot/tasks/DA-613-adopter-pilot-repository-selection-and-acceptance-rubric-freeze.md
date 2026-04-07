# DA-613 adopter pilot repository selection and acceptance rubric freeze

- Status: completed
- Date: 2026-04-07
- Project: `project-055-ga-evidence-and-adopter-pilot-closeout`
- Sprint: `sprint-001-real-target-repo-adopter-pilot`
- Task: `TK-613`

## 1. Summary

1. 本轮 adopter pilot 仓库正式冻结为：
   - `/Users/jimmydaddy/study/playground`
   - `/Users/jimmydaddy/study/react-native-image-marker-1.1.x`
2. `playground` 继续承担 simple pilot：验证 link-install 首次接入、`init -> doctor -> check -> verify --adapters -> run --dry-run --trace` 与 timing evidence。
3. `react-native-image-marker-1.1.x` 继续承担 complex pilot：验证 dirty worktree + Yarn/non-pnpm 环境下的 `upgrade preview/apply/rollback` 与 `workspace dry-run/execute/rollback`，并记录 delta findings。

## 2. Selection Rationale

1. 两个仓库都已有历史 adopter pilot 与 GA timing evidence，可与 `project-020`、`project-046` 形成可比证据链，而不是重新引入新的 pilot 变量。
2. `/Users/jimmydaddy/study/playground` 当前仍是极简 Node 仓库，`package.json` 保持 `@cjhdev/repo-ai-governor -> link:/Users/jimmydaddy/study/ai-governor`，适合验证当前正式推荐的 link-install adopter path。
3. `/Users/jimmydaddy/study/react-native-image-marker-1.1.x` 当前仍是 Yarn-managed 复杂仓库，且保留既有 dirty worktree（`example/ios/Podfile.lock`、`example/react-native.config.js`），适合验证最小扰动 dist-binary / workspace rollback 路径。

## 3. Acceptance Rubric

1. Common guardrails
   - 只验证 `docs/support-matrix.md` 与 `docs/local-adoption-playbook.md` 当前正式声明的支持路径，不把 `tgz`、VSIX 或未支持的 packaged surface 混入本轮成功标准。
   - 所有 rehearsal 都必须保留 repo 原始状态；若需要 `workspace execute`，则必须在同窗口完成 rollback 并检查回到初始状态。
2. Pilot-1 success criteria (`playground`)
   - `pnpm install`
   - `pnpm exec repo-ai-governor init --output json`
   - `pnpm exec repo-ai-governor doctor --output json`
   - `pnpm exec repo-ai-governor check --output json`
   - `pnpm exec repo-ai-governor verify --adapters --output json`
   - `pnpm exec repo-ai-governor run --dry-run --trace --output json`
   - 以上命令需全部成功并记录 timing evidence；允许的 warn 仅限 external-adopter baseline 或 adapter environment-gated readiness，不得出现 required-role hard failure。
3. Pilot-2 success criteria (`react-native-image-marker-1.1.x`)
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js init --output json`
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --output json`
   - `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js check --output json`
   - `upgrade preview -> apply -> rollback`
   - `workspace dry-run -> execute -> rollback`
   - 以上路径需全部成功，并证明原 dirty worktree 在 execute/rollback 前后保持不变；rollback 后 repo-local `.repo-ai-governor` 清理结果与 scratch cleanup status 必须被记录。

## 4. Boundaries

1. `TK-614` 只消费 `playground` 的 simple pilot 输入，不再掺入 upgrade/workspace cutover。
2. `TK-615` 只消费 `react-native-image-marker-1.1.x` 的 complex pilot 输入，不再把 install/link path 混入复杂仓库窗口。
3. 本轮 pilot 证据路径预留为：
   - `.tmp/project-055-sprint-001-pilot-1-rehearsal-summary.json`
   - `.tmp/project-055-sprint-001-pilot-2-rehearsal-summary.json`

## 5. Follow-Up Trigger

1. `TK-614` 现在可以启动，并以 `playground` 为唯一 pilot-1 仓库。
2. `TK-615` 在 `TK-614` 不阻塞的前提下继续复用 `react-native-image-marker-1.1.x` 作为 complex pilot。

## 6. Execution Caveat (2026-04-07)

1. `TK-615` 执行过程中，一次误把 `--workspace-root <repo-root>` 传给 `repo_local` 的操作破坏了原冻结的 `react-native-image-marker-1.1.x` working copy 连续性。
2. 因此 `TK-615 / DA-615` 的最终成功结论只能解释为“恢复后 `1.1.x` baseline 的 acceptance rerun 通过”，不能再等价解读为“原冻结 complex pilot repo 在整个执行窗内被完整保留”。
3. `DA-613` 的 success rubric 仍然有效，但 complex pilot 的“保留原始 repo 状态”要求需要结合 `DA-615` 的 execution note 与 delta findings 一起读取。
