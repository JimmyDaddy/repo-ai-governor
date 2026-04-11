# TK-798 uplift adopter docs and playbook wording only when evidence gate passes

- Status: completed
- Date: 2026-04-11
- Owner: AI-Agent
- Priority: P1
- Project: `project-089-local-user-config-and-secret-command-rollout`
- Sprint: `sprint-003-connect-default-consumption-and-surface-discoverability`

## 1. 任务目标

只在 evidence gate 通过时升级 adopter-facing docs / playbook wording，避免 formal module truth 被提前误报为默认可用交付。

## 2. Depends On

1. `TK-797`

## 3. 预期产物

1. evidence packet or gap register
2. gated docs/playbook wording uplift
3. delivery evidence backlink

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `docs/local-adoption-playbook.md`
3. `docs/local-adoption-playbook.zh-CN.md`

## 5. 实施计划

1. 先产出 clean-room / doctor / connect evidence。
2. gate 未通过时保守维持现有 wording。
3. gate 通过后再做受控 uplift 并写回 delivery evidence。

## 6. Development Verification

1. `pnpm run build`
2. evidence-gated docs verification

## 7. Delivery Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. 执行记录

1. 2026-04-11：任务通过 `DA-786` 创建，当前保持 `planned`，等待 `TK-797` 完成后执行。
2. 2026-04-12：evidence gate 已由 `pnpm run build` 与 sprint-003 focused verification suite 通过，当前已完成 CLI README 与 adopter playbook 的受控 wording uplift，并保持 `secret status` / `unsafe-local-file` 的平台 truthfulness。

## 9. 产出

1. `/Users/jimmydaddy/study/ai-governor/apps/cli/README.md`
2. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
