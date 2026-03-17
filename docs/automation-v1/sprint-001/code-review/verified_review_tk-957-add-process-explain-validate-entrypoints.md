# Verified Review - TK-957 Add Process Explain Validate Entrypoints

- Status: verified
- Date: 2026-03-17
- Task: `TK-957`

## Scope

复核 `run --explain-process` 与 `run --validate-process` 入口，实现“先校验再执行”并确保校验模式无副作用。

## Findings

1. 无阻断问题。

## Verification Notes

1. 已核对 [command-registry.js](../../../../src/cli/command-registry.js) 与 [index.js](../../../../src/cli/index.js)，确认 explain/validate 选项已注册并接入命令分发。
2. 已核对 [run-command.js](../../../../src/commands/run-command.js)，确认 explain/validate 与恢复参数互斥校验生效，且校验模式不触发派发和审计写入。
3. 已核对 [run-command.test.js](../../../../test/commands/run-command.test.js)，确认 explain/validate 路径与无副作用断言已覆盖。
4. 已核对 [quick-start.md](../../../../docs/quick-start.md)，确认已补充 explain/validate 上手示例。
5. 已执行 `PATH=/opt/homebrew/bin:$PATH npm run check`，门禁通过。

## Conclusion

1. `TK-957` 当前实现可接受，维持 `verified` 状态并可用于本 sprint 收口。
