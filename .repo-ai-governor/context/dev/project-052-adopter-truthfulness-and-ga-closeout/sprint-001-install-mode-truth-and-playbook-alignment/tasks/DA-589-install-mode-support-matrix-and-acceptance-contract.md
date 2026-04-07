# DA-589 install mode support matrix and acceptance contract

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Task: `TK-589`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`
- Sprint: `sprint-001-install-mode-truth-and-playbook-alignment`

## 1. Summary

1. install mode 的正式支持边界现统一为 `path`、`link`、`dist-binary`、`tgz` 四类入口。
2. `path` 被固定为干净 `pnpm` 目标仓库的默认推荐路径。
3. `link` 保持正式支持，但只面向需要让目标仓库跟随本地 governor 源码变化的 source-linked 开发场景。
4. `dist-binary` 被固定为脏工作树或非 `pnpm` 目标仓库的首选无安装演练路径，并明确它只证明 CLI/runtime 行为，不等于 package install surface 已经成立。
5. `tgz` 的支持边界被收紧为“可访问 npm registry 的 packaged-install rehearsal”；offline / self-contained tarball install 继续保持不支持。

## 2. Canonical Truth Surfaces

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `README.md`
4. `README.zh-CN.md`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`

## 3. Acceptance Contract

1. `Supported` 只表示“文档声明的基线命令链可以在对应前置条件下复现”，不扩张为所有目标仓库和所有依赖条件都无差异支持。
2. `path` 与 `link` 的 package install 路径默认建立在目标仓库可用 `pnpm` 的前提下。
3. `dist-binary` 不触碰目标仓库依赖图，因此是 Yarn/npm 或 dirty worktree 的正式首选路径。
4. `tgz` 只用于 packaged-install rehearsal；若安装环境无法访问 registry，应回退到 `path`、`link` 或 `dist-binary`。

## 4. Follow-On Dependencies

1. `TK-590` 直接消费本 contract，同步 README、local adoption playbook 与 support matrix 的外部 adopter 叙事。
2. `TK-591` 以本 contract 决定哪些 clean-room 与 local distribution 命令能算作 sprint-001 closeout evidence。

## 5. Verification

1. `rg -n "dist-binary|tgz|path|link|acceptance contract|Acceptance Contract" README.md README.zh-CN.md docs/local-adoption-playbook.md docs/local-adoption-playbook.zh-CN.md docs/support-matrix.md docs/support-matrix.zh-CN.md`
