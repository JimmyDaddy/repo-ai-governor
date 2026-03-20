export const ZH_CN_TRANSLATIONS = {
  cli: {
    app: {
      description: "仓库级 AI 治理命令行工具。",
    },
    options: {
      locale: "指定人类可读输出的语言。",
      profile: "执行命令前应用的配置 profile 标识。",
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
      executed:
        "命令 '{{command}}' skeleton 已执行。locale={{locale}}，profile={{profile}}，configSource={{source}}，workspaceMode={{workspaceMode}}，workspaceModeSource={{workspaceModeSource}}，workspaceId={{workspaceId}}，workspaceRoot={{workspaceRoot}}，memoryStoreEngine={{memoryStoreEngine}}，memoryStoreRoot={{memoryStoreRoot}}，memoryStoreProvider={{memoryStoreProvider}}。",
    },
    errors: {
      unexpected: "CLI 执行失败 [{{code}}]：{{message}}",
    },
  },
} as const;
