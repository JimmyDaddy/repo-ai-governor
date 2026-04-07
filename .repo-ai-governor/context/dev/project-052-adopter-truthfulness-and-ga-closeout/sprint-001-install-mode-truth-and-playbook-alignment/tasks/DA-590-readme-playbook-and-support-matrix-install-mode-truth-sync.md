# DA-590 README playbook and support matrix install-mode truth sync

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Task: `TK-590`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. Summary

1. 根 README 与双语 local adoption playbook 现统一改用 `dist-binary` 命名，不再混用 `dist` binary / `dist-binary` 两种口径。
2. README、README.zh-CN、双语 playbook 都显式回链到双语 support matrix，避免各自维护独立的安装边界解释。
3. 双语 README / playbook 的 install mode 推荐顺序现统一为：
   - `path`：干净 `pnpm` 目标仓库的默认路径
   - `link`：source-linked governor 开发
   - `dist-binary`：Yarn/npm 或 dirty worktree 的无安装演练
   - `tgz`：需要 registry 的 packaged-install rehearsal

## 2. Key Outputs

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`

## 3. Verification

1. `rg -n "dist-binary|support-matrix|推荐决策顺序|Recommended start order|acceptance contract" README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md docs/support-matrix.md docs/support-matrix.zh-CN.md`
