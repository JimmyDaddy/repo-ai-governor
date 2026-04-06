# ADR: Adopter Productization Priority And Surface Sequencing

- Status: active
- Date: 2026-04-06
- Module: `runtime.governance-clients`

## 1. Context

当前仓库已经具备较强的 governance、CLI、multi-tool adapter 与 multi-surface foundation，但面向 adopter 的剩余主要风险已不再是“有没有实现”，而是：

1. CLI primary surface 的 install/upgrade/workspace/GA truthfulness 还没有完全收口为统一外部叙事。
2. 多工具 adapter 仍存在“formal support 但真实调用路径不够稳定或不够诚实表达”的边界。
3. non-CLI surface 同时存在 desktop 与 VS Code 两条线，若不显式排序，后续 delivery 容易并发发散。
4. GA evidence、真实 adopter pilot 与 standards runtime productization 都有价值，但不应抢在 primary adopter path 之前。

这意味着当前最需要 formalize 的不是新的 host/package/module boundary，而是后续几个 delivery stream 的优先级与表面排序。

## 2. Decision

正式采用以下 follow-up sequencing：

1. 第一优先级固定为 `CLI adopter truthfulness and GA closeout`。
2. 第二优先级固定为 `real adapter invocation productization`。
3. 当前 secondary surface 固定采取 `VS Code first / desktop foundation`，不并行追求两个同等级产品面。
4. `GA evidence and adopter pilot closeout` 位于 CLI truthfulness 与 adapter real path 之后。
5. `standards runtime loader and pack productization` 位于上述 adopter-facing closeout 之后。
6. `GitHub.com agent target follow-up` 与 `language pack and ecosystem expansion` 保持 deferred，不进入当前 planned stream surface。

## 3. Rationale

1. 当前 adopter 最直接感知的问题仍是“如何稳定安装、升级、迁移、验证以及判断支持边界”，因此 CLI truthfulness 必须先收口。
2. 如果真实 adapter path 迟迟停留在 fixture-backed 或保守表述，产品外部感知会长期停在“治理很强，但真实调用能力仍偏演示”的阶段。
3. secondary surface 先做取舍再做 rollout，可以避免 desktop 与 VS Code 同时争抢 implementation 资源。
4. GA evidence 与 pilot rehearsal 在 truthfulness 和 real path 未稳定前意义有限，太早推进只会重复返工。
5. standards runtime loader / pack 的产品化价值真实存在，但其 ROI 仍低于当前 adopter 主路径。

## 4. Consequences

1. 新的 planning-side lifecycle-managed solution 固定落到 `runtime.governance-clients`，不新增并行 module。
2. delivery handoff 固定从 promotion/decomposition stream 切换到 `project-052-adopter-truthfulness-and-ga-closeout`。
3. `project-053`、`project-054`、`project-055`、`project-056` 作为 planned follow-up stream 登记到 `current-context.md`。
4. `project-057` 与 `project-058` 仅保留在 decomposition handoff 中，不进入 `current-context.md` 的 planned stream surface。
5. 本 ADR formalize 的是 priority order 与 surface sequencing，不自动宣称任何 follow-up implementation 已完成。

## 5. Follow-Up

1. `project-052`: adopter truthfulness and GA closeout
2. `project-053`: real adapter invocation productization
3. `project-054`: VS Code secondary surface rollout
4. `project-055`: GA evidence and adopter pilot closeout
5. `project-056`: standards runtime loader and pack productization
6. Deferred:
   - `project-057-github-com-agent-target-followup`
   - `project-058-language-pack-and-ecosystem-expansion`
