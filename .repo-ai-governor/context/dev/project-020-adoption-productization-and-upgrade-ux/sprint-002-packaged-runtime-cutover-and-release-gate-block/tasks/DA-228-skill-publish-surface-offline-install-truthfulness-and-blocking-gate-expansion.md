# DA-228 skill publish surface offline install truthfulness and blocking gate expansion

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-228`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-002-packaged-runtime-cutover-and-release-gate-block`

## 1. Summary

1. `.codex/skills/` 已被固定为 canonical publish path，并通过 `package.json#files` 正式进入 tarball surface。
2. `verify-local-distribution.js` 已扩围到 docs/skills/support-matrix truthfulness：
   - tarball 必须包含双语 playbook
   - tarball 必须包含 `.codex/skills/` 下的 repo-local skill assets
   - README / playbook 必须显式声明 `tgz` 依赖 npm registry，且不是 offline/self-contained install
3. clean-room `tgz` 验证已再次通过，证明当前 `sprint-002` 的 cutover 没有破坏 packaged install 主链。

## 2. Key Outputs

1. [package.json](/Users/jimmydaddy/study/ai-governor/package.json)
2. [verify-local-distribution.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js)
3. [release-cleanroom-tgz-validation-report.json](/Users/jimmydaddy/study/ai-governor/.tmp/project-020-tk-227-229/release-cleanroom-tgz-validation-report.json)

## 3. Verification

1. `node ./scripts/release/verify-local-distribution.js`
2. `node ./scripts/release/verify-cleanroom-local-install.js --modes tgz --iterations 1 --output .tmp/project-020-tk-227-229/release-cleanroom-tgz-validation-report.json`
