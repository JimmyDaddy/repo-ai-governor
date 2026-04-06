# DA-555 normalized onboarding timing evidence

- Status: active
- Date: 2026-04-05
- Owner: AI-Agent
- Task: `TK-555`
- Project: `project-046-p1-product-surface-and-delivery-closure`
- Sprint: `sprint-001-p1-five-gap-closure`

## 1. Summary

1. 已将两条试点仓库 onboarding 链固化为统一 timing row，并写入 `.tmp/project-046-p1-ga-onboarding-timing.json`。
2. `playground-link` 总耗时 `2423ms`（约 `0.04` 分钟），命令链为 `pnpm install -> init -> doctor -> check`。
3. `react-native-image-marker-dist` 总耗时 `1136ms`（约 `0.02` 分钟），命令链为 `dist binary rehearsal -> init -> doctor -> check`。
4. 两条试点链路均显著低于 15 分钟阈值，因此 `docs/ga-readiness-evidence*.md` 已将 signal #1 收口为 `Pass`。

## 2. Evidence

1. JSON timing artifact: `.tmp/project-046-p1-ga-onboarding-timing.json`
2. Simple pilot repo: `<local pilot checkout>/playground`
3. Complex pilot repo: `<local pilot checkout>/react-native-image-marker-1.1.x`

## 3. Notes

1. 复杂仓库沿用 project-020 pilot 的 `dist` binary rehearsal 路径，避免为既有 Yarn / dirty worktree 仓库引入额外 package-manager 变量。
2. `doctor` / `check` 中出现的 external-adopter baseline warnings 继续记录为非阻断已知现象，不影响 onboarding timing signal 的通过结论。
3. 上述试点仓库均来自本地 checkout；如需复现，请在对应试点仓库重新执行文中命令链，并在仓库根目录下重新生成 `.tmp/project-046-p1-ga-onboarding-timing.json`。
