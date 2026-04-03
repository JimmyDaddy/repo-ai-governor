export const ZH_CN_TRANSLATIONS = {
  cli: {
    app: {
      description: '仓库级 AI 治理命令行工具。',
    },
    options: {
      locale: '指定人类可读输出的语言。',
      profile: '执行命令前应用的配置 profile 标识。',
      output: '指定输出模式：pretty|plain|json。',
      ui: '指定交互式 UI 模式：none|classic|react|tui。交互式 TTY 且 pretty 模式下默认使用 react。',
      uiTheme:
        '指定当前命令的一次性 React shell 主题覆盖：governor|catppuccin|calm。默认优先级为 --ui-theme > workspace config > 全局 CLI 偏好。',
      themeScope:
        '指定 set-ui-theme 的主题持久化范围：workspace|global。顶层 set-ui-theme 默认 global，workspace set-ui-theme 默认 workspace。',
      verbosity: '指定输出详细级别：quiet|normal|verbose。',
      compact: '启用更紧凑的 pretty 输出，优先人类快速阅读。',
      noColor: '在 pretty 模式下禁用 ANSI 颜色。',
      adapters: '启用适配器诊断与路由校验范围。',
      fix: '仅执行 safe_local 自动修复（目录/模板配置/本地可写性）。',
      preset:
        '指定 connect 的 onboarding 模板：single-tool-minimal|multi-tool-default|single-tool-all-roles|restricted-network-safe。',
      tools: '指定 connect/doctor/verify onboarding 视图使用的逗号分隔工具列表。',
      overwrite: '允许 connect 候选配置覆盖现有角色/路由片段，而不是只做合并输出。',
      latest: '在 diff/apply 中直接使用最近一次生成的 connect 候选产物。',
      force: '在 connect diff/apply 中绕过 source fingerprint 漂移或 apply-ready blocker 等保护。',
      noRollback: '在 connect apply 中禁用 rollback snapshot，只写 apply receipt。',
      singleToolAllRoles: '指定一个工具，把全部启用 onboarding 角色临时绑定到同一 surface。',
      roleBinding:
        '可重复传入的角色绑定覆盖，格式为 roleId=tool[,fallbackTool...]；也接受 roleProfileId。',
      recordLedger: '按显式参数写入任务台账回填产物。',
      taskId: '与 --record-ledger 搭配使用的任务标识。',
      dryRun: '以本地调试模式执行 run 链路，不触发外部副作用动作。',
      trace: '输出分层诊断 trace 产物，便于本地定位问题。',
      replay: '从 report/replay 产物路径回放诊断结果。',
      restrictedNetwork: '模拟受限网络模式，在 run 演练中阻断外部 adapter surface。',
      restrictedReason: '为受限网络演练显式记录原因，并写入诊断与审计产物。',
      noLocalFallback: '在受限网络演练中禁用本地 fallback，用于验证阻断语义。',
      noInteractive: '禁用首次 init 的交互式问答配置，强制使用非交互初始化。',
      workspaceAction:
        '指定 workspace 命令动作：dry-run|execute|rollback|clear-config|set-ui-theme。',
      workspaceMode: '指定 workspace 迁移目标模式：repo_local|tool_managed。',
      workspaceRoot: '指定 workspace 迁移命令使用的目标根路径覆盖。',
      workspacePlan: '指定 rollback 动作使用的 workspace migration plan 产物路径。',
      workflowTemplate: '指定 workflow create/edit/preview 子命令使用的流程模板标识。',
    },
    commands: {
      init: { description: '初始化治理工作区基线。' },
      connect: {
        description: '生成适配器接入诊断基线。',
        actionArgument: '可选 connect 动作：generate|diff|apply。',
        candidateArgument: '可选候选产物路径，支持 diagnostics JSON 或 candidate governor.yaml。',
        actionGuideTitle: '动作说明：',
        actionGuideGenerate: '生成候选配置，以及 diagnostics/diff/merge-explain 配套产物。',
        actionGuideDiff: '基于已有 connect 候选重新刷新 diff 与 merge-explain 产物。',
        actionGuideApply: '把候选配置应用到当前 governor.yaml，并输出 receipt/rollback 产物。',
        examplesTitle: '示例：',
      },
      doctor: { description: '执行环境诊断基线。' },
      check: { description: '执行治理质量检查基线。' },
      run: { description: '执行流程运行时基线。' },
      review: { description: '生成代码评审基线输出。' },
      reviewVerify: { description: '验证代码评审基线输出。' },
      verify: { description: '校验适配器路由 pass/warn/fail 基线。' },
      plan: { description: '生成或更新执行计划基线。' },
      resume: {
        description: '恢复最近一次或指定的 session-shell 会话。',
        sessionIdArgument: '可选 session id；不传时默认恢复最近一次 shell 会话。',
      },
      upgrade: { description: '执行工作区与配置升级基线。' },
      setUiTheme: {
        description:
          '通过顶层快捷入口持久化 React shell 主题，或在交互式 pretty 模式中打开 selector。',
        themeArgument: '可选主题预设。在交互式 TTY + pretty 模式下省略它即可打开 selector。',
        precedenceTitle: '主题优先级：',
        precedenceDetail:
          '--ui-theme 单次覆盖 > workspace config > 全局 CLI 偏好。顶层 set-ui-theme 默认作用于 global；如果只想改当前 workspace，请传 --theme-scope workspace。',
        examplesTitle: '示例：',
      },
      workspace: {
        description:
          '规划、执行、回滚工作区迁移基线，清除当前工作区配置，或持久化 workspace/global 默认 React shell 主题。',
        actionArgument: 'workspace 动作短写。面向人工执行，等价于 --workspace-action。',
        valueArgument: '可选动作值。`rollback` 时填写 plan 路径，`set-ui-theme` 时填写主题预设。',
        actionGuideTitle: '动作说明：',
        actionGuideDryRun: '仅预览迁移计划；需要 --workspace-mode <repo_local|tool_managed>。',
        actionGuideExecute:
          '把迁移动作真正应用到目标工作区；需要 --workspace-mode <repo_local|tool_managed>。',
        actionGuideRollback: '根据已保存的 --workspace-plan 产物恢复之前的工作区面。',
        actionGuideClearConfig:
          '只移除当前 selector/config 文件，保留 diagnostics、workflow、review 等产物。',
        actionGuideSetUiTheme:
          '持久化默认 React shell 主题；可直接传 [theme]，也可在交互式 pretty 模式下省略它以打开 selector。--theme-scope <workspace|global> 仍是可选项。',
        compatibilityTitle: '兼容性：',
        compatibilityDetail:
          '旧的 --workspace-action / --workspace-plan / --ui-theme 长写法仍可继续用于脚本；[action] [value] 是更短的人手执行写法，同时主题优先级保持为命令覆盖 > workspace config > 全局偏好。',
        examplesTitle: '示例：',
      },
      workflow: {
        description: '预览流程模板、创建已保存的 workflow 定义，或编辑当前已保存的 workflow。',
        createDescription: '从内置模板创建一份 workflow 定义，并保存到当前 workspace。',
        editDescription:
          '优先编辑当前已保存的 workflow 定义；若不存在则从模板生成并保存到当前 workspace。',
        previewDescription: '预览一个流程模板且不写入 workflow 文件。',
        subcommandRequired:
          'workflow 需要显式子命令；请使用 `workflow create`、`workflow edit` 或 `workflow preview`。',
      },
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
      setRemoteApiCredentialEnvVars:
        '请先设置或导出以下 remote-api 凭据环境变量，再执行 connect/verify：{{credentials}}。',
      verifyProviderLocalCredentialState:
        '当前只做只读发现；请手动确认以下 provider-local 登录状态：{{credentials}}。',
      resolveCredentialReferencesManually:
        '当前不会自动物化 remote-api credentialRef；请手动解析以下引用：{{credentials}}。',
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
      workspaceModeToolManagedOption: 'tool_managed：把元数据放在工具托管工作区根目录下',
      workspaceModeRepoLocalOption: 'repo_local：把元数据保存在当前仓库工作区内',
      workspaceModeValidation: '工作区模式只能填写 1、2、tool_managed 或 repo_local。',
      defaultLocaleTitle: '第 2 / 3 步：默认语言',
      defaultLocaleDescription: '选择 CLI 人类可读文案默认使用的语言。',
      defaultLocalePromptLabel: '默认语言 [1=zh-CN, 2=en-US]（默认 1）: ',
      defaultLocaleZhCnOption: 'zh-CN：默认输出简体中文文案',
      defaultLocaleEnUsOption: 'en-US：默认输出英文文案',
      defaultLocaleValidation: '默认语言只能填写 1、2、zh-CN 或 en-US。',
      submittingDescriptor: '正在将 descriptor 值提交给配置模板桥接层。',
      cancelledBySigint: '交互式 shell 已因 SIGINT 取消。',
      failedBeforeApply: '交互式 shell 在应用初始化值前失败。',
      correctWorkspaceMode: '请修正无效的工作区模式后重新输入。',
      correctLocale: '请修正无效的语言值后重新输入。',
    },
    sessionShell: {
      title: 'Repo AI Governor 会话壳层',
      subtitle:
        'session-first 本地壳层已启用，transcript、command handoff 与 resume continuity 现在统一走 service-backed 语义。',
      fallbackToHelp: 'session shell 在完成启动前失败，CLI 已回退到 help 输出。原因：{{reason}}',
      resumeRequiresInteractive:
        '顶层 resume 命令需要 interactive TTY + pretty 输出，才能附着到 live session shell。',
      workspaceSummary:
        'workspace_id={{workspaceId}} mode={{workspaceMode}} root={{workspaceRoot}}',
      sections: {
        transcript: '会话记录',
        composer: '当前输入',
        slashPalette: 'Slash Palette',
        promptBar: 'Prompt Bar',
      },
      composer: {
        placeholder: '输入消息，/ 打开命令，? 查看快捷帮助。',
      },
      palette: {
        emptyState: '没有匹配的 slash command。可输入 /help 查看当前 MVP 命令集合。',
      },
      resumeSelector: {
        latest: 'latest',
      },
      transcript: {
        systemLabel: '系统',
        userLabel: '你',
        assistantLabel: 'Governor',
        slashLabel: 'Slash Command',
      },
      promptBar: {
        modeLine: 'shell_mode={{shellMode}} input_mode={{inputMode}} handoff={{handoffState}}',
        persistenceLine:
          'session_id={{sessionId}} persistence={{persistenceOwner}} resume={{resumeSelector}}',
        routeLine: 'route={{routeId}} theme={{theme}} history={{historyCount}}',
        workspaceLine: 'cwd={{cwd}} workspace={{workspace}}',
        shortcuts:
          '快捷键：/help、/confirm、/cancel、/history、/search、/multiline、!command、Ctrl+C 退出、Ctrl+D 关闭。',
        idleShortcuts: '? 快捷帮助 · /status · Ctrl+D',
        paletteShortcuts: '↑↓ · Tab/Enter · Esc',
        previewShortcuts: '/confirm · /cancel · Esc',
        showExecutionDetailsShortcut: 'Ctrl+O 过程详情',
        hideExecutionDetailsShortcut: 'Ctrl+O 收起详情',
      },
      commands: {
        help: {
          summary: '列出当前 session-shell 已暴露的 slash commands。',
        },
        confirm: {
          summary: '确认当前 preview 中的 command handoff 并执行它。',
        },
        cancel: {
          summary: '取消当前 preview 中的 command handoff。',
        },
        clear: {
          summary: '清空本地 transcript 视口，但不删除已持久化的 session。',
        },
        exit: {
          summary: '退出前台 session shell，但不删除 transcript 状态。',
        },
        resume: {
          summary: '恢复最近一次或指定的 session transcript。',
        },
        history: {
          summary: '查看当前前台附着过程中记录的最近输入历史。',
        },
        search: {
          summary: '搜索当前 transcript 视图和最近输入历史。',
        },
        multiline: {
          summary: '先采集一段多行消息，再作为单个 user turn 发送。',
        },
        status: {
          summary: '查看当前 session shell 状态与隐藏运行时详情。',
        },
        theme: {
          summary: '查看或切换当前 session-shell 的主题预设。',
        },
        agent: {
          summary: '查看或固定当前前台 session route 的正式命名。',
        },
      },
      responses: {
        welcome:
          'session shell 已启用。普通文本、slash command 与 service-backed transcript 现在共用同一前台交互面。',
        stderrOnly: 'live UI 只会渲染到 stderr，因此 stdout 仍保留给机器可读命令输出。',
        partialSlashMatch:
          '前缀 {{query}} 命中了若干命令；输入完整 slash command，或结合终端历史继续补全。',
        unknownSlashCommand:
          '未知 slash command "{{command}}"。当前 session shell 只暴露文档化命令面。',
        trySlashHelp: '可输入 /help 查看当前已暴露的 slash command 集合。',
        commandPreview: '就绪：{{command}}',
        commandHandoffPending: '{{command}} 的 command handoff 预览已经就绪。',
        commandConfirmHint: '输入 /confirm 执行当前 handoff，或输入 /cancel 放弃本次预览。',
        commandNotExecutable: '该 slash command 当前没有可执行的 handoff 目标。',
        commandExecutionSucceeded: '{{command}} 的 command handoff 已完成。',
        commandDirectExecutionNotice: '这条 slash command 已直接执行，因此不需要 /confirm。',
        commandExecutionFailed: '{{command}} 的 command handoff 失败。原因：{{reason}}',
        commandBridgeUnavailable: '当前 session shell 附着面没有可用的 command execution bridge。',
        commandArtifact: 'artifact={{artifactPath}}',
        commandArtifactsMore: '其余 {{count}} 个相关产物已写出。',
        commandSummary: '摘要：{{summary}}',
        commandStatusSummary: '关键状态：{{summary}}',
        commandFailureSummary: '失败原因：{{summary}}',
        commandAgentSummary: 'Agent 路由：{{summary}}',
        commandAttentionSummary: '关注项：{{summary}}',
        commandErrorHint: '提示：{{hint}}',
        commandErrorNextAction: '下一步：{{nextAction}}',
        commandCancelled: '待执行的 command preview 已取消。',
        cancelWithoutPendingCommand: '当前没有待取消的 command preview。',
        confirmWithoutPendingCommand:
          '当前没有待确认的 command preview。像 /review 这类 direct 命令可能已经直接执行。',
        exitBySlash: '前台 shell 已在 /exit 后关闭。',
        exitBySigint: '前台 shell 已在 Ctrl+C 后关闭。',
        exitByEof: '前台 shell 已在 Ctrl+D 后关闭。',
        exitKeepsTranscript: '退出只会关闭 live shell surface；已持久化 transcript 仍可继续恢复。',
        turnFailed: '主会话 turn 执行失败。原因：{{reason}}',
        turnCancelled: '主会话 turn 在完成前已被取消。',
        turnRecoverableHint: '你可以继续对话、重试这一轮，或切到 /resume。',
        turnRetryingAfterSessionRecovery: 'session 已自动重建，当前这条消息会在新 session 中重试。',
        liveTurnRunningSummary: '进行中 · {{elapsed}}',
        liveTurnWaitingTransportSummary: '等待传输活动 · {{elapsed}}',
        liveTurnWaitingProgressSummary: '等待语义进展 · {{elapsed}}',
        liveTurnGracefulInterruptSummary: '正在优雅中断 · {{elapsed}}',
        liveTurnHardTerminateSummary: '正在强制终止 · {{elapsed}}',
        liveTurnThinking: '思考中...',
        liveTurnThinkingPulse: '思考中{{suffix}}',
        liveTurnThinkingDetail: '思考中：{{detail}}',
        liveTurnCurrentDetail: '{{detail}}',
        liveTurnRoleActivity: '{{role}}：{{detail}}',
        liveTurnRoleReply: '{{role}} 回复：{{detail}}',
        liveTurnToolCall: '工具：{{toolName}} - {{detail}}',
        liveTurnWaitingTransportDetail: '仍在等待 {{surface}} 产生新的传输活动。',
        liveTurnWaitingProgressDetail: '仍在等待 {{surface}} 产生新的语义进展。',
        liveTurnGracefulInterruptDetail: '{{surface}} 正在执行优雅中断。',
        liveTurnHardTerminateDetail: '{{surface}} 正在执行强制终止。',
        liveTurnLivenessReasons: '原因：{{reasons}}。',
        liveTurnPartialOutputPreserved: '部分输出已保留。',
        liveTurnReasonHardTimeout: '超时预算已耗尽',
        liveTurnReasonPartialOutputPreserved: '已保留部分输出',
        liveTurnReasonTransportIdleTimeout: '传输层空闲时间过长',
        liveTurnReasonSemanticStallTimeout: '语义进展停滞时间过长',
        liveTurnReasonGracefulInterruptExceeded: '优雅中断已超过允许窗口',
        liveTurnActivityTitle: '实时活动',
        executionDetailsTitle: '执行过程',
        executionDetailsCollapsed: '▶ 已折叠 · {{count}} 条记录 · Ctrl+O 打开',
        executionDetailsExpanded: '▼ 已展开 · {{count}} 条记录 · Ctrl+O 收起',
        mainTurnAccepted: 'route={{routeId}} turn={{turnIndex}} 已被共享 session runtime 接收。',
        mainTurnEcho: 'echo={{userMessage}}',
        mainTurnSuggestedSlash: '建议下一步：{{command}}',
        mainTurnAutoExecuteSlash: '正在自动执行：{{command}}',
        mainTurnHandoffPreview: '预览：{{preview}}',
        mainTurnAutoExecuteCommand: '执行命令：{{preview}}',
        mainTurnCollaborationAccepted: '{{mode}}已完成。',
        mainTurnCollaborationRoles: '执行角色：{{roles}}（数量={{count}}）',
        mainTurnCollaborationSynthesis: '综合方式：{{synthesisMode}}',
        mainTurnCollaborationModeSingleRole: '单角色委派',
        mainTurnCollaborationModeSerial: '串行角色协作',
        mainTurnCollaborationModeParallel: '并行角色分析',
        mainTurnExecutionSurface: '执行面：{{selectedSurface}}',
        mainTurnExecutionSurfaceFallback: '执行面选择：已自动切换到备选执行面。',
        mainTurnExecutionIntent: '意图：{{executionIntent}}',
        mainTurnRoutingSelection: '路由：surface={{selectedSurface}} selected_by={{selectedBy}}',
        mainTurnBacklink: '回链：kind={{kind}} label={{label}} target={{target}}',
        mainTurnFollowUpPrompt: '主 agent 在 handoff 前还需要一次补充说明：',
        sessionStarted: '已在 {{routeId}} 上启动 service-backed session {{sessionId}}。',
        sessionResumed: '已通过 selector={{resumeSelector}} 恢复 session {{sessionId}}。',
        resumeFailed: '恢复 {{resumeSelector}} 失败。原因：{{reason}}',
        resumeAvailableSessions: '当前可恢复的已知 sessions：{{sessionIds}}',
        resumeRecoverableHint:
          '当前没有可用的最近 session 索引；你可以继续对话并立即创建新 session。',
        resumeRecoveredWithNewSession: '已自动创建一个新 session，确保前台 shell 能继续附着。',
        sessionRecoveredContinueHint: '前台 shell 已重新附着到一个新 session，可继续后续操作。',
        localTranscriptCleared:
          '本地 transcript 视口已清空；但已持久化的 session 历史仍然可以恢复。',
        historyEmpty: '当前前台附着中还没有记录任何输入历史。',
        searchRequiresQuery: '请在 /search 后面传入检索词。',
        searchNoMatch: '没有 transcript 或 history 内容命中 {{query}}。',
        searchMatches: '{{query}} 的 transcript/history 命中如下：',
        statusAttached: '当前已附着到 {{routeId}} 上的 session {{sessionId}}。',
        statusRuntime:
          'resume={{resumeSelector}} persistence={{persistenceOwner}} theme={{theme}} output={{output}}。',
        statusWorkspace: '当前工作区：{{workspace}}',
        themeCurrent: '当前会话主题={{theme}}。',
        themeAvailable: '可用主题：{{themes}}。',
        themeUnknown: '未知主题 {{theme}}。可选值：{{themes}}。',
        themeUpdated: '当前前台 session 主题已切换为 {{theme}}。',
        agentCurrent: '当前前台 session route={{routeId}}。',
        agentUnsupported:
          '当前尚未支持 route {{routeId}}；session shell 目前只会把前台 turns 路由到 session.main。',
        agentUpdated: '前台 route 仍固定为 {{routeId}}。',
        multilineCancelled: '多行采集结束时没有拿到可发送的消息内容。',
        passthroughRequiresCommand: '请在 ! 后面跟上要透传执行的 shell 命令。',
        passthroughFailed: 'Shell passthrough 执行失败。原因：{{reason}}',
        passthroughCompleted: '{{command}} 的 shell passthrough 已结束，exit_code={{exitCode}}。',
      },
      multilinePrompt: 'multiline> 以单独一行 {{terminator}} 结束输入',
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
        reactShellFallbackToClassic: 'React shell 初始化失败，已回退到 classic。原因：{{reason}}。',
      },
      workflow: {
        invalidTemplate: '不支持的 workflow 模板 "{{template}}"。支持的模板：{{supported}}。',
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
        agentProjection: 'Agent 投影',
        enabled: '已启用',
        disabled: '已关闭',
        notSet: '未设置',
        shortcuts: '快捷键',
        selection: '选择',
        session: '会话',
        details: '详情',
        lifecycle: '生命周期',
        validationFeedbackRequiresAnotherInputPass: '验证反馈需要再输入一轮。',
        rendersOnStderrOnly: 'React shell 仅渲染到 stderr。',
        moveFocus: '上下选择',
        confirm: 'Y 确认',
        enterConfirm: '回车确认',
        restart: 'N 重新开始',
        submit: '回车提交',
        cancel: 'Ctrl+C 取消',
        unmountedState: '已卸载 state={{state}} fallback={{fallback}}',
      },
      themePresets: {
        governor: {
          description: '偏冷蓝灰的默认主题，对治理类信息有更高对比度。',
        },
        catppuccin: {
          description: '更鲜明的粉彩主题，适合想要更有表现力的壳层外观。',
        },
        calm: {
          description: '更柔和、低对比的主题，适合长时间会话。',
        },
      },
      themeSelector: {
        title: '选择 React shell 主题',
        workspaceDescription:
          '为当前 workspace 持久化一个默认主题。所选预设会成为 workspace 层默认值。',
        globalDescription:
          '为所有 workspace 持久化一个全局共享主题。所选预设会成为 CLI 全局默认值。',
        validation: '主题只能是 governor、catppuccin 或 calm。',
        submittingTitle: '正在应用主题选择',
        submittingMessage: '正在把主题“{{theme}}”持久化到 {{scope}} 范围。',
        successMessage: '主题“{{theme}}”已成为 {{scope}} 默认值。',
        cancelledBySigint: '主题 selector 已因 SIGINT 取消。',
        failedBeforeApply: '主题 selector 在应用所选预设前失败。',
        availableThemesTitle: '可用主题：',
        selectorTitle: 'Selector：',
        selectorHint:
          '在交互式 TTY + pretty 模式下执行不带 [theme] 的 set-ui-theme 或 workspace set-ui-theme，即可直接打开 selector，而不必手输预设。',
        nonInteractiveError:
          '非交互模式下，set-ui-theme 需要显式提供主题预设。可选值：{{themes}}。如果是在交互式 TTY + pretty 模式下，可省略 [theme] 直接打开 selector。',
      },
      footer: {
        stdoutSummaryFollows: 'stdout 摘要紧随其后',
        uiNoneDisablesShell: '--ui none 可关闭壳层',
        workspaceRollbackRestoresPriorState: '--workspace-action rollback 可恢复旧状态',
      },
      progress: {
        title: '运行进度',
        elapsed: '已耗时：{{elapsed}}',
        heartbeat: '心跳：{{tick}}',
        steps: '步骤 {{completed}}/{{total}}',
        artifactsTitle: '产物',
        logsTitle: '最近日志',
        shortcut: {
          exit: 'Ctrl+C 退出',
          cancel: 'Ctrl+C 取消',
        },
        cancel: {
          none: '该命令当前还不支持取消。',
          supported: '按 Ctrl+C 可请求取消。',
          requested: '已请求取消，正在等待命令退出。',
          forced: '再次收到 Ctrl+C，立即停止当前命令。',
        },
        status: {
          running: '正在执行 {{command}}…',
        },
        connect: {
          starting: '正在准备 connect 执行…',
          buildCandidate: '构建候选配置',
          verifyingAdapters: '校验适配器',
          buildingProjection: '构建 Agent 投影',
          writingArtifacts: '写入诊断产物',
          completed: 'connect 诊断结果已就绪。',
          cancelled: 'connect 执行已取消。',
        },
        doctor: {
          starting: '正在准备 doctor 执行…',
          workspaceChecks: '检查工作区基线',
          verifyingAdapters: '校验适配器',
          writingArtifacts: '写入诊断产物',
          completed: 'doctor 诊断结果已就绪。',
          cancelled: 'doctor 执行已取消。',
        },
        verify: {
          starting: '正在准备 verify 执行…',
          verifyingAdapters: '校验适配器',
          writingArtifacts: '写入诊断产物',
          completed: 'verify 诊断结果已就绪。',
          failed: 'verify 发现必需适配器角色失败。',
          cancelled: 'verify 执行已取消。',
        },
        run: {
          starting: '正在准备 run 执行…',
          assembling: '装配任务驱动 run',
          compiling: '编译流程 IR',
          executingRuntime: '执行运行时图',
          writingArtifacts: '写入执行产物',
          completed: 'run 执行已结束。',
          failed: 'run 执行以失败状态结束。',
        },
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
      upgrade: {
        title: '检查升级分析产物',
        fields: {
          workspaceRoot: '工作区根路径',
          sourceVersion: '源版本',
          targetVersion: '目标版本',
          confirmationDecision: '确认决策',
        },
        help: {
          analyzeOnly:
            'upgrade 目前仍保持 analyze-only；React shell 只预览 report、migrated-config 与 rollback reference，不会直接改写 governor.yaml。',
          rollbackReference:
            '如果后续应用迁移结果，请保留 rollback snapshot，便于显式恢复当前分析前的配置。',
        },
        status: {
          manualConfirmation: '在应用 {{count}} 个阻断性升级变更前，仍需人工确认。',
          analysisReady: '升级分析已就绪，目标版本={{targetVersion}}。',
        },
        summary: {
          reportPath: '升级报告：{{path}}',
          autoMigratedConfigPath: '自动迁移配置：{{path}}',
          rollbackSnapshotPath: '回滚快照：{{path}}',
          counts: '建议={{suggestions}}；确认项={{confirmations}}；阻断={{blocking}}。',
        },
      },
      workspace: {
        clearConfigTitle: '清除当前工作区配置',
        setThemeTitle: '持久化当前 React shell 主题',
        title: '规划或执行工作区迁移',
        fields: {
          action: '工作区操作',
          targetMode: '目标工作区模式',
          targetRoot: '目标工作区根路径',
          planPath: '回滚计划路径',
          currentMode: '当前工作区模式',
          currentRoot: '当前工作区根路径',
          activeConfigPaths: '活动配置路径',
          themeScope: '主题范围',
          themePreferencePaths: '主题偏好路径',
        },
        actions: {
          dryRun: 'Dry run',
          execute: '执行',
          rollback: '回滚',
          clearConfig: '清除配置',
          setUiTheme: '设置 UI 主题',
        },
        help: {
          stableOutputContract:
            'workspace 会保持机器可读输出契约稳定，同时在共享 React shell 中预览迁移意图。',
          persistPlan: '请保留生成的计划产物，以便需要时通过 rollback 恢复先前的 selector 状态。',
          clearConfigRemovesSelectorState:
            'clear-config 会移除当前用于解析活动工作区面的 selector/config 文件。',
          clearConfigKeepsArtifacts:
            'clear-config 不会删除 diagnostics、workflow definition、review queue 等其它工作区产物。',
          setThemePersistsToConfig:
            'set-ui-theme 默认持久化到当前活动工作区配置；使用 --theme-scope global 时则写入全局 CLI 偏好文件。repo-local selector config 只有在原本已存在时才会同步。',
          setThemeFlagStillOverrides:
            '即使默认主题已持久化，--ui-theme 仍可作为当前命令的一次性外观覆盖。',
        },
        status: {
          executionCompleted: '工作区迁移执行已完成。',
          rollbackCompleted: '工作区回滚已完成。',
          dryRunCompleted: '工作区迁移 dry-run 已完成。',
          clearConfigCompleted: '当前工作区配置已清除。',
          clearConfigNoop: '当前没有可清除的工作区配置。',
          setThemeCompleted: '默认 React shell 主题已为 {{scope}} 范围持久化为 {{theme}}。',
        },
        message: {
          executeCompleted: '工作区迁移执行成功；计划文件={{planPath}}。',
          rollbackCompleted: '工作区回滚已完成；回滚产物={{rollbackPath}}。',
          dryRunCompleted: '工作区迁移计划已生成；计划文件={{planPath}}。',
          clearConfigCompleted: '已清除 {{count}} 个工作区配置文件：{{paths}}。',
          clearConfigNoop: '未发现可清除的当前工作区配置文件。已检查：{{paths}}。',
          setThemeCompleted:
            '已将 React shell 主题 {{theme}} 以 {{scope}} 范围持久化到 {{count}} 个文件：{{paths}}。',
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
          reRunInitAfterClear: '当你需要重新引导一份全新的工作区配置时，请重新执行 init。',
          rerunWorkspaceAfterClear:
            '如果你想从零开始重新生成工作区 selector，请重新执行 workspace dry-run/execute。',
          inspectExpectedConfigPaths:
            '如果你原本预期存在活动工作区配置，请检查这些路径：{{paths}}。',
          rerunPrettyAfterThemeChange:
            '请重新执行一条 pretty 模式命令，确认持久化后的 {{theme}} 已成为默认 React shell 外观。',
          useUiThemeFlagAsOverride:
            '如果你只想临时切换一次外观而不改默认值，仍可继续使用 --ui-theme。',
        },
        summary: {
          migrationId: '迁移 ID：{{migrationId}}',
          primaryArtifact: '主产物：{{path}}',
          inspectedConfigPaths: '已检查配置路径：{{paths}}',
          clearedConfigPath: '已清除配置路径：{{path}}',
          noConfigRemoved: '没有移除任何配置路径。',
          appliedTheme: '已应用主题：{{theme}}',
          appliedThemeScope: '已应用主题范围：{{scope}}',
          persistedConfigPaths: '已持久化配置路径：{{paths}}',
        },
      },
      workflow: {
        title: '预览流程模板或为 workflow 编辑器准备入口种子',
        fields: {
          action: '流程操作',
          templateId: '流程模板',
          entryMode: '流程入口模式',
          definitionSource: '流程定义来源',
        },
        actions: {
          create: '创建',
          edit: '编辑',
          preview: '预览',
        },
        entryModes: {
          readOnly: 'read_only',
          createSeed: 'create_seed',
          editSeed: 'edit_seed',
        },
        previewModes: {
          readOnly: 'read_only',
        },
        definitionSources: {
          previewTemplate: '预览模板',
          templateSeed: '模板种子',
          workspaceSaved: '工作区已保存定义',
        },
        templates: {
          parallelReview: '并行评审',
          loopGuarded: '带守护的循环',
          conditionRoute: '条件路由',
        },
        help: {
          sharedEntrySurface:
            'workflow preview 保持只读；workflow create/edit 会先统一节点、连线、条件分支与 loop guardrail 语义，再将通过校验的 workflow definition 与 compiled IR snapshot 持久化到 workspace。',
          templateSeedSelection:
            '可通过 --workflow-template 为 workflow preview/create/edit 选择起始拓扑。',
          editLoadBehavior:
            'workflow edit 在有已保存 workflow 时会优先载入该定义；传入 --workflow-template 则会用内置模板重新生成当前活动 workflow。',
        },
        progress: {
          compileCompleted: 'workflow topology 编译成功。',
          compileFallback: 'workflow topology 遇到 contract 错误，已保持在摘要壳层。',
        },
        status: {
          compilable: 'compiled IR 预览已就绪；warnings={{warningCount}}。',
          warning: 'compiled IR 预览已完成，但 warnings={{warningCount}}。',
          contractFallback:
            'compiled IR 预览遇到 contract errors={{errorCount}}；当前展示只读 fallback 摘要。',
        },
        message: {
          previewCompleted:
            'workflow preview 已就绪，template={{template}}；warnings={{warningCount}}，errors={{errorCount}}。',
          createSaved:
            'workflow create 已保存定义={{definitionPath}}；warnings={{warningCount}}，errors={{errorCount}}。',
          createEntryReady:
            'workflow create 入口已就绪，template={{template}}；warnings={{warningCount}}，errors={{errorCount}}。',
          editSaved:
            'workflow edit 已保存定义={{definitionPath}}；warnings={{warningCount}}，errors={{errorCount}}。',
          editEntryReady:
            'workflow edit 入口已就绪，template={{template}}；warnings={{warningCount}}，errors={{errorCount}}。',
        },
        prompt: {
          reviewCompileErrors: '检查编译错误',
          fixBeforePersist:
            '在将该预览提升为持久化 workflow definition 之前，请先修复 loop/edge contract 问题。',
          compareAnotherTemplate: '比较其他模板',
          rerunWithActionTemplate:
            '重新执行 `workflow {{action}} --workflow-template <template>`，比较另一种模板结构。',
          inspectSavedDefinition: '检查已保存 workflow 定义',
          inspectSavedDefinitionPath: '在下一轮 edit 前，请先检查 {{path}}。',
          inspectCompiledIr: '检查 compiled IR 快照',
          inspectCompiledIrPath: '请确认 {{path}} 仍能反映当前保存 workflow 的编译结果。',
        },
        editorIssues: {
          conditionBranchRequired: 'Condition 节点在持久化前必须至少暴露一条出边分支。',
          conditionBranchKeyRequired: 'Condition 节点的每条出边都必须声明非空 condition key。',
          conditionBranchDuplicated: '同一个 Condition 节点的出边必须使用唯一 condition key。',
        },
        summary: {
          definitionSource: '定义来源：{{source}}',
          definitionPath: '流程定义：{{path}}',
          compiledIrPath: 'Compiled IR 快照：{{path}}',
          template: '模板：{{template}}',
          processId: '流程 ID：{{processId}}',
          entryNode: '入口节点：{{entryNodeId}}',
          graphTotals:
            '图摘要：nodes={{nodeCount}} edges={{edgeCount}} warnings={{warningCount}} errors={{errorCount}}。',
          conditionBranches: '{{nodeId}} 的条件分支：{{branches}}',
          noBranches: '无',
          nodeLine:
            'IR 节点 {{nodeId}} [{{nodeType}}] stage={{stageId}} route={{routeKey}} role={{roleProfileId}}',
          loopLimits:
            '{{nodeId}} 的 loop guardrail：maxCycles={{maxCycles}} maxWallTimeSeconds={{maxWallTimeSeconds}}',
          edgeLine: '连线 {{fromNodeId}} -> {{toNodeId}} condition={{conditionKey}}',
          defaultRoute: '默认',
          compileIssue: '{{severity}} {{errorCode}} @ {{location}}：{{message}}',
          errorSeverity: '错误',
          warningSeverity: '警告',
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
          workflowTemplate: '流程模板',
          workflowPreviewMode: '流程预览模式',
          workflowCompileStatus: '流程编译状态',
        },
        checkDetails: {
          upgradeSchemaDiff: '差异 {{diffs}} 项，{{source}} -> {{target}}',
          migrationSuggestions: '{{count}} 条建议',
          confirmationItems: '决策 {{decision}}，确认项 {{count}} 条，阻断 {{blocking}} 条',
          workspaceTarget: '模式 {{mode}}，根路径 {{root}}',
          workspaceScratchCleanupRemoved: 'scratch 根目录已移除：{{root}}',
          workspaceScratchCleanupRetained: 'scratch 根目录保留：{{root}}',
          workflowTemplate: '模板 {{template}}',
          workflowPreviewMode: '模式 {{mode}}',
          workflowCompileStatus: '状态 {{status}}，{{warnings}} 条 warning，{{errors}} 条 error',
        },
      },
    },
  },
  sessionMainCapabilities: {
    catalog: {
      help: {
        title: '帮助',
        summary: '解释受治理命令的用途，以及如何从 session.main 进入它们。',
        detail:
          '当你想先了解有哪些能力、它们分别适合什么场景，或需要判断下一步该走哪条 governed action 时，使用 help。',
        examples: {
          0: '你现在能做什么？',
          1: '讲讲 review 和 review verify 有什么区别。',
        },
      },
      connect: {
        title: '接入',
        summary: '为当前工作区准备并应用 adapter onboarding 变更。',
        detail:
          '当你需要先把角色、surface 或远端凭据接到当前仓库，再进入执行流时，应该使用 connect。',
        examples: {
          0: '帮我把 Codex 和 Claude Code 接上。',
          1: '给这个仓库做一遍 adapter onboarding。',
        },
      },
      doctor: {
        title: '诊断',
        summary: '诊断 adapter 健康、环境就绪度与路由阻断原因。',
        detail:
          '当你想只读地检查当前 workspace 或 adapter 健康状态，而不是直接改配置时，应该使用 doctor。',
        examples: {
          0: '帮我诊断一下当前项目。',
          1: '检查一下我的 adapters 现在是否健康。',
        },
      },
      verify: {
        title: '验证',
        summary: '验证路由、projection 与 adapter readiness 真值。',
        detail:
          '当你需要在无人值守执行前确认 adapter 覆盖、route 状态和 readiness 结论时，应该使用 verify。',
        examples: {
          0: '帮我验证 adapter readiness。',
          1: '检查当前 routing 配置是不是有效。',
        },
      },
      workflow: {
        title: '流程',
        summary: '预览或进入受治理的 workflow 定义面。',
        detail:
          '当你想查看模板预览，或进入 workflow authoring 相关入口去检查当前保存的 process definition 时，应该使用 workflow。',
        examples: {
          0: '给我看一下 workflow preview。',
          1: '打开这个仓库的 workflow 模板入口。',
        },
      },
      plan: {
        title: '计划',
        summary: '为当前目标生成或细化任务拆解。',
        detail: '当你想在开始实现前先把工作拆成结构化任务包，并冻结执行顺序时，应该使用 plan。',
        examples: {
          0: '帮我拆一下这项工作的任务。',
          1: '给下一个 sprint 做一份执行计划。',
        },
      },
      review: {
        title: '评审',
        summary: '对当前范围执行受治理的代码评审路径。',
        detail: '当你需要对当前改动做只读检查、识别风险或输出 findings 时，review 是主路径。',
        examples: {
          0: '帮我 review 当前改动。',
          1: '帮我对这个分支做一轮 code review。',
        },
      },
      review_verify: {
        title: '评审复核',
        summary: '复查已有评审报告，并确认已接受的问题是否真的修好。',
        detail:
          'review verify 属于正式的评审验证动作，因此默认保留 preview-confirm 治理，而不是静默直接执行。',
        examples: {
          0: '帮我验证 review findings 是否都修好了。',
          1: '复核当前 CR 报告并确认修复结果。',
        },
      },
      run: {
        title: '执行',
        summary: '启动实现或 workflow 的受治理执行流。',
        detail:
          '当你要真正进入任务交付或运行 workflow 时，run 是高影响路径，因此保留 preview-confirm continuity。',
        examples: {
          0: '开始做这个任务。',
          1: '运行这个仓库接下来的 governed workflow。',
        },
      },
    },
  },
} as const;
