# Example Slot Package

- Task: `TK-303`
- Date: 2026-03-14
- Status: done

## Goal

提供两份官方示例插槽资产，帮助仓库在不引入 `TK-302` 运行时加载能力的前提下，先具备可复制、可启用、可被验收脚本引用的插槽样例。

## Package Contents

1. `examples/slot-packages/official/official-security-review.yaml`
   - 面向 `review` 与 `review-verify`
   - 提供安全审查关注点
2. `examples/slot-packages/official/official-documentation-output.yaml`
   - 面向 `plan` 与 `report`
   - 提供文档产出约束
3. `examples/slot-packages/official/README.md`
   - 说明复制路径与启用方式

## Integration Path

推荐接入步骤：

1. 复制 YAML 文件到目标仓库 `.repo-ai-governor/slots/`
2. 在 `governor.yaml` 中启用相应 `slots.enabled`
3. 结合 `scripts/acceptance/run-mvp-acceptance.sh` 或样例 CI 场景验证

## Boundary

1. 当前交付的是“示例插槽包资产”，不是 `TK-302` 的插槽自动发现运行时。
2. 验收仓库通过复制文件和显式启用来引用这些示例，而不是依赖自动扫描。

## Code Artifacts

1. `examples/slot-packages/official/README.md`
2. `examples/slot-packages/official/official-security-review.yaml`
3. `examples/slot-packages/official/official-documentation-output.yaml`
4. `test/slots/example-slot-package.test.js`
