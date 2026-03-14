# Sprint 008 Checklist

- [x] **TK-304** 预留脚本扩展接口（负责人：Extensibility｜优先级：P1｜截止：2026-05-12｜状态：done）
  - 执行记录：plan=补齐脚本扩展接口约定，并把 schema model config loader runtime summary 和测试一起接入，保持当前版本只声明不执行;result=已在 slot schema 中新增 extensions.scripts 结构，补齐脚本扩展常量与去重校验，让 config loader 拒绝非法 slot 定义，并在 slot runtime 中输出脚本扩展摘要;verify=`PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/schema.test.js && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/config/load-config.test.js && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/slots/slot-model.test.js && PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/node --test test/slots/runtime.test.js`
  - 执行记录：review_delta=已完成 `TK-304` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-304-design-script-extension-interface.md`;verify=复核确认脚本扩展仍停留在接口预留层，不会在当前 runtime 中直接执行
- [x] **TK-405** 编写后续适配路线图（负责人：Ecosystem｜优先级：P1｜截止：2026-05-14｜状态：done）
  - 执行记录：plan=整理第二批适配对象的候选名单 优先级标准 工作量预估和推荐推进顺序，作为下一轮 sprint 输入;result=已新增 `next-wave-adapter-roadmap.md`，覆盖 `Cursor`、`VS Code` 通用工作流、`Cline`、`Roo Code`、API-driven mode，并给出优先级 rubric 与建议排期;verify=人工核对当前已落地的 `Codex / GitHub Copilot / Claude Code` 样例资产与路线图依赖关系
  - 执行记录：review_delta=已完成 `TK-405` 自检复核，CR 结果落盘为 `code-review/verified_review_tk-405-plan-next-wave-adapter-roadmap.md`;verify=复核确认路线图覆盖范围、优先级标准和工作量预估已满足任务卡验收要求
