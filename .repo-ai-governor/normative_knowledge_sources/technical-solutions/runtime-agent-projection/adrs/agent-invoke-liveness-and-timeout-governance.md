# Agent Invoke Liveness And Timeout Governance ADR

- Status: active
- Date: 2026-04-02
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.agent-invoke-liveness-and-timeout-governance.v1`

## 1. Context

当前 `Codex`、`GitHub Copilot`、`Claude Code` 与 `Ollama` 的 invoke 生命周期仍然主要依赖固定 wall-clock timeout。真实环境已经暴露出 reviewer 等长任务的误伤：agent 在持续执行命令、持续输出状态甚至仍有部分文本推进时，也会因为达到固定上限被直接中断。与此同时，Governor 自己生成的 `still running` 提示并不能表达 child process 或 HTTP stream 是否真的还在推进。

当前仓库已经存在 shared orchestration service execution summary / event stream 契约，CLI embedded、sidecar 与 desktop 都在向这条共享执行面收敛。因此 invoke-liveness 若只停留在 adapter-local telemetry，将无法成为跨 host surface 的稳定真值。

## 2. Decision

1. 保留 hard timeout，但将其降级为最后保险丝，而不是主要异常判定。
2. 将 invoke 生命周期统一拆成四类主信号：
   - process liveness
   - transport activity
   - semantic progress
   - terminal completion
3. 引入统一状态机：
   - `starting`
   - `running`
   - `transport_idle_suspect`
   - `semantic_stall_suspect`
   - `graceful_interrupting`
   - `hard_terminating`
   - `completed/failed/cancelled`
4. system heartbeat 只用于前台可见性，不再计入 transport 或 semantic 续命。
5. 在 suspect stall 后先进入 grace window，先保存 latest assistant draft / reasoning / tool/todo 快照，再尝试软中断，最后才升级到硬终止。
6. `reviewer/verifier/tester` 的 timeout budget 默认必须明显宽于普通 `direct-answer`。
7. adapter-local liveness snapshot 不是最终事实来源；一旦 invoke 进入 orchestration service 生命周期，最新 liveness 状态必须投影到 execution summary / event stream，供 CLI、sidecar、desktop 与 replay 共享。
8. `doctor/verify` 保持 preflight readiness / auth / route diagnostics 边界；invoke runtime 的 idle / semantic stall / graceful interrupt / hard timeout 解释由 execution diagnostics、event replay 或同等级 runtime artifact 承担。

## 3. Consequences

1. 长 review / verifier / tester 任务不会再因为“运行时间长”而直接被等同于“异常”。
2. diagnostics、interactive shell 与后续 UI 可以明确区分：
   - 仍在运行
   - transport 空闲
   - 语义停滞
   - 正在优雅中断
   - 最终保险丝终止
3. partial output preservation 成为中断前的强约束，failed turn 的 execution details 不再只剩 command output。
4. CLI embedded、sidecar 与 desktop 将共享同一 execution summary / event stream 真值，不再允许 adapter-local liveness 与 service-backed 呈现漂移。
5. 各 adapter 可以继续保留不同底层事件格式，但必须统一投影到同一 liveness contract 与稳定 reason code。
6. `doctor/verify` 不会再把历史 invoke 停滞误表述成即时 probe 健康状态，operator 对 preflight 与 runtime 故障来源的心智会更清晰。
