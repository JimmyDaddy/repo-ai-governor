# DA-162 社区 LangGraph vendor adapter 与 package truthfulness 基线

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-162`

## 1. 结论

1. `core-runtime-langgraph` 当前不再隐含“已经内置真实社区 LangGraph runtime”。
2. 正式基线已调整为：`backend shell + optional community vendor binding seam`。
3. 后续 `TK-163/TK-164/TK-165` 可以在这个 truthful seam 上继续推进 graph-first engine 与 sidecar host 产品化。

## 2. 本轮实现

1. 新增 `LangGraphCommunityVendorBinding`：
   - 默认探测 `@langchain/langgraph`
   - 校验最小 required exports：`StateGraph`、`START`、`END`
   - 对外返回 `available/module_missing/export_missing/load_failed` 四类 truthfulness 状态
2. `packages/core-runtime-langgraph/package.json` 已声明 `@langchain/langgraph` 为 optional peer dependency，并将 peer range 对齐当前稳定 `1.x` 版本线。
3. README 已明确：
   - 当前已有的是 LangGraph-oriented backend shell
   - 当前没有完成的是真实 vendor-backed graph execution

## 3. 路由决策

1. 本轮没有改名 `core-runtime-langgraph`。
2. 决策依据：
   - roadmap 已明确继续朝社区 LangGraph 收敛
   - 包名保留有利于减少后续 cutover 噪声
   - truthfulness 通过 optional peer + binding seam + README/contract 明示，而不是通过立即 rename 规避问题

## 4. 后续输入

1. `TK-163` 消费本产物，继续收敛 graph-first execution semantics。
2. `TK-164` 消费本产物，建立 `sidecar + ipc` host 与 transport 基线。
3. `TK-165` 消费本产物，建立 desktop execution surface 与 service ops/release baseline。
