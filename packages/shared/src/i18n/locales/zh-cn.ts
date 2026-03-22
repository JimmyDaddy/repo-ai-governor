export const ZH_CN_TRANSLATIONS = {
  cli: {
    app: {
      description: "仓库级 AI 治理命令行工具。",
    },
    options: {
      locale: "指定人类可读输出的语言。",
      profile: "执行命令前应用的配置 profile 标识。",
      output: "指定输出模式：pretty|plain|json。",
      verbosity: "指定输出详细级别：quiet|normal|verbose。",
      noColor: "在 pretty 模式下禁用 ANSI 颜色。",
      dryRun: "以本地调试模式执行 run 链路，不触发外部副作用动作。",
      trace: "输出分层诊断 trace 产物，便于本地定位问题。",
      replay: "从 report/replay 产物路径回放诊断结果。",
    },
    commands: {
      init: { description: "初始化治理工作区基线。" },
      doctor: { description: "执行环境诊断基线。" },
      check: { description: "执行治理质量检查基线。" },
      run: { description: "执行流程运行时基线。" },
      review: { description: "生成代码评审基线输出。" },
      reviewVerify: { description: "验证代码评审基线输出。" },
      plan: { description: "生成或更新执行计划基线。" },
      upgrade: { description: "执行工作区与配置升级基线。" },
    },
    skeleton: {
      noProfile: "未设置",
      executed: "命令 '{{command}}' skeleton 已执行。",
    },
    errors: {
      unexpected: "CLI 执行失败 [{{code}}]：{{message}}",
    },
  },
} as const;
