export const ZH_CN_TRANSLATIONS = {
  cli: {
    app: {
      description: '仓库级 AI 治理命令行工具。',
    },
    options: {
      locale: '指定人类可读输出的语言。',
      profile: '执行命令前应用的配置 profile 标识。',
      output: '指定输出模式：pretty|plain|json。',
      ui: '指定交互式 UI 模式：none|classic|react|tui。',
      verbosity: '指定输出详细级别：quiet|normal|verbose。',
      compact: '启用更紧凑的 pretty 输出，优先人类快速阅读。',
      noColor: '在 pretty 模式下禁用 ANSI 颜色。',
      adapters: '启用适配器诊断与路由校验范围。',
      fix: '仅执行 safe_local 自动修复（目录/模板配置/本地可写性）。',
      recordLedger: '按显式参数写入任务台账回填产物。',
      taskId: '与 --record-ledger 搭配使用的任务标识。',
      dryRun: '以本地调试模式执行 run 链路，不触发外部副作用动作。',
      trace: '输出分层诊断 trace 产物，便于本地定位问题。',
      replay: '从 report/replay 产物路径回放诊断结果。',
      restrictedNetwork: '模拟受限网络模式，在 run 演练中阻断外部 adapter surface。',
      restrictedReason: '为受限网络演练显式记录原因，并写入诊断与审计产物。',
      noLocalFallback: '在受限网络演练中禁用本地 fallback，用于验证阻断语义。',
      noInteractive: '禁用首次 init 的交互式问答配置，强制使用非交互初始化。',
      workspaceAction: '指定 workspace 命令动作：dry-run|execute|rollback。',
      workspaceMode: '指定 workspace 迁移目标模式：repo_local|tool_managed。',
      workspaceRoot: '指定 workspace 迁移命令使用的目标根路径覆盖。',
      workspacePlan: '指定 rollback 动作使用的 workspace migration plan 产物路径。',
    },
    commands: {
      init: { description: '初始化治理工作区基线。' },
      connect: { description: '生成适配器接入诊断基线。' },
      doctor: { description: '执行环境诊断基线。' },
      check: { description: '执行治理质量检查基线。' },
      run: { description: '执行流程运行时基线。' },
      review: { description: '生成代码评审基线输出。' },
      reviewVerify: { description: '验证代码评审基线输出。' },
      verify: { description: '校验适配器路由 pass/warn/fail 基线。' },
      plan: { description: '生成或更新执行计划基线。' },
      upgrade: { description: '执行工作区与配置升级基线。' },
      workspace: { description: '规划、执行或回滚工作区迁移基线。' },
    },
    skeleton: {
      noProfile: '未设置',
      executed: "命令 '{{command}}' skeleton 已执行。",
    },
    errors: {
      unexpected: 'CLI 执行失败 [{{code}}]：{{message}}',
    },
    adapterDiagnostics: {
      disabledByConfig: '由配置禁用',
      attribution: '归因',
      availability: '可用性',
      reasons: '原因',
      routeBlocked: 'Adapter 路由已阻断',
      routeAttention: 'Adapter 路由需要关注',
      commandMissing: 'surface "{{surface}}" 缺少本地命令 "{{command}}"',
      commandProbeFailed: 'surface "{{surface}}" 命令 "{{command}}" 可执行但探测失败（{{detail}}）',
      probeFailed: 'adapter 探测失败（{{detail}}）',
      credentialMissing: 'surface "{{surface}}" 缺少所需凭据或登录状态',
      healthCheckTimeout: 'surface "{{surface}}" 的健康检查超时',
      healthCheckInvalidResponse: 'surface "{{surface}}" 返回了无效的健康检查响应（{{detail}}）',
      healthCheckFailedRateLimited: 'surface "{{surface}}" 的健康检查当前触发了限流',
      healthCheckFailedQuotaExhausted: 'surface "{{surface}}" 的健康检查因额度耗尽而被阻断',
      healthCheckFailed: 'surface "{{surface}}" 的健康检查失败（{{detail}}）',
      localModelModelMissing: '本地模型 surface "{{surface}}" 缺少已配置模型 "{{model}}"',
      localModelConfigMissing: '本地模型 surface "{{surface}}" 缺少配置字段 "{{missingKeys}}"',
      localModelEndpointUnreachable:
        '本地模型 surface "{{surface}}" 无法访问 endpoint "{{endpoint}}"（{{errorCode}}: {{message}}）',
      localModelProbeInvalidResponse:
        '本地模型 surface "{{surface}}" 从 "{{endpoint}}" 返回了无效探测结果',
      disabledByConfigForSurface: 'surface "{{surface}}" 已被配置禁用',
    },
    adapterVerification: {
      defineRequiredRole: '至少定义一个 adapters.roles 且 required=true 的角色。',
      checkRoleBindings:
        '请检查 adapters.routing.roleBindings 的主备 surface，确保必需角色至少有一个可用 surface。',
      probeUnavailable: '以下工具的探测或登录依赖不可用：{{toolIds}}。',
      installMissingCommands: '请先安装缺失的本地命令后再执行 connect/verify：{{commands}}。',
      probeFailedCommands:
        '部分命令可执行但探测失败（{{commands}}），请手动执行命令确认登录/扩展状态。',
      authenticateAdapters:
        '请先为以下远端 adapter 完成认证或刷新登录状态，再执行 connect/verify：{{credentials}}。',
      investigateHealthChecks:
        '请先排查以下远端 adapter 的健康检查结果，再进行无人值守执行：{{healthChecks}}。',
      pullLocalModels: '请先拉取或修正以下缺失的本地模型，再进行无人值守执行：{{models}}。',
      provideLocalModelConfig:
        '请为以下工具补齐 adapters.tools[].localModel 的 provider、endpoint、model 配置：{{configs}}。',
      checkLocalModelEndpoint:
        '请先确认本地模型 endpoint 可达且 Ollama 服务健康，再依赖 fallback 路由。',
      reviewRoutingPriorities:
        '当前使用降级或 fallback 路由，建议在无人值守执行前复核成本/时延/风险优先级。',
    },
    initShell: {
      bootstrapTitle: '初始化工作区默认项',
      bootstrapIntro: 'React shell 基线已挂载到 stderr；stdout 仍只保留命令结果输出。',
      confirmationTitle: '第 3 / 3 步：确认初始化默认项',
      confirmationPrompt: '确认这些初始化默认项？[Y/n]: ',
      confirmationRestartMessage: '已重新编辑选择，返回第一步继续填写。',
      submitTitle: '正在应用初始化默认项',
      successMessage: '交互式初始化配置已成功应用。',
      workspaceModeTitle: '第 1 / 3 步：工作区模式',
      workspaceModeDescription: '选择 Repo AI Governor 托管工作区元数据的存放位置。',
      workspaceModePromptLabel: '工作区模式 [1=tool_managed, 2=repo_local]（默认 1）: ',
      workspaceModeValidation: '工作区模式只能填写 1、2、tool_managed 或 repo_local。',
      defaultLocaleTitle: '第 2 / 3 步：默认语言',
      defaultLocaleDescription: '选择 CLI 人类可读文案默认使用的语言。',
      defaultLocalePromptLabel: '默认语言 [1=zh-CN, 2=en-US]（默认 1）: ',
      defaultLocaleValidation: '默认语言只能填写 1、2、zh-CN 或 en-US。',
      submittingDescriptor: '正在将 descriptor 值提交给配置模板桥接层。',
      cancelledBySigint: '交互式 shell 已因 SIGINT 取消。',
      failedBeforeApply: '交互式 shell 在应用初始化值前失败。',
      correctWorkspaceMode: '请修正无效的工作区模式后重新输入。',
      correctLocale: '请修正无效的语言值后重新输入。',
    },
    commandMessages: {
      connect: {
        consumeLedgerBackfill: '处理台账回填产物',
        resolveLedgerBackfill:
          '将 context/ledger-backfill/connect 产物回填到 tasks/checklist/tasks.csv。',
        completed: '连接已完成，adapter_status={{adapterStatus}}；诊断文件={{diagnosticsPath}}。',
      },
      doctor: {
        safeLocalFixHint:
          'safe_local 仅会创建可写的 workspace/config/memory 基线路径；不会安装命令、处理 adapter 登录态，也不会拉取本地模型。',
      },
      upgrade: {
        inspectReport:
          '先检查 {{reportPath}}，并将其与 {{autoMigratedConfigPath}} 对比后再决定是否写回配置。',
        confirmItems: '在替换 governor.yaml 之前，先逐条确认所有 confirmation item。',
        keepRollback: '如果后续要写回迁移后的配置，请保留 {{rollbackSnapshotPath}} 作为回滚来源。',
        artifactsGenerated: '升级分析产物已生成。',
        manualConfirmationRequired: '写回升级变更前需要人工确认。',
        noManualConfirmation: '当前分析的升级路径无需人工确认。',
        reviewUpgradeArtifacts: '检查升级产物',
        confirmUpgradeChanges: '确认升级变更',
        retainRollbackSnapshot: '保留回滚快照',
      },
      init: {
        selectWorkspaceMode: '选择工作区模式 [1=tool_managed, 2=repo_local]（默认 1）: ',
        selectDefaultLocale: '选择默认语言 [1=zh-CN, 2=en-US]（默认 1）: ',
        interactiveApplied:
          '\n已应用向导配置：workspace={{workspaceMode}}，defaultLocale={{defaultLocale}}。\n',
      },
      workspace: {
        migrationExecuted: '工作区迁移执行成功；计划文件={{planPath}}。',
        rollbackCompleted: '工作区回滚已完成；回滚产物={{rollbackPath}}。',
        planGenerated: '工作区迁移计划已生成；计划文件={{planPath}}。',
      },
    },
    reactShell: {
      shared: {
        inputs: '输入',
        summary: '摘要',
        attention: '注意事项',
        help: '帮助',
        enabled: '已启用',
        disabled: '已关闭',
        notSet: '未设置',
        shortcuts: '快捷键',
        session: '会话',
        details: '详情',
        lifecycle: '生命周期',
        validationFeedbackRequiresAnotherInputPass: '验证反馈需要再输入一轮。',
        rendersOnStderrOnly: 'React shell 仅渲染到 stderr。',
        enterConfirm: '回车确认',
        restart: 'N 重新开始',
        submit: '回车提交',
        cancel: 'Ctrl+C 取消',
        unmountedState: '已卸载 state={{state}} fallback={{fallback}}',
      },
      footer: {
        stdoutSummaryFollows: 'stdout 摘要紧随其后',
        uiNoneDisablesShell: '--ui none 可关闭壳层',
        workspaceRollbackRestoresPriorState: '--workspace-action rollback 可恢复旧状态',
      },
      connect: {
        title: '连接适配器并采集诊断',
        fields: {
          workspaceRoot: '工作区根路径',
          recordLedger: '记录台账回填',
          taskId: '任务 ID',
        },
        help: {
          stderrBoundary: 'connect 会把 stdout 保留给结果摘要，而共享 React shell 只占用 stderr。',
          ledgerBackfill:
            '当需要把 connect 诊断回填到 sprint 台账时，请组合使用 --record-ledger 与 --task-id。',
        },
        status: {
          verification: '适配器校验状态：{{status}}。',
        },
        message: {
          completed: '连接已完成，adapter_status={{status}}；诊断文件={{diagnosticsPath}}。',
        },
        summary: {
          diagnosticsArtifact: '诊断产物：{{path}}',
          roleTotals:
            '必需角色={{requiredRoles}}；失败={{requiredFailures}}；降级={{degradedRoles}}；fallback={{fallbackRoles}}。',
        },
      },
      workspace: {
        title: '规划或执行工作区迁移',
        fields: {
          action: '工作区操作',
          targetMode: '目标工作区模式',
          targetRoot: '目标工作区根路径',
          planPath: '回滚计划路径',
        },
        actions: {
          dryRun: 'Dry run',
          execute: '执行',
          rollback: '回滚',
        },
        help: {
          stableOutputContract:
            'workspace 会保持机器可读输出契约稳定，同时在共享 React shell 中预览迁移意图。',
          persistPlan: '请保留生成的计划产物，以便需要时通过 rollback 恢复先前的 selector 状态。',
        },
        status: {
          executionCompleted: '工作区迁移执行已完成。',
          rollbackCompleted: '工作区回滚已完成。',
          dryRunCompleted: '工作区迁移 dry-run 已完成。',
        },
        message: {
          executeCompleted: '工作区迁移执行成功；计划文件={{planPath}}。',
          rollbackCompleted: '工作区回滚已完成；回滚产物={{rollbackPath}}。',
          dryRunCompleted: '工作区迁移计划已生成；计划文件={{planPath}}。',
        },
        nextStepTitle: '下一步',
        nextActions: {
          keepPlanRollback:
            '请保留 {{planPath}}，如果新的工作区面不符合预期，可显式执行 rollback。',
          rerunDoctorBeforeAdopt:
            '在将 {{workspaceRoot}} 作为默认工作区面之前，请重新执行 doctor/check。',
          verifyRollbackTargetCleared:
            '请确认 {{workspaceRoot}} 不再作为活动目标后，再重新执行 workspace execute。',
          inspectPlanBeforeExecute: '先检查 {{planPath}}，确认目标工作区根路径后再执行迁移。',
          useExecuteWhenReady:
            '准备切换时，使用相同的 --workspace-mode/--workspace-root 参数执行 --workspace-action execute。',
        },
        summary: {
          migrationId: '迁移 ID：{{migrationId}}',
          primaryArtifact: '主产物：{{path}}',
        },
      },
    },
    output: {
      pretty: {
        checkLabels: {
          upgradeSchemaDiff: '升级 schema diff',
          migrationSuggestions: '迁移建议',
          confirmationItems: '确认项',
          rollbackReference: '回滚参考',
          workspaceAction: '工作区动作',
          workspaceTarget: '工作区目标',
          workspaceScratchCleanup: '工作区暂存清理',
        },
        checkDetails: {
          upgradeSchemaDiff: '差异 {{diffs}} 项，{{source}} -> {{target}}',
          migrationSuggestions: '{{count}} 条建议',
          confirmationItems: '决策 {{decision}}，确认项 {{count}} 条，阻断 {{blocking}} 条',
          workspaceTarget: '模式 {{mode}}，根路径 {{root}}',
          workspaceScratchCleanupRemoved: 'scratch 根目录已移除：{{root}}',
          workspaceScratchCleanupRetained: 'scratch 根目录保留：{{root}}',
        },
      },
    },
  },
} as const;
