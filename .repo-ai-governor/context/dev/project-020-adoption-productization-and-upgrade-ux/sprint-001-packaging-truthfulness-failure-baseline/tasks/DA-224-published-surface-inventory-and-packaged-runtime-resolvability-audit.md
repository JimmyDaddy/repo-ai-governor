# DA-224 published surface inventory and packaged-runtime resolvability audit

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-224`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. Summary

1. 当前 tarball 的 packaged runtime resolvability baseline 是成立的：`node ./scripts/release/verify-local-distribution.js` 通过，`pnpm pack --json` 当前产出 `1275` 个打包文件。
2. 根包对外公开 contract 很窄，但为保证 CLI 与 service-host 在 clean-room 中可运行，tarball 内部实际上携带了一个更大的 runtime carrier surface：
   - `bin.repo-ai-governor -> dist/bin/repo-ai-governor.js`
   - `exports["./service-host"]`
   - `exports["./package.json"]`
   - `dist/apps/cli/**`
   - `dist/node_modules/@repo-ai-governor/**`
   - `dist/packages/published-surfaces/service-host.{js,d.ts}`
   - `examples/**`
   - `integrations/{ide,desktop}/**`
   - `scripts/examples/**`
3. `copy-runtime-assets.js` 的关键作用不是简单复制 build 产物，而是把 workspace 内部包 materialize 成 `dist/node_modules/@repo-ai-governor/*` snapshot，从而避免 clean-room 依赖源码 workspace 路径。
4. 当前最重要的 gap 不再是“内部 package 解析不到”，而是 docs / skills / offline install truthfulness 尚未被正式打进 published surface contract。

## 2. Published Surface Inventory

### 2.1 Declared Public Entry Surface

1. Root binary:
   - `repo-ai-governor -> ./dist/bin/repo-ai-governor.js`
2. Root exports:
   - `./service-host -> ./dist/packages/published-surfaces/service-host.js`
   - `./package.json`
3. Pack allowlist (`package.json#files`):
   - `bin`
   - `dist`
   - `integrations/ide`
   - `integrations/desktop`
   - `skills`
   - `scripts/examples`
   - `examples`

### 2.2 Observed Packaged Runtime Carrier Surface

1. `dist/bin/repo-ai-governor.js` exists and is used by the root `bin` entry.
2. `dist/apps/cli/src/main.js` is packed, so CLI runtime implementation is directly shipped.
3. `dist/node_modules/@repo-ai-governor/*` snapshots are packed for internal runtime package resolution.
4. `dist/packages/published-surfaces/service-host.{js,d.ts}` is packed and matches the root `./service-host` export.
5. `examples/**`、`integrations/ide/**`、`integrations/desktop/**`、`scripts/examples/**` are packed and consumed by current release verification.
6. Root `README.md` and `README.zh-CN.md` are packed.

### 2.3 Notable Non-Public But Packed Implementation Surface

1. `dist/packages/**` is packed alongside `dist/node_modules/**`, which means the tarball carries both package-level compiled mirrors and runtime node_modules snapshots.
2. `bin/repo-ai-governor.ts` is also packed because `files` includes `bin`, even though the actual runtime bin points to `dist/bin/repo-ai-governor.js`.

## 3. Resolvability Audit

1. Current status: `passed`
   - Evidence:
     - `node ./scripts/release/verify-local-distribution.js`
     - `DA-223` network-enabled `tgz` clean-room report
2. Why packaged runtime currently resolves:
   - `copy-runtime-assets.js` writes `dist/node_modules/@repo-ai-governor/*`
   - root tarball includes those internal snapshots
   - `verify-local-distribution.js` explicitly blocks release when required internal path suffixes are missing
3. What this means:
   - the historical `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` claim is no longer the primary packaged-runtime risk
   - internal workspace package resolution is now actively guarded

## 4. Gap Map

1. `docs_truthfulness_gap`
   - Root `README.md` instructs adopters to read `docs/local-adoption-playbook.md`
   - `docs/` is not in `package.json#files`
   - Tarball inspection did not include `docs/local-adoption-playbook.md`
   - Impact: installed package README points to a path not present in the tarball
2. `skills_surface_gap`
   - `package.json#files` declares `skills`
   - repository root has no `skills/` directory; the actual skill assets live under `.codex/skills`
   - Tarball inspection showed no packaged `.codex/skills` or `skills/` payload
   - Impact: skillized onboarding/promotion workflow is not actually shipped with the published package despite the declared intent
3. `offline_self_contained_install_gap`
   - Root tarball keeps external runtime dependencies as registry-resolved `dependencies`
   - `DA-223` confirmed `tgz` install fails under restricted network when `pnpm add <tarball>` cannot resolve `commander/i18next/yaml`
   - Impact: tarball is currently online-install compatible, but not offline/self-contained
4. `gate_coverage_gap`
   - `verify-local-distribution.js` currently asserts:
     - required runtime/internal path suffixes
     - default/plugin-enabled distribution package boundaries
   - It does not assert:
     - README-linked docs actually exist in the tarball
     - skill surface is actually shipped
     - extra packed source payload like `bin/repo-ai-governor.ts` should or should not exist

## 5. Downstream Input Constraints

1. `TK-225` 应将当前 truthfulness 结论表达为：
   - packaged runtime resolvability: currently passing
   - docs/playbook packaging: currently drifting
   - skills publish surface: currently drifting
   - offline/self-contained tgz install: currently unsupported
2. `sprint-002` 若进入 packaged cutover，不应回退到“重新修 internal package resolution”；主目标应转向 docs/skills surface 真值与 install-mode support matrix 收紧。
3. 若决定把 skill surface 作为正式 adopter contract，必须决定：
   - 发布 `skills/`
   - 还是发布 `.codex/skills/`
   - 以及 release gate 应检查哪一条 canonical path
4. 根 `README.md` 与 `docs/local-adoption-playbook.md` 的关系必须在后续 cutover 中统一：
   - 要么把 playbook 打进 tarball
   - 要么 README 改写为仅引用 tarball 内存在的文档入口
