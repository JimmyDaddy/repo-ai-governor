# DA-227 packaged docs truthfulness and root README/playbook cutover

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-227`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-002-packaged-runtime-cutover-and-release-gate-block`

## 1. Summary

1. 根 README、README.zh-CN 与双语 adoption playbook 已完成口径收敛，不再保留旧的 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` 失真描述。
2. `tgz` 当前 truthfulness 已收敛为：
   - online / registry-enabled clean-room install：支持
   - offline / self-contained install：不支持
3. tarball 现在显式包含双语 playbook 与 `.codex/skills/`，因此 README 中的用户可见入口已与真实发布物对齐。

## 2. Key Outputs

1. [README.md](/Users/jimmydaddy/study/ai-governor/README.md)
2. [README.zh-CN.md](/Users/jimmydaddy/study/ai-governor/README.zh-CN.md)
3. [local-adoption-playbook.md](/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md)
4. [local-adoption-playbook.zh-CN.md](/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md)

## 3. Verification

1. `pnpm pack --json --dry-run | rg 'docs/local-adoption-playbook|\.codex/skills'`
2. `node ./scripts/release/verify-local-distribution.js`
