export const EN_US_TRANSLATIONS = {
  cli: {
    app: {
      description: 'Repository-local AI governance CLI.',
    },
    options: {
      locale: 'Locale for human-readable output.',
      profile: 'Config profile id applied before command execution.',
      output: 'Output mode: pretty|plain|json.',
      ui: 'Interactive UI mode: none|classic|react|tui. Default is react in interactive TTY pretty mode.',
      uiTheme:
        'One-off React shell theme override: governor|copilot|catppuccin|calm|tokyo-night|kanagawa|flexoki. Default precedence is --ui-theme > workspace config > global CLI preference.',
      themeScope:
        'Theme persistence scope for set-ui-theme: workspace|global. Top-level set-ui-theme defaults to global; workspace set-ui-theme defaults to workspace.',
      backend: 'Secret backend override: macos-keychain|unsafe-local-file.',
      stdin: 'Read the secret value from stdin without accepting it as a positional argument.',
      fromEnv: 'Import the secret value from one environment variable name.',
      verbosity: 'Output verbosity: quiet|normal|verbose.',
      compact: 'Compact pretty output for human-first quick scanning.',
      noColor: 'Disable ANSI color decorations in pretty mode.',
      adapters: 'Enable adapter diagnostics and routing verification scope.',
      fix: 'Apply safe_local fixes (directories/config templates/writable checks) only.',
      preset:
        'Connect preset id for agent onboarding: single-tool-minimal|multi-tool-default|single-tool-all-roles|restricted-network-safe.',
      tools: 'Comma-separated adapter tool ids used by connect/doctor onboarding views.',
      toolTransport:
        'Repeatable per-tool transport override in toolId=transport form. Supported surfaces are transport-aware only.',
      remoteApiModel:
        'Repeatable per-tool remote_api model authoring in toolId=model form for connect candidate generation.',
      remoteApiCredentialEnvVar:
        'Repeatable per-tool remote_api credential env-var authoring in toolId=ENV_VAR form.',
      remoteApiEndpoint:
        'Repeatable per-tool remote_api endpoint authoring in toolId=https://... form.',
      overwrite:
        'Allow connect candidate config to replace existing role/routing fragments instead of merge-only output.',
      latest: 'Use the latest generated connect candidate artifact for diff/apply.',
      force:
        'Bypass connect diff/apply guards such as source-fingerprint drift or apply-ready blockers.',
      noRollback:
        'Disable rollback snapshot generation during connect apply and write only the apply receipt.',
      singleToolAllRoles:
        'Shortcut tool id that binds every enabled onboarding role to one surface during connect candidate generation.',
      roleBinding:
        'Repeatable role binding override in roleId=tool[,fallbackTool...] form. roleProfileId is also accepted.',
      recordLedger: 'Write optional ledger-backfill artifact for task traceability.',
      taskId: 'Task id used with --record-ledger for explicit ledger backfill records.',
      dryRun: 'Execute run pipeline without external side-effect actions.',
      trace: 'Emit layered diagnostics trace artifact for local debugging.',
      replay: 'Replay diagnostics from report/replay artifact path.',
      restrictedNetwork:
        'Simulate restricted-network mode so external adapter surfaces are blocked during run.',
      restrictedReason:
        'Explicit restricted-network reason recorded in diagnostics and audit artifacts.',
      noLocalFallback:
        'Disable local fallback during restricted-network rehearsal to validate blocking semantics.',
      noInteractive:
        'Disable interactive setup prompts for first-time init and force non-interactive config bootstrap.',
      workspaceAction:
        'Workspace command action: dry-run|execute|rollback|clear-config|switch-branch|set-ui-theme.',
      workspaceMode:
        'Workspace target mode for migration planning/execution: repo_local|tool_managed.',
      workspaceRoot: 'Workspace target root override used by the workspace migration command.',
      workspacePlan: 'Workspace migration plan artifact path used by the rollback action.',
      targetVersion:
        'Upgrade target schema version used by the preview action. Defaults to the latest supported version.',
      confirmPlan: 'Explicit plan confirmation decision for commit: approve|reject.',
      confirmUpgrade: 'Explicit upgrade confirmation decision for apply: approve|reject.',
      adoptRepo: 'Target repository root used by the adoption-pack installer.',
      adoptProfile:
        'Optional adoption profile id. `--profile` is also accepted as a command-local alias for adopt.',
      adoptHosts:
        'Comma-separated host families to materialize: codex, claude-code, github-copilot.',
      adoptReceipt: 'Explicit adoption install receipt path used by diff/verify/remove/upgrade.',
      host: 'Host family used by the host distribution command.',
      hostMode: 'Host distribution mode: project-local|plugin-bundle.',
      hostTarget: 'Explicit host target override such as codex.project_local.',
      githubCopilotTarget:
        'GitHub Copilot target shorthand: repo-local|cli-plugin|github-com-agent.',
      hostOutputDir: 'Staged export directory used by host export/verify/pack.',
      hostManifest: 'Explicit host-export manifest path used by host verify.',
      hostApplyToRepo:
        'Repository root that receives applied project-local assets from staged export.',
      hostBundleDir: 'Bundle output directory used by host pack.',
      hostHandoffBridge: 'Handoff bridge used by exported host assets: cli_wrapper|mcp.',
      hostWorkflowId: 'Repeatable workflow id filter used by the host command.',
      workflowTemplate:
        'Workflow template id used by the workflow create/edit/preview subcommands.',
    },
    commands: {
      init: { description: 'Initialize governor workspace baseline.' },
      config: {
        description: 'Read and mutate user-local defaults stored in user-config.yaml.',
        getDescription: 'Read one supported user-local default value.',
        setDescription: 'Persist one supported user-local default value.',
        unsetDescription: 'Remove one supported user-local default value.',
        listDescription: 'List the currently populated user-local default values.',
        statusDescription: 'Show canonical path, migration compatibility, and active defaults.',
        keyPathArgument: 'Supported user-local config key path.',
        valueArgument: 'User-local config value written to the canonical file.',
        examplesTitle: 'Examples:',
        subcommandRequired:
          'config requires an explicit subcommand; use `config get`, `config set`, `config unset`, `config list`, or `config status`.',
      },
      secret: {
        description:
          'Write and inspect secret-backed credential values without storing plaintext in config files.',
        setDescription:
          'Write one secret value through stdin or a secure prompt into the selected backend.',
        importDescription:
          'Import one secret value from an environment variable into the selected backend.',
        deleteDescription: 'Delete one managed secret key from the selected or indexed backend(s).',
        listDescription:
          'List managed secret keys plus backend/existence metadata without revealing values.',
        statusDescription:
          'Show backend availability, default selection, and unsafe fallback warnings.',
        keyNameArgument: 'Stable namespaced secret key such as openai/api-key.',
        examplesTitle: 'Examples:',
        subcommandRequired:
          'secret requires an explicit subcommand; use `secret set`, `secret import`, `secret delete`, `secret list`, or `secret status`.',
      },
      connect: {
        description: 'Generate adapter onboarding diagnostics baseline.',
        actionArgument: 'Optional connect action: generate|diff|apply.',
        candidateArgument:
          'Optional candidate diagnostics JSON or candidate governor.yaml path used by diff/apply.',
        actionGuideTitle: 'Action guide:',
        actionGuideGenerate:
          'Create one candidate config plus diagnostics/diff/merge-explain companion artifacts.',
        actionGuideDiff:
          'Rebuild the candidate diff and merge-explain artifacts from one existing connect candidate.',
        actionGuideApply:
          'Apply one candidate config into the active governor.yaml and emit receipt/rollback artifacts.',
        examplesTitle: 'Examples:',
      },
      doctor: { description: 'Run environment diagnostics baseline.' },
      check: { description: 'Run governance quality checks baseline.' },
      adopt: {
        description:
          'List, bootstrap, apply, diff, verify, upgrade, or remove one managed adoption pack from a target repository.',
        listDescription: 'List resolved adoption packs and their supported profiles.',
        bootstrapDescription:
          'Run the installer quickstart path: init, bootstrap doctor preflight, adopt apply, and adopt verify.',
        applyDescription:
          'Apply one adoption pack into the target repository and write managed ownership receipts.',
        diffDescription:
          'Compare the current repository state against the active adoption install receipt.',
        verifyDescription:
          'Verify receipt provenance, managed files, and lower-level host artifacts for one installation.',
        upgradeDescription:
          'Reapply the managed adoption pack when current managed files are clean or --force is supplied.',
        removeDescription:
          'Remove managed projection files recorded by the active adoption receipt.',
        packArgument:
          'Optional pack selector. Profile ids like adopter-complete are also accepted.',
        actionGuideTitle: 'Action guide:',
        actionGuideList:
          'Inspect built-in/global/repo-local pack resolution and available profiles.',
        actionGuideBootstrap:
          'Run the installer quickstart in fixed order and keep `check` as the explicit broader governance follow-up.',
        actionGuideApply:
          'Materialize project-local host assets, self-host templates, and managed metadata into one repository.',
        actionGuideDiff:
          'Show managed-file drift between the current repository and the saved install receipt.',
        actionGuideVerify:
          'Recheck the saved receipt plus installed files to confirm source-aware adoption state.',
        actionGuideUpgrade:
          'Reapply the current pack definition after confirming managed files are clean or explicitly forced.',
        actionGuideRemove:
          'Delete only managed files tracked by the install receipt; removal remains explicit and fail-closed.',
        examplesTitle: 'Examples:',
        subcommandRequired:
          'adopt requires an explicit subcommand; use `adopt list`, `adopt bootstrap`, `adopt apply`, `adopt diff`, `adopt verify`, `adopt upgrade`, or `adopt remove`.',
        listCompleted: 'Adoption pack catalog listed successfully.',
        bootstrapBlockedGeneric:
          'Adoption bootstrap stopped with actionable blockers. Use adopt diff/upgrade/remove as needed, and keep `check` as the broader follow-up.',
        bootstrapBlocked:
          'Adoption pack {{packId}} bootstrap stopped with actionable blockers. Use adopt diff/upgrade/remove as needed, and keep `check` as the broader follow-up.',
        bootstrapCompleted:
          'Adoption pack {{packId}} bootstrap completed. Run `check` for broader governance audit.',
        applyCompleted: 'Adoption pack {{packId}} applied successfully.',
        diffCompleted: 'Adoption pack {{packId}} diff completed.',
        verifyCompleted: 'Adoption pack {{packId}} verification completed.',
        upgradeCompleted: 'Adoption pack {{packId}} upgrade completed.',
        removeCompleted: 'Adoption pack {{packId}} removal completed.',
      },
      run: { description: 'Execute reusable governed workflow or task-driven flow.' },
      review: { description: 'Generate code review baseline output.' },
      reviewVerify: { description: 'Verify code review baseline output.' },
      verify: {
        removed:
          'The public `verify` command has been removed. Use `doctor` for readiness diagnostics or `connect` when you need onboarding changes plus follow-up checks.',
      },
      plan: {
        description: 'Preview or commit structured sprint planning output.',
        actionArgument: 'Optional plan action: preview|commit.',
        artifactArgument: 'Optional preview artifact path used by the commit action.',
        actionGuideTitle: 'Action guide:',
        actionGuidePreview:
          'Generate a structured preview from the active sprint Task Package and show commit readiness.',
        actionGuideCommit:
          'Commit one preview artifact into sprint plan/TK/checklist/tasks.csv after explicit confirmation.',
        examplesTitle: 'Examples:',
      },
      host: {
        description:
          'Render staged host assets, verify exported host trees, or package installable host bundles.',
        exportDescription:
          'Render one staged host export tree and optionally apply repo-local assets.',
        verifyDescription: 'Verify one staged host export plus applied or packed assets.',
        packDescription: 'Render one staged plugin export and materialize the installable bundle.',
        actionGuideTitle: 'Action guide:',
        actionGuideExport:
          'Render the staged host tree, write host-export manifest and verification summary, and optionally apply repo-local assets.',
        actionGuideVerify:
          'Check manifest/source back-links, staged export content, and applied or packed drift.',
        actionGuidePack:
          'Render plugin targets, materialize the installable bundle, and emit pack receipts.',
        examplesTitle: 'Examples:',
        subcommandRequired:
          'host requires an explicit subcommand; use `host export`, `host verify`, or `host pack`.',
        exportCompleted: 'Host export completed for {{target}}.',
        verifyCompleted: 'Host verify completed for {{target}}.',
        packCompleted: 'Host pack completed for {{target}}.',
      },
      resume: {
        description: 'Resume the latest or one explicit session-shell conversation.',
        sessionIdArgument: 'Optional session id to resume instead of the latest shell session.',
      },
      upgrade: {
        description:
          'Preview, apply, or roll back one controlled workspace/config upgrade baseline.',
        actionArgument: 'Optional upgrade action: preview|apply|rollback.',
        artifactArgument:
          'Optional report/apply-receipt/rollback-snapshot path used by apply or rollback.',
        actionGuideTitle: 'Action guide:',
        actionGuidePreview:
          'Analyze the active governor.yaml, write preview artifacts, and keep the current config unchanged.',
        actionGuideApply:
          'Apply one preview report after explicit confirmation and emit apply/verify receipts.',
        actionGuideRollback:
          'Restore the prior config from one apply receipt or rollback snapshot and emit a rollback receipt.',
        examplesTitle: 'Examples:',
      },
      setUiTheme: {
        description:
          'Persist the React shell theme through a top-level shortcut, or open a selector in interactive pretty mode.',
        themeArgument:
          'Optional theme preset. Omit it in interactive TTY + pretty mode to open a selector.',
        precedenceTitle: 'Theme precedence:',
        precedenceDetail:
          '--ui-theme override > workspace config > global CLI preference. Top-level set-ui-theme defaults to global scope; use --theme-scope workspace when you only want the current workspace.',
        examplesTitle: 'Examples:',
      },
      workspace: {
        description:
          'Plan, execute, or roll back workspace migration baseline, clear the current workspace config, switch to an existing local git branch, or persist a workspace/global React shell default theme.',
        actionArgument:
          'Workspace action shorthand. Equivalent to --workspace-action for human-driven runs.',
        valueArgument:
          'Optional action value. Use a plan path for rollback, a target branch for switch-branch, or a theme preset for set-ui-theme.',
        actionGuideTitle: 'Action guide:',
        actionGuideDryRun:
          'Preview one migration plan only; requires --workspace-mode <repo_local|tool_managed>.',
        actionGuideExecute:
          'Apply the migration into the target workspace; requires --workspace-mode <repo_local|tool_managed>.',
        actionGuideRollback:
          'Restore the prior workspace surface from a saved --workspace-plan artifact.',
        actionGuideClearConfig:
          'Remove only the current selector/config files and keep diagnostics/workflow/review artifacts.',
        actionGuideBranchSwitch:
          'Switch to one existing local git branch after confirming the worktree is clean; this action does not fetch or create branches for you.',
        actionGuideSetUiTheme:
          'Persist the default React shell theme; pass [theme] or omit it in interactive pretty mode to open a selector. --theme-scope <workspace|global> stays optional.',
        compatibilityTitle: 'Compatibility:',
        compatibilityDetail:
          'The older --workspace-action / --workspace-plan / --ui-theme form still works for scripts; [action] [value] is the shorter human-facing shorthand, and theme precedence remains command override > workspace config > global preference.',
        examplesTitle: 'Examples:',
        switchBranchExample: '{{programName}} workspace switch-branch main --output pretty',
      },
      workflow: {
        description:
          'Preview workflow templates, create a saved workflow definition, or edit the saved workflow.',
        createDescription:
          'Create a workflow definition from a built-in template and save it into the workspace.',
        editDescription:
          'Edit the saved workflow definition when present, or seed one from a template and save it into the workspace.',
        previewDescription: 'Preview one workflow template without writing workflow files.',
        subcommandRequired:
          'workflow requires an explicit subcommand; use `workflow create`, `workflow edit`, or `workflow preview`.',
      },
    },
    skeleton: {
      noProfile: 'none',
      executed: "Command '{{command}}' skeleton executed.",
    },
    errors: {
      unexpected: 'CLI execution failed [{{code}}]: {{message}}',
    },
    adapterDiagnostics: {
      disabledByConfig: 'disabled_by_config',
      attribution: 'attribution',
      availability: 'availability',
      reasons: 'reasons',
      routeBlocked: 'Adapter route blocked',
      routeAttention: 'Adapter route attention',
      commandMissing: 'missing command "{{command}}" for surface "{{surface}}"',
      commandProbeFailed:
        'command exists but check failed for surface "{{surface}}" via "{{command}}" ({{detail}})',
      probeFailed: 'adapter probe failed ({{detail}})',
      credentialMissing: 'surface "{{surface}}" is missing required credentials or login state',
      healthCheckTimeout: 'surface "{{surface}}" health check timed out',
      healthCheckInvalidResponse:
        'surface "{{surface}}" returned an invalid health-check response ({{detail}})',
      healthCheckFailedRateLimited: 'surface "{{surface}}" health check is currently rate limited',
      healthCheckFailedQuotaExhausted:
        'surface "{{surface}}" health check is blocked by exhausted quota',
      healthCheckFailed: 'surface "{{surface}}" health check failed ({{detail}})',
      localModelModelMissing:
        'local-model surface "{{surface}}" is missing configured model "{{model}}"',
      localModelConfigMissing:
        'local-model surface "{{surface}}" is missing config fields "{{missingKeys}}"',
      localModelEndpointUnreachable:
        'local-model surface "{{surface}}" cannot reach endpoint "{{endpoint}}" ({{errorCode}}: {{message}})',
      localModelProbeInvalidResponse:
        'local-model surface "{{surface}}" returned invalid probe payload from "{{endpoint}}"',
      disabledByConfigForSurface: 'disabled by config for surface "{{surface}}"',
    },
    adapterVerification: {
      defineRequiredRole: 'Define at least one adapters.roles item with required=true.',
      checkRoleBindings:
        'Check adapters.routing.roleBindings primary/fallback surfaces and ensure required roles have at least one available surface.',
      probeUnavailable: 'Probe/login dependencies are unavailable for: {{toolIds}}.',
      installMissingCommands: 'Install missing local commands before connect/doctor: {{commands}}.',
      probeFailedCommands:
        'Some commands exist but probe failed ({{commands}}). Run them manually to verify login/extension status.',
      setRemoteApiCredentialEnvVars:
        'Set or export the required remote-api credential environment variables before connect/doctor: {{credentials}}.',
      verifyProviderLocalCredentialState:
        'Remote-api credential discovery stays read-only here; verify provider-local login state manually for: {{credentials}}.',
      createCredentialReferences:
        'Create or import the missing secret-backed remote-api credentials before connect/doctor: {{credentials}}. Use `secret set` or `secret import` to populate the backend.',
      optIntoSecretFallback:
        'No default secret backend is available for these credential references: {{credentials}}. Run `secret status` to inspect backend support, or opt into `--backend unsafe-local-file` only if you accept the local-only plaintext fallback.',
      resolveCredentialReferencesManually:
        'Remote-api credential references cannot be materialized automatically; resolve them manually for: {{credentials}}.',
      authenticateAdapters:
        'Authenticate or refresh login for remote adapters before connect/doctor: {{credentials}}.',
      enableAcpRuntimeService:
        'Complete ACP runtime-service enablement and host handoff verification before relying on: {{toolIds}}.',
      verifyAcpPackagedDistribution:
        'Capture ACP packaged-distribution evidence and keep it transport-scoped for: {{toolIds}}.',
      runAcpCleanRoomVerify:
        'ACP runtime-service and packaged-distribution evidence exist for {{toolIds}}; run clean-room verify and keep support wording gated to evidence-backed surfaces.',
      investigateHealthChecks:
        'Investigate remote adapter health checks before unattended execution: {{healthChecks}}.',
      pullLocalModels:
        'Pull or configure the missing local models before unattended execution: {{models}}.',
      provideLocalModelConfig:
        'Provide adapters.tools[].localModel { provider, endpoint, model } for: {{configs}}.',
      checkLocalModelEndpoint:
        'Check local-model endpoint reachability and Ollama health before relying on fallback routing.',
      reviewRoutingPriorities:
        'Primary surfaces are degraded or fallback is in use; review cost/latency/risk routing priorities before unattended execution.',
    },
    initShell: {
      bootstrapTitle: 'Bootstrap workspace defaults',
      bootstrapIntro:
        'React shell baseline is active on stderr; stdout remains reserved for command results.',
      confirmationTitle: 'Step 3 of 3: Confirm bootstrap defaults',
      confirmationPrompt: 'Confirm bootstrap defaults? [Y/n]: ',
      confirmationRestartMessage: 'Selection updated; returning to the first step.',
      submitTitle: 'Applying bootstrap defaults',
      successMessage: 'Interactive setup applied successfully.',
      workspaceModeTitle: 'Step 1 of 3: Workspace mode',
      workspaceModeDescription:
        'Choose where Repo AI Governor should keep its managed workspace metadata.',
      workspaceModePromptLabel: 'Workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
      workspaceModeToolManagedOption:
        'tool_managed: keep metadata under the tool-managed workspace root',
      workspaceModeRepoLocalOption:
        'repo_local: keep metadata inside the current repository workspace',
      workspaceModeValidation: 'Workspace mode must be 1, 2, tool_managed, or repo_local.',
      defaultLocaleTitle: 'Step 2 of 3: Default locale',
      defaultLocaleDescription: 'Choose the default locale used for human-readable CLI copy.',
      defaultLocalePromptLabel: 'Default locale [1=zh-CN, 2=en-US] (default: 1): ',
      defaultLocaleZhCnOption: 'zh-CN: default to Simplified Chinese output',
      defaultLocaleEnUsOption: 'en-US: default to English output',
      defaultLocaleValidation: 'Default locale must be 1, 2, zh-CN, or en-US.',
      submittingDescriptor: 'Submitting descriptor values to config template bridge.',
      cancelledBySigint: 'Interactive shell cancelled by SIGINT.',
      failedBeforeApply: 'Interactive shell failed before bootstrap values were applied.',
      correctWorkspaceMode: 'Please correct the invalid workspace mode value and try again.',
      correctLocale: 'Please correct the invalid locale value and try again.',
    },
    sessionShell: {
      title: 'Repo AI Governor',
      subtitle:
        'Session-first local shell with service-backed transcript, command handoff, and resume continuity.',
      fallbackToHelp:
        'Session shell failed before startup completed, so the CLI fell back to help output. reason={{reason}}',
      resumeRequiresInteractive:
        'The top-level resume command requires interactive TTY + pretty output so the live session shell can attach.',
      workspaceSummary:
        'workspace_id={{workspaceId}} mode={{workspaceMode}} root={{workspaceRoot}}',
      sections: {
        transcript: 'History',
        composer: 'Input',
        secureCaptureComposer: 'Secure input',
        slashPalette: 'Slash palette',
        mentionPalette: 'Role mentions',
        promptBar: 'Prompt bar',
      },
      composer: {
        placeholder: 'Type a message or / command.',
        securePlaceholder: 'Secret input stays hidden while you type.',
      },
      palette: {
        emptyState: 'No matching slash commands. Type /help to view the MVP command set.',
        mentionEmptyState: 'No matching role mentions. Keep typing after @ to target one role.',
      },
      mentions: {
        roles: {
          generic: {
            summary: 'Open-ended discussion with the configured {{roleId}} role.',
          },
          planner: {
            summary: 'Planning, decomposition, and execution strategy discussion.',
          },
          architect: {
            summary: 'Architecture trade-offs, boundaries, and design discussion.',
          },
          reviewer: {
            summary: 'Risk review, code reading, and findings-first feedback.',
          },
          verifier: {
            summary: 'Verification, regression checks, and closure confidence.',
          },
        },
      },
      resumeSelector: {
        latest: 'latest',
      },
      transcript: {
        systemLabel: 'System',
        userLabel: 'You',
        assistantLabel: 'Governor',
        slashLabel: 'Slash command',
      },
      promptBar: {
        modeLine: 'shell_mode={{shellMode}} input_mode={{inputMode}} handoff={{handoffState}}',
        persistenceLine:
          'session_id={{sessionId}} persistence={{persistenceOwner}} resume={{resumeSelector}}',
        routeLine: 'route={{routeId}} theme={{theme}} history={{historyCount}}',
        workspaceLine: 'cwd={{cwd}} workspace={{workspace}}',
        shortcuts:
          'Shortcuts: /help, /history, /search, /multiline, !command, Ctrl+C exit, Ctrl+D close.',
        idleShortcuts: '? shortcuts · /status · Ctrl+D',
        paletteShortcuts: '↑↓ · Tab/Enter · Esc',
        previewShortcuts: '/confirm · /cancel · Esc',
        secureCaptureShortcuts: 'Enter submit · Esc cancel · Ctrl+D',
        showExecutionDetailsShortcut: 'Ctrl+O details',
        hideExecutionDetailsShortcut: 'Ctrl+O hide details',
      },
      commands: {
        help: {
          summary: 'List the currently exposed session-shell slash commands.',
        },
        confirm: {
          summary: 'Confirm the currently previewed command handoff and execute it.',
        },
        cancel: {
          summary: 'Cancel the currently previewed command handoff.',
        },
        clear: {
          summary: 'Clear the local transcript viewport without deleting the persisted session.',
        },
        exit: {
          summary: 'Exit the foreground session shell without deleting transcript state.',
        },
        resume: {
          summary: 'Resume the latest or explicitly requested session transcript.',
        },
        sessions: {
          summary: 'List recent active or archived sessions.',
        },
        fork: {
          summary: 'Fork the current session into a new branch.',
        },
        archive: {
          summary: 'Archive the current or named session.',
        },
        unarchive: {
          summary: 'Restore an archived session and attach to it.',
        },
        history: {
          summary: 'Show recent shell inputs collected in this foreground attachment.',
        },
        search: {
          summary: 'Search the current transcript view and recent shell inputs.',
        },
        multiline: {
          summary: 'Capture one multi-line user message before sending it as a single turn.',
        },
        planSync: {
          summary: 'Preview or commit deterministic sprint-ledger projection for an existing plan.',
        },
        status: {
          summary: 'Show session-shell status and hidden runtime details.',
        },
        theme: {
          summary: 'Inspect or change the current session-shell theme preset.',
        },
        agent: {
          summary: 'Inspect or pin the current foreground session route naming baseline.',
        },
      },
      aiWorkflowPrompts: {
        deliver: {
          currentRepoIntro:
            'Start the governed requirement-to-CR deliver workflow for the current repo.',
          requestIntro:
            'Start the governed requirement-to-CR deliver workflow for the following request.',
          aliasNotice:
            'Treat `/deliver` only as an explicit acceleration alias for the chat-first deliver entry.',
          requestLine: 'Delivery request: {{request}}',
        },
        plan: {
          currentGoalIntro:
            'Use the standard planning template to create an execution plan for the current goal.',
          goalIntro:
            'Use the standard planning template to create an execution plan for the following goal.',
          noSyncNotice: 'Do not sync anything to the sprint ledger yet.',
          goalLine: 'Goal: {{goal}}',
        },
        review: {
          currentScopeIntro:
            'Run the standard governed code-review workflow for the current working scope.',
          scopeIntro: 'Run the standard governed code-review workflow for the following scope.',
          focusNotice: 'Focus on user-visible regressions, behavior risk, and missing tests.',
          structuredNotice:
            'Return a structured review-style result instead of a free-form expert brainstorm.',
          scopeLine: 'Review scope: {{target}}',
        },
        reviewVerify: {
          currentTargetIntro:
            'Run the standard review-verification workflow for the latest governed review context.',
          targetIntro: 'Run the standard review-verification workflow for the following target.',
          recheckNotice:
            'Recheck the existing review artifact or fix result and determine whether accepted findings are actually resolved.',
          structuredNotice:
            'Return a structured verification result rather than an open-ended expert discussion.',
          targetLine: 'Verification target: {{target}}',
        },
      },
      responses: {
        welcome:
          'Session shell is active. Plain text, slash commands, and service-backed transcript replay now share one foreground surface.',
        stderrOnly:
          'Live UI renders only to stderr so stdout remains reserved for machine-readable command output.',
        partialSlashMatch:
          'Matched commands for prefix {{query}}. Type a full slash command or press Tab-style completion in your terminal history.',
        unknownSlashCommand:
          'Unknown slash command "{{command}}". The session shell only exposes the documented command surface.',
        trySlashHelp: 'Use /help to inspect the currently exposed slash command set.',
        verifyRemoved:
          'The public `/verify` slash command has been removed from the session shell.',
        verifyRemovedNextAction:
          'Use `/doctor` for readiness diagnostics, or `/connect` if you need onboarding changes plus follow-up checks.',
        commandPreview: 'Ready: {{command}}',
        commandHandoffPending: 'Command handoff preview is ready for {{command}}.',
        commandConfirmHint:
          'Run /confirm to execute this handoff, or /cancel to discard the preview.',
        commandNotExecutable: 'This slash command has no executable handoff target.',
        secureSecretCaptureReserved:
          '{{command}} is reserved for secure local capture and will not enter command preview.',
        secureSecretCaptureRequiresInk:
          'Secure local capture currently requires the live Ink shell. Re-run {{command}} in interactive pretty mode.',
        secureSecretCaptureActive:
          'Secure local capture is active for {{command}}. Typed input stays hidden on this device.',
        secureSecretCaptureCancelled: 'Secure local capture cancelled for {{command}}.',
        secureSecretCaptureEmpty:
          'No secret was entered for {{command}}. Re-run the command to start secure local capture again.',
        secureSecretCaptureMutationUnavailable:
          'Secure local secret mutation is unavailable in this shell attachment. Re-run {{command}} after the local mutation seam is configured.',
        secureSecretCaptureSucceeded:
          'Secret set completed for {{command}} via backend {{backendId}}.',
        secureSecretCaptureBackendWarning: 'Backend warning: {{warning}}',
        secureSecretCaptureFailed:
          'Secure local secret mutation failed for {{command}}. reason={{reason}}',
        secureSecretCaptureFailedBackendUnavailable:
          'Secure local secret mutation could not reach a writable backend for {{command}}.',
        secureSecretCaptureFailedBackendUnavailableNextStep:
          'Run /secret status to inspect backend availability, or use the standalone CLI with --backend unsafe-local-file --stdin only if you explicitly want the local-only fallback.',
        secureSecretCaptureFailedInvalidInput:
          'Secure local secret mutation rejected the captured input for {{command}}.',
        secureSecretCaptureFailedInvalidInputNextStep:
          'Re-run {{command}} and enter the secret again in secure local capture.',
        secureSecretCaptureFailedOperation:
          'Secure local secret mutation failed while writing the captured secret for {{command}}.',
        secureSecretCaptureFailedOperationNextStep:
          'Run /secret status to inspect backend availability, then retry {{command}} in secure local capture.',
        secureSecretCaptureCaptured:
          'Secure input was captured locally for {{command}}. Direct mutation handoff is not wired in this attachment yet.',
        secureSecretSlashSuffixRejected:
          'Do not enter secret in slash text. Re-run {{command}} and continue in secure local capture.',
        commandExecutionSucceeded: 'Command handoff completed for {{command}}.',
        commandDirectExecutionNotice:
          'This slash command ran immediately, so /confirm is not required.',
        commandExecutionFailed: 'Command handoff failed for {{command}}. reason={{reason}}',
        commandBridgeUnavailable:
          'The current session shell attachment does not have a command-execution bridge.',
        commandArtifact: 'artifact={{artifactPath}}',
        commandArtifactsMore: '+{{count}} more related artifacts were written.',
        deliveryPhaseField: 'Delivery phase: {{phase}}',
        deliveryPendingActionField: 'Pending action: {{pendingAction}}',
        deliverySelectedStreamField: 'Target stream: {{selectedStream}}',
        deliveryResultSummaryField: 'Delivery summary: {{resultSummary}}',
        deliverySummaryTitle: 'Delivery workflow',
        deliverySummarySummaryLine: 'Presenter-safe delivery workflow summary is available.',
        relatedLinksTitle: 'Related',
        commandSummary: 'Summary: {{summary}}',
        commandStatusSummary: 'Key status: {{summary}}',
        commandFailureSummary: 'Failure: {{summary}}',
        commandAgentSummary: 'Agent routing: {{summary}}',
        commandAttentionSummary: 'Attention: {{summary}}',
        commandDoctorSummaryReadWrite: 'Workspace is writable. Baseline doctor checks completed.',
        commandDoctorSummaryReadOnly:
          'Workspace is read-only. Doctor completed in inspection-only mode.',
        commandDoctorSummaryGeneric: 'Doctor checks completed.',
        commandDoctorAdapterChecksEnabled: 'adapter checks run',
        commandDoctorAdapterChecksSkipped: 'adapter checks not run',
        commandDoctorCheckTotals: '{{pass}} pass / {{warn}} warn / {{fail}} fail',
        commandDoctorAttentionBaselineDocs:
          'repo-local baseline docs are missing ({{missing}}/{{total}})',
        commandDoctorAttentionArtifactRegistryUninitialized:
          'artifact registry is not initialized yet',
        commandDoctorAttentionTaskLedgerUninitialized: 'task ledger is not initialized yet',
        commandErrorHint: 'Hint: {{hint}}',
        commandErrorNextAction: 'Next step: {{nextAction}}',
        commandErrorNextActionCheckCommandUsage: 'Check the command usage and required flags.',
        commandErrorNextActionInspectGovernorConfig: 'Inspect the active governor config.',
        commandErrorNextActionInspectPolicyDiagnostics:
          'Inspect the policy diagnostics and blocked decision details.',
        commandErrorNextActionCheckReplaySource:
          'Inspect the replay source and verify the referenced artifact paths.',
        commandErrorNextActionRetryWithVerbose:
          'Retry the command with verbose diagnostics enabled.',
        commandErrorNextActionReportIssue:
          'Capture the diagnostics and report the issue with the failing command context.',
        commandErrorConnectMissingAdaptersBaseline:
          'Recovery: the active governor config is missing the adapters baseline. If this is first-time setup, run /init first. If the config already exists but is broken, run /workspace clear-config, then /init, or repair governor.yaml before retrying /connect.',
        commandCancelled: 'The pending command preview was cancelled.',
        cancelWithoutPendingCommand:
          'There is no pending command preview to cancel in the current shell.',
        confirmWithoutPendingCommand:
          'There is no pending command preview to confirm in the current shell. Direct slash commands such as /review may already have executed.',
        exitBySlash: 'The foreground shell closed after /exit.',
        exitBySigint: 'The foreground shell closed after Ctrl+C.',
        exitByEof: 'The foreground shell closed after Ctrl+D.',
        exitKeepsTranscript:
          'Exit only closes the live shell surface. Persisted transcript state remains resumable.',
        turnFailed: 'The main session turn failed. reason={{reason}}',
        turnCancelled: 'The main session turn was cancelled before completion.',
        turnRecoverableHint: 'You can keep chatting, retry the turn, or switch to /resume.',
        turnRetryingAfterSessionRecovery:
          'The shell is retrying your latest message in a new attached session.',
        liveTurnRunningSummary: 'Running · {{elapsed}}',
        liveTurnWaitingTransportSummary: 'Waiting for transport · {{elapsed}}',
        liveTurnWaitingProgressSummary: 'Waiting for progress · {{elapsed}}',
        liveTurnGracefulInterruptSummary: 'Graceful interrupt · {{elapsed}}',
        liveTurnHardTerminateSummary: 'Hard terminate · {{elapsed}}',
        liveTurnThinking: 'Thinking...',
        liveTurnThinkingPulse: 'Thinking{{suffix}}',
        liveTurnThinkingDetail: 'Thinking: {{detail}}',
        liveTurnCurrentDetail: '{{detail}}',
        liveTurnRoleActivity: '{{role}}: {{detail}}',
        liveTurnRoleReply: '{{role}} reply: {{detail}}',
        liveTurnToolCall: 'Tool: {{toolName}} - {{detail}}',
        liveTurnWaitingTransportDetail: 'Still waiting for transport activity on {{surface}}.',
        liveTurnWaitingProgressDetail: 'Still waiting for semantic progress on {{surface}}.',
        liveTurnGracefulInterruptDetail: 'Graceful interrupt is in progress on {{surface}}.',
        liveTurnHardTerminateDetail: 'Hard termination is in progress on {{surface}}.',
        liveTurnLivenessReasons: 'Reasons: {{reasons}}.',
        liveTurnPartialOutputPreserved: 'Partial output is preserved.',
        liveTurnReasonHardTimeout: 'timeout budget exhausted',
        liveTurnReasonPartialOutputPreserved: 'partial output preserved',
        liveTurnReasonTransportIdleTimeout: 'transport stayed idle too long',
        liveTurnReasonSemanticStallTimeout: 'semantic progress stalled too long',
        liveTurnReasonGracefulInterruptExceeded: 'graceful interrupt exceeded the allowed window',
        liveTurnActivityTitle: 'Live activity',
        executionDetailsTitle: 'Execution details',
        executionDetailsCollapsed: '▶ Collapsed · {{count}} entries · Ctrl+O to open',
        executionDetailsExpanded: '▼ Expanded · {{count}} entries · Ctrl+O to hide',
        mainTurnAccepted:
          'route={{routeId}} turn={{turnIndex}} accepted by the shared session runtime.',
        mainTurnEcho: 'echo={{userMessage}}',
        mainTurnSuggestedSlash: 'Suggested next step: {{command}}',
        mainTurnAutoExecuteSlash: 'Auto-running: {{command}}',
        mainTurnHandoffPreview: 'Preview: {{preview}}',
        mainTurnAutoExecuteCommand: 'Running: {{preview}}',
        mainTurnCollaborationAccepted: '{{mode}} completed.',
        mainTurnCollaborationRoles: 'Active role: {{roles}} (count={{count}})',
        mainTurnCollaborationSynthesis: 'Synthesis: {{synthesisMode}}',
        mainTurnCollaborationModeSingleRole: 'Single-role delegate',
        mainTurnCollaborationModeSerial: 'Serial role collaboration',
        mainTurnCollaborationModeParallel: 'Parallel role fan-out',
        mainTurnExecutionSurface: 'Execution surface: {{selectedSurface}}',
        mainTurnExecutionSurfaceFallback:
          'Execution surface selection switched to a fallback automatically.',
        mainTurnExecutionIntent: 'Intent: {{executionIntent}}',
        mainTurnRoutingSelection: 'Routing: surface={{selectedSurface}} selected_by={{selectedBy}}',
        mainTurnBacklink: 'Backlink: kind={{kind}} label={{label}} target={{target}}',
        mainTurnSuggestedActionsTitle: 'Suggested next steps',
        providerContinuationTitle: 'Provider continuation',
        providerContinuationTransportSummary: ' transport={{transportKind}}',
        providerContinuationModelSummary: ' model={{model}}',
        providerContinuationReasonSummary: ' reason={{reason}}',
        providerContinuationCreated:
          '{{laneLabel}}: started backend conversation on {{surface}}{{transportSummary}}{{modelSummary}}.',
        providerContinuationReused:
          '{{laneLabel}}: reused backend conversation on {{surface}}{{transportSummary}}{{modelSummary}}.',
        providerContinuationRefreshed:
          '{{laneLabel}}: refreshed backend conversation on {{surface}}{{transportSummary}}{{modelSummary}}{{reasonSummary}}.',
        providerContinuationCleared:
          '{{laneLabel}}: cleared backend conversation state on {{surface}}{{transportSummary}}{{modelSummary}}{{reasonSummary}}.',
        providerContinuationFallbackActive:
          '{{laneLabel}}: continuity stayed available through the lightweight session note; {{surface}}{{transportSummary}}{{modelSummary}} did not provide backend reuse{{reasonSummary}}.',
        providerContinuationUnsupported:
          '{{laneLabel}}: backend reuse on {{surface}}{{transportSummary}}{{modelSummary}} is unsupported, and no lightweight session note was available to preserve continuity{{reasonSummary}}.',
        mainTurnFollowUpPrompt: 'The main agent needs one clarification before handoff:',
        sessionStarted: 'Started service-backed session {{sessionId}} on {{routeId}}.',
        sessionResumed: 'Resumed session {{sessionId}} via selector={{resumeSelector}}.',
        sessionForkedFrom:
          'Forked session {{sourceSessionId}} into the current branch {{sessionId}}.',
        sessionNoteSummary: 'Note: {{summary}}',
        sessionPreviewSummary: 'Preview: {{summary}}',
        sessionArchivedAt: 'Archived at {{archivedAt}}.',
        sessionsHeading: 'Recent sessions (filter={{filter}}):',
        sessionsEmpty: 'No recent sessions matched filter={{filter}}.',
        sessionsEntry:
          'session={{sessionId}} status={{status}} source={{sourceKind}} opened_at={{openedAt}}',
        sessionsDisplayName: 'display_name={{displayName}}',
        sessionsNoteSummary: 'note={{summary}}',
        sessionsPreviewSummary: 'preview={{summary}}',
        sessionsArchivedAt: 'archived_at={{archivedAt}}',
        sessionsUnknownFilter:
          'Unsupported /sessions filter {{filter}}. Use active, archived, or all.',
        sessionsFailed: 'Failed to list sessions. reason={{reason}}',
        sessionArchived: 'Archived session {{sessionId}}.',
        sessionArchiveReplacementAttached:
          'Attached a fresh session {{sessionId}} so the foreground shell can keep running.',
        forkFailed: 'Failed to fork the current session. reason={{reason}}',
        archiveFailed: 'Failed to archive the requested session. reason={{reason}}',
        unarchiveRequiresSessionId:
          'Pass one archived session id after /unarchive so the shell knows which session to restore.',
        unarchiveFailed: 'Failed to restore the requested session. reason={{reason}}',
        resumeFailed: 'Failed to resume {{resumeSelector}}. reason={{reason}}',
        resumeAvailableSessions: 'Known resumable sessions: {{sessionIds}}',
        resumeRecoverableHint:
          'No recent resumable session index was available; keep chatting to create a new session.',
        resumeRecoveredWithNewSession:
          'A new session was created so the foreground shell can stay attached.',
        sessionRecoveredContinueHint:
          'The shell reattached to a new session so foreground actions can continue.',
        localTranscriptCleared:
          'The local transcript viewport was cleared. Persisted session history is still resumable.',
        historyEmpty: 'No shell inputs have been recorded in this foreground attachment yet.',
        searchRequiresQuery: 'Pass a search term after /search.',
        searchNoMatch: 'No transcript or history lines matched {{query}}.',
        searchMatches: 'Matched transcript/history lines for {{query}}:',
        statusAttached: 'Attached to session {{sessionId}} on {{routeId}}.',
        statusRuntime:
          'Resume={{resumeSelector}} persistence={{persistenceOwner}} theme={{theme}} output={{output}}.',
        statusWorkspace: 'Workspace: {{workspace}}',
        statusStartup:
          'Startup path={{startupPath}} lazy_boundary={{lazyBoundary}} bootstrap_ms={{bootstrapMs}}.',
        statusProjection: 'Projection source={{sourceKind}} display_name={{displayName}}.',
        themeCurrent: 'Current session theme={{theme}}.',
        themeAvailable: 'Available themes: {{themes}}.',
        themeUnknown: 'Unknown theme {{theme}}. Choose one of: {{themes}}.',
        themeUpdated: 'Updated the current foreground session theme to {{theme}}.',
        agentCurrent: 'Current foreground session route={{routeId}}.',
        agentUnsupported:
          'Route {{routeId}} is not supported yet. The session shell currently routes foreground turns to session.main only.',
        agentUpdated: 'Foreground route remains pinned to {{routeId}}.',
        multilineCancelled: 'Multi-line capture finished without any message body.',
        passthroughRequiresCommand: 'Pass a shell command after ! to enable passthrough.',
        passthroughFailed: 'Shell passthrough failed. reason={{reason}}',
        passthroughCompleted:
          'Shell passthrough finished for {{command}} with exit_code={{exitCode}}.',
      },
      multilinePrompt: 'multiline> finish with {{terminator}} on its own line',
    },
    commandMessages: {
      config: {
        nextStepTitle: 'Next step',
        precedenceHint:
          'Remember the precedence boundary: explicit CLI args and workspace governor.yaml stay above user-config.yaml defaults.',
        getCompleted: 'Resolved user-local default {{keyPath}}={{value}}.',
        getMissing: 'User-local default {{keyPath}} is currently unset.',
        setCompleted: 'Persisted user-local default {{keyPath}}={{value}}.',
        unsetCompleted: 'Removed user-local default {{keyPath}} from the canonical config.',
        listCompleted: 'Listed {{count}} populated user-local default entries.',
        statusCompleted: 'User-local config status loaded from {{configPath}}.',
      },
      secret: {
        nextStepTitle: 'Next step',
        precedenceHint:
          'Store only selectors like secret://... in config; keep real secret values in the backend.',
        noneLabel: 'none',
        setCompleted: 'Stored managed secret {{keyName}} in backend {{backend}}.',
        importCompleted: 'Imported managed secret {{keyName}} into backend {{backend}}.',
        deleteCompleted: 'Secret cleanup completed for {{keyName}}; deleted_backends={{count}}.',
        listCompleted: 'Listed {{count}} managed secret records.',
        statusCompleted: 'Secret backend status loaded for {{backend}}.',
      },
      connect: {
        consumeLedgerBackfill: 'Consume ledger backfill',
        resolveLedgerBackfill:
          'Resolve context/ledger-backfill/connect artifact into tasks/checklist/tasks.csv.',
        completed:
          'Connect completed with adapter_status={{adapterStatus}}; diagnostics={{diagnosticsPath}}.',
      },
      doctor: {
        safeLocalFixHint:
          'safe_local fix only creates writable workspace/config/memory baseline paths; it never installs commands, logs in adapters, or pulls local models.',
      },
      plan: {
        defaultSprintGoal: 'Structured planning preview for the active sprint.',
        inspectPreview: 'Inspect preview artifact at {{previewPath}}.',
        runCommit: 'When ready, run {{command}} to commit this preview into the sprint ledger.',
        reviewSprintPlan:
          'Review the active sprint plan and Task Package inputs, then rerun `plan` preview.',
        previewCompleted:
          'Plan preview completed with readiness={{readiness}}; preview={{previewPath}}.',
        previewCompletedReadOnly:
          'Plan preview completed in non-commit-ready mode (readiness={{readiness}}); preview={{previewPath}}.',
        nextStepTitle: 'Next step',
        missingArtifactPath:
          'plan commit requires one preview artifact path argument. Re-run `plan` preview first when needed.',
        commitTargetDrift:
          'plan commit is blocked because the active primary stream no longer matches the preview target stream.',
        invalidPreviewArtifact:
          'Plan preview artifact is incomplete or outdated: {{previewPath}}. Re-run `plan` preview.',
        commitRejected: 'Plan commit was rejected before ledger mutation; receipt={{receiptPath}}.',
        commitPreviewNotReady:
          'plan commit cannot continue because {{previewPath}} is not commit-ready (readiness={{readiness}}).',
        commitCompleted:
          'Plan commit completed; receipt={{receiptPath}} created={{createdCount}} retained={{retainedCount}}.',
        inspectCommitReceipt: 'Inspect commit receipt at {{receiptPath}}.',
        invalidAction: 'Unsupported plan action "{{action}}". Supported actions: {{supported}}.',
        commitRequiresConfirmationDecision: 'plan commit requires `--confirm-plan approve|reject`.',
        invalidConfirmationDecision:
          'Unsupported plan confirmation decision "{{decision}}". Use `approve` or `reject`.',
        syncTaskLedgerUnavailable:
          'Task-ledger sync script is unavailable in the current installation; cannot finish plan commit.',
      },
      upgrade: {
        missingConfig: 'upgrade requires config file at {{configPath}}; run `init` first.',
        missingArtifactPath:
          'upgrade {{action}} requires one artifact path argument. Re-run the preview first when needed.',
        missingRollbackSnapshot:
          'Rollback snapshot is missing: {{artifactPath}}. Re-run `upgrade` preview to regenerate it.',
        missingRollbackSource: 'Rollback source artifact is missing: {{artifactPath}}.',
        invalidAction: 'Unsupported upgrade action "{{action}}". Supported actions: {{supported}}.',
        invalidConfirmationDecision:
          'Unsupported upgrade confirmation decision "{{decision}}". Use `approve` or `reject`.',
        unsupportedTargetVersion:
          'Unsupported target schema version {{targetVersion}}. Supported versions: {{supported}}.',
        invalidReportArtifact:
          'Upgrade report artifact is incomplete or outdated: {{reportPath}}. Re-run `upgrade` preview.',
        invalidAutoMigratedConfigArtifact:
          'Auto-migrated config artifact is incomplete or outdated: {{artifactPath}}. Re-run `upgrade` preview.',
        reportWorkspaceMismatch:
          'Upgrade report config path {{reportConfigPath}} does not match the active workspace config {{workspaceConfigPath}}.',
        applySourceDrift:
          'upgrade apply is blocked because the active governor.yaml has changed since {{reportPath}} was generated.',
        applyBlocked:
          'Upgrade apply is blocked until preview artifacts are regenerated and become apply-ready.',
        confirmationRequiredForApply:
          'upgrade apply requires `--confirm-upgrade approve|reject` when preview reported confirmation items.',
        applyRequiresWriteAccess: 'upgrade apply requires write access to {{configPath}}.',
        rollbackRequiresWriteAccess: 'upgrade rollback requires write access to {{configPath}}.',
        rollbackReferenceReason:
          'Controlled upgrade preview keeps the current config snapshot as the explicit rollback source.',
        inspectReport:
          'Inspect {{reportPath}} and compare it with {{autoMigratedConfigPath}} before applying any config change.',
        confirmItems: 'Confirm every listed confirmation item before replacing governor.yaml.',
        keepRollback:
          'Keep {{rollbackSnapshotPath}} as the rollback source if you later write the migrated config back.',
        applyWithReport:
          'When ready, run {{command}} to write the migrated config through the controlled apply path.',
        rollbackWithReceipt: 'If you want to restore the prior config later, run {{command}}.',
        artifactsGenerated: 'Upgrade analysis artifacts were generated.',
        previewCompleted:
          'Upgrade preview completed with readiness={{readiness}}; report={{reportPath}}.',
        previewReadiness: 'Preview readiness={{readiness}}.',
        manualConfirmationRequired:
          'Manual confirmation is required before applying upgrade changes.',
        noManualConfirmation: 'No manual confirmation is required for the analyzed upgrade path.',
        applyCompleted:
          'Upgrade apply completed; apply_receipt={{applyReceiptPath}} verify_receipt={{verifyReceiptPath}}.',
        applyRejected:
          'Upgrade apply was rejected before mutation; apply_receipt={{applyReceiptPath}}.',
        applyRejectedSummary: 'Upgrade apply stopped after an explicit reject decision.',
        applyResultSummary: 'Upgrade apply status={{status}}.',
        verifyResultSummary: 'Upgrade verify status={{status}}.',
        verifyFailed:
          'Upgrade verify failed after write; inspect {{verifyReceiptPath}} for details and recovery evidence.',
        confirmationApplied: 'Confirmation decision accepted for controlled apply.',
        rollbackCompleted: 'Upgrade rollback completed; rollback_receipt={{rollbackReceiptPath}}.',
        rollbackResultSummary: 'Upgrade rollback restored the prior config snapshot.',
        reviewUpgradeArtifacts: 'Review upgrade artifacts',
        confirmUpgradeChanges: 'Confirm upgrade changes',
        runControlledApply: 'Run controlled apply',
        retainRollbackSnapshot: 'Retain rollback snapshot',
        runRollback: 'Run rollback',
        inspectApplyReceiptTitle: 'Inspect apply receipt',
        inspectVerifyReceiptTitle: 'Inspect verify receipt',
        inspectRollbackReceiptTitle: 'Inspect rollback receipt',
        inspectApplyReceipt: 'Inspect apply receipt at {{applyReceiptPath}}.',
        inspectVerifyReceipt: 'Inspect verify receipt at {{verifyReceiptPath}}.',
        inspectRollbackReceipt: 'Inspect rollback receipt at {{rollbackReceiptPath}}.',
        rerunPreviewAfterRollback:
          'Re-run `upgrade` preview when you want to generate a fresh upgrade report from the restored config.',
      },
      init: {
        selectWorkspaceMode: 'Select workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
        selectDefaultLocale: 'Select default locale [1=zh-CN, 2=en-US] (default: 1): ',
        interactiveApplied:
          '\nInteractive setup applied: workspace={{workspaceMode}}, defaultLocale={{defaultLocale}}.\n',
        reactShellFallbackToClassic:
          'React shell initialization failed; falling back to classic bootstrap. reason={{reason}}.',
      },
      workflow: {
        invalidTemplate:
          'Unsupported workflow template "{{template}}". Supported templates: {{supported}}.',
      },
      workspace: {
        migrationExecuted: 'Workspace migration executed successfully; plan={{planPath}}.',
        rollbackCompleted: 'Workspace rollback completed; rollback={{rollbackPath}}.',
        planGenerated: 'Workspace migration plan generated; plan={{planPath}}.',
      },
    },
    reactShell: {
      shared: {
        inputs: 'Inputs',
        summary: 'Summary',
        attention: 'Attention',
        help: 'Help',
        agentProjection: 'Agent projection',
        enabled: 'enabled',
        disabled: 'disabled',
        notSet: 'not set',
        shortcuts: 'Shortcuts',
        selection: 'Selection',
        session: 'Session',
        details: 'Details',
        lifecycle: 'Lifecycle',
        validationFeedbackRequiresAnotherInputPass:
          'Validation feedback requires another input pass.',
        rendersOnStderrOnly: 'React shell renders on stderr only.',
        moveFocus: 'Up/Down choose',
        confirm: 'Y confirm',
        enterConfirm: 'Enter confirm',
        restart: 'N restart',
        submit: 'Enter submit',
        cancel: 'Ctrl+C cancel',
        unmountedState: 'unmounted state={{state}} fallback={{fallback}}',
      },
      themePresets: {
        governor: {
          description: 'Cool slate-blue default with higher governance contrast.',
        },
        copilot: {
          description: 'Compact blue-black shell inspired by GitHub Copilot surfaces.',
        },
        catppuccin: {
          description: 'Vivid pastel palette for a more expressive shell surface.',
        },
        calm: {
          description: 'Soft low-contrast palette for longer sessions.',
        },
        'tokyo-night': {
          description: 'Electric midnight blues with crisp cyan-violet highlights.',
        },
        kanagawa: {
          description: 'Muted Japanese-ink palette with warm neutrals and soft gold accents.',
        },
        flexoki: {
          description: 'Warm ink-on-paper contrast with readable amber and teal accents.',
        },
      },
      themeSelector: {
        title: 'Choose a React shell theme',
        workspaceDescription:
          'Persist one default theme for the current workspace. The selected preset becomes the workspace-layer default.',
        globalDescription:
          'Persist one global theme shared by every workspace. The selected preset becomes the CLI-wide default.',
        validation:
          'The selected theme must be one of governor, copilot, catppuccin, calm, tokyo-night, kanagawa, or flexoki.',
        submittingTitle: 'Applying theme selection',
        submittingMessage: 'Persisting theme "{{theme}}" to {{scope}} scope.',
        successMessage: 'Theme "{{theme}}" is now the {{scope}} default.',
        cancelledBySigint: 'Theme selector cancelled by SIGINT.',
        failedBeforeApply: 'Theme selector failed before the selected preset was applied.',
        availableThemesTitle: 'Available themes:',
        selectorTitle: 'Selector:',
        selectorHint:
          'Run set-ui-theme or workspace set-ui-theme without [theme] in interactive TTY + pretty mode to open the selector instead of typing a preset.',
        nonInteractiveError:
          'set-ui-theme needs a theme preset in non-interactive mode. Pass one of: {{themes}}. In interactive TTY + pretty mode you can omit [theme] to open the selector.',
      },
      footer: {
        stdoutSummaryFollows: 'stdout summary follows',
        uiNoneDisablesShell: '--ui none disables shell',
        workspaceRollbackRestoresPriorState: '--workspace-action rollback restores prior state',
      },
      progress: {
        title: 'Running progress',
        elapsed: 'Elapsed: {{elapsed}}',
        heartbeat: 'Heartbeat: {{tick}}',
        steps: 'Step {{completed}}/{{total}}',
        artifactsTitle: 'Artifacts',
        logsTitle: 'Recent logs',
        logs: {
          level: {
            debug: 'DEBUG',
            info: 'INFO',
            success: 'SUCCESS',
            warning: 'WARN',
            error: 'ERROR',
          },
        },
        shortcut: {
          exit: 'Ctrl+C exit',
          cancel: 'Ctrl+C cancel',
        },
        cancel: {
          none: 'Cancellation is not available for this command yet.',
          supported: 'Press Ctrl+C to request cancellation.',
          requested: 'Cancellation requested. Waiting for command shutdown.',
          forced: 'Second Ctrl+C received. Stopping command immediately.',
        },
        status: {
          running: 'Running {{command}}…',
        },
        connect: {
          starting: 'Preparing connect execution…',
          buildCandidate: 'Build candidate config',
          verifyingAdapters: 'Verify adapters',
          buildingProjection: 'Build agent projection',
          writingArtifacts: 'Write diagnostics artifacts',
          completed: 'Connect diagnostics are ready.',
          cancelled: 'Connect execution was cancelled.',
        },
        doctor: {
          starting: 'Preparing doctor execution…',
          workspaceChecks: 'Inspect workspace baseline',
          verifyingAdapters: 'Verify adapters',
          writingArtifacts: 'Write diagnostics artifacts',
          completed: 'Doctor diagnostics are ready.',
          cancelled: 'Doctor execution was cancelled.',
        },
        verify: {
          starting: 'Preparing verify execution…',
          verifyingAdapters: 'Verify adapters',
          writingArtifacts: 'Write diagnostics artifacts',
          completed: 'Verify diagnostics are ready.',
          failed: 'Verify found required adapter failures.',
          cancelled: 'Verify execution was cancelled.',
        },
        run: {
          starting: 'Preparing run execution…',
          assembling: 'Assemble task-driven run',
          compiling: 'Compile process IR',
          executingRuntime: 'Execute runtime graph',
          writingArtifacts: 'Write execution artifacts',
          completed: 'Run execution finished.',
          failed: 'Run execution ended with a failure.',
        },
      },
      connect: {
        title: 'Connect adapters and capture diagnostics',
        fields: {
          workspaceRoot: 'Workspace root',
          recordLedger: 'Record ledger backfill',
          taskId: 'Task ID',
        },
        help: {
          stderrBoundary:
            'Connect keeps stdout reserved for result summaries while stderr can host the shared React shell.',
          ledgerBackfill:
            'Use --record-ledger together with --task-id when you need connect diagnostics to feed sprint task ledgers.',
        },
        status: {
          verification: 'Adapter verification status: {{status}}.',
        },
        message: {
          completed:
            'Connect completed with adapter_status={{status}}; diagnostics={{diagnosticsPath}}.',
        },
        summary: {
          diagnosticsArtifact: 'Diagnostics artifact: {{path}}',
          roleTotals:
            'Required roles={{requiredRoles}}; failures={{requiredFailures}}; degraded={{degradedRoles}}; fallback={{fallbackRoles}}.',
        },
      },
      upgrade: {
        title: 'Review analyzed upgrade artifacts',
        fields: {
          workspaceRoot: 'Workspace root',
          sourceVersion: 'Source version',
          targetVersion: 'Target version',
          confirmationDecision: 'Confirmation decision',
        },
        help: {
          analyzeOnly:
            'Preview keeps governor.yaml unchanged; controlled apply and rollback continue to use the same React shell summary without owning mutation truth.',
          rollbackReference:
            'Keep the rollback snapshot and receipts so preview/apply/rollback remain replayable and diagnosable.',
        },
        status: {
          manualConfirmation:
            'Manual confirmation remains required before applying {{count}} blocking upgrade change(s).',
          previewReady: 'Upgrade preview is ready for targetVersion={{targetVersion}}.',
          applyBlocked:
            'Upgrade apply is currently blocked until preview artifacts are regenerated.',
          applyCompleted: 'Controlled upgrade apply completed successfully.',
          applyRejected: 'Controlled upgrade apply was rejected before mutation.',
          verifyFailed:
            'Upgrade verify failed after the write path and recovery evidence was recorded.',
          rollbackCompleted: 'Upgrade rollback completed successfully.',
        },
        summary: {
          reportPath: 'Upgrade report: {{path}}',
          autoMigratedConfigPath: 'Auto-migrated config: {{path}}',
          rollbackSnapshotPath: 'Rollback snapshot: {{path}}',
          applyReceiptPath: 'Apply receipt: {{path}}',
          verifyReceiptPath: 'Verify receipt: {{path}}',
          rollbackReceiptPath: 'Rollback receipt: {{path}}',
          counts:
            'Suggestions={{suggestions}} confirmations={{confirmations}} blocking={{blocking}}.',
          applyReadiness: 'Apply readiness={{readiness}}.',
        },
      },
      workspace: {
        clearConfigTitle: 'Clear current workspace config',
        switchBranchTitle: 'Switch current git branch',
        setThemeTitle: 'Persist current React shell theme',
        title: 'Plan or execute workspace migration',
        fields: {
          action: 'Workspace action',
          targetMode: 'Target workspace mode',
          targetRoot: 'Target workspace root',
          planPath: 'Rollback plan path',
          currentMode: 'Current workspace mode',
          currentRoot: 'Current workspace root',
          activeConfigPaths: 'Active config paths',
          targetBranch: 'Target branch',
          repositoryRoot: 'Repository root',
          receiptPath: 'Receipt path',
          themeScope: 'Theme scope',
          themePreferencePaths: 'Theme preference paths',
        },
        actions: {
          dryRun: 'Dry run',
          execute: 'Execute',
          rollback: 'Rollback',
          clearConfig: 'Clear config',
          branchSwitch: 'Switch branch',
          setUiTheme: 'Set UI theme',
        },
        help: {
          stableOutputContract:
            'Workspace keeps the machine-readable output contract stable while previewing migration intent in the shared React shell.',
          persistPlan:
            'Persist the generated plan artifact so rollback can restore the previous selector state when needed.',
          clearConfigRemovesSelectorState:
            'clear-config removes the current selector/config files used to resolve the active workspace surface.',
          clearConfigKeepsArtifacts:
            'clear-config does not delete diagnostics, workflow definitions, review queue artifacts, or other workspace records.',
          branchSwitchRequiresCleanTree:
            'switch-branch only runs when the current git worktree is clean, so it cannot silently strand uncommitted changes.',
          branchSwitchLocalOnly:
            'switch-branch only targets existing local branches; fetch or create the branch explicitly first when it is not present.',
          setThemePersistsToConfig:
            'set-ui-theme persists the workspace config by default, or the global user-config file when --theme-scope global is used; when a separate repo-local selector config already exists, workspace persistence keeps it in sync too.',
          setThemeFlagStillOverrides:
            '--ui-theme still works as a one-off override for the current command even after the default theme is persisted.',
        },
        scope: {
          workspace: 'workspace',
          global: 'global',
        },
        persistenceTarget: {
          workspaceConfig: 'workspace config',
          workspaceAndRepoLocalSelectorConfig:
            'active workspace config and repo-local selector config',
          globalUserConfig: 'global user-config',
        },
        status: {
          executionCompleted: 'Workspace migration execution completed.',
          rollbackCompleted: 'Workspace rollback completed.',
          dryRunCompleted: 'Workspace migration dry-run completed.',
          clearConfigCompleted: 'Current workspace config cleared.',
          clearConfigNoop: 'No current workspace config was present to clear.',
          branchSwitchCompleted: 'Switched the current repository branch to {{targetBranch}}.',
          branchSwitchNoop: 'The current repository is already on branch {{targetBranch}}.',
          setThemeCompleted:
            'Default React shell theme persisted as {{theme}} for {{scope}} scope in {{target}}.',
        },
        message: {
          executeCompleted: 'Workspace migration executed successfully; plan={{planPath}}.',
          rollbackCompleted: 'Workspace rollback completed; rollback={{rollbackPath}}.',
          dryRunCompleted: 'Workspace migration plan generated; plan={{planPath}}.',
          clearConfigCompleted: 'Cleared {{count}} workspace config file(s): {{paths}}.',
          clearConfigNoop: 'No current workspace config file was found. Inspected: {{paths}}.',
          branchSwitchCompleted:
            'Switched from {{currentBranch}} to {{targetBranch}} in {{repositoryRoot}}; receipt={{artifactPath}}.',
          branchSwitchNoop:
            'Already on {{targetBranch}} in {{repositoryRoot}}; receipt={{artifactPath}}.',
          setThemeCompleted:
            'Persisted React shell theme {{theme}} for {{scope}} scope in {{target}} ({{count}} file(s)): {{paths}}.',
        },
        errors: {
          branchSwitchTargetRequired:
            'workspace switch-branch requires a target branch. Pass one existing local branch name after the action.',
          branchSwitchRequiresGitRepo:
            'workspace switch-branch requires a git repository root. Could not resolve one from {{repositoryRoot}}.',
          branchSwitchInvalidTarget: '"{{targetBranch}}" is not a valid Git branch name.',
          branchSwitchValidateTargetFailed:
            'Failed to validate branch name "{{targetBranch}}" with git check-ref-format.',
          branchSwitchReadCurrentFailed:
            'Failed to read the current git branch from {{repositoryRoot}}.',
          branchSwitchDirtyWorktree:
            'workspace switch-branch refuses to switch branches while the worktree has uncommitted changes.',
          branchSwitchMissingLocalBranch:
            'Local branch "{{targetBranch}}" does not exist yet. Fetch or create it explicitly before switching.',
          branchSwitchCheckLocalFailed:
            'Failed to verify whether local branch "{{targetBranch}}" exists.',
          branchSwitchInspectStatusFailed: 'Failed to inspect git status for {{repositoryRoot}}.',
          branchSwitchSwitchFailed: 'Failed to switch from {{currentBranch}} to {{targetBranch}}.',
          branchSwitchVerifyActiveFailed:
            'Failed to verify that {{targetBranch}} became the active branch after switching.',
          branchSwitchUnexpectedActiveBranch:
            'Expected {{targetBranch}} to be active, but git reports {{currentBranch}} instead.',
        },
        nextStepTitle: 'Next step',
        nextActions: {
          keepPlanRollback:
            'Keep {{planPath}} so you can run an explicit rollback if the new workspace surface is not acceptable.',
          rerunDoctorBeforeAdopt:
            'Re-run doctor/check against {{workspaceRoot}} before adopting it as the default workspace surface.',
          verifyRollbackTargetCleared:
            'Verify that {{workspaceRoot}} is no longer the active target before rerunning workspace execute.',
          inspectPlanBeforeExecute:
            'Inspect {{planPath}} and confirm the target workspace root before executing the migration.',
          useExecuteWhenReady:
            'Use --workspace-action execute with the same --workspace-mode/--workspace-root inputs when you are ready to cut over.',
          reRunInitAfterClear:
            'Re-run init when you want to bootstrap a fresh workspace config in this repository.',
          rerunWorkspaceAfterClear:
            'Re-run workspace dry-run/execute if you want to recreate the workspace selector from scratch.',
          inspectExpectedConfigPaths:
            'Inspect {{paths}} if you expected an active workspace config to exist.',
          verifyActiveBranchStatus:
            'Run `git status --short --branch` to confirm {{targetBranch}} is now active and the worktree is still clean.',
          continueOnSwitchedBranch:
            'Continue your governed work on {{targetBranch}} now that the branch switch receipt is recorded.',
          rerunPrettyAfterThemeChange:
            'Re-run one pretty-mode command to confirm the persisted {{theme}} theme is now the default React shell surface.',
          useUiThemeFlagAsOverride:
            'Keep using --ui-theme when you need a one-off shell override without changing the persisted default.',
        },
        summary: {
          migrationId: 'Migration ID: {{migrationId}}',
          primaryArtifact: 'Primary artifact: {{path}}',
          inspectedConfigPaths: 'Inspected config paths: {{paths}}',
          clearedConfigPath: 'Cleared config path: {{path}}',
          noConfigRemoved: 'No config paths were removed.',
          activeBranch: 'Previously active branch: {{branch}}',
          targetBranch: 'Target branch: {{branch}}',
          appliedTheme: 'Applied theme: {{theme}}',
          appliedThemeScope: 'Applied theme scope: {{scope}}',
          persistenceTarget: 'Persistence target: {{target}}',
          persistedConfigPaths: 'Persisted config paths: {{paths}}',
        },
      },
      workflow: {
        title: 'Preview workflow templates or seed workflow editor entries',
        fields: {
          action: 'Workflow action',
          templateId: 'Workflow template',
          entryMode: 'Workflow entry mode',
          definitionSource: 'Workflow definition source',
        },
        actions: {
          create: 'Create',
          edit: 'Edit',
          preview: 'Preview',
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
          previewTemplate: 'preview template',
          templateSeed: 'template seed',
          workspaceSaved: 'saved workspace definition',
        },
        templates: {
          parallelReview: 'Parallel review',
          loopGuarded: 'Loop guarded',
          conditionRoute: 'Condition route',
        },
        help: {
          sharedEntrySurface:
            'Workflow preview stays read-only while workflow create/edit normalize node, edge, condition-branch, and loop-guardrail semantics before persisting a validated workflow definition and compiled IR snapshot.',
          templateSeedSelection:
            'Use --workflow-template to choose the starter topology for workflow preview/create/edit.',
          editLoadBehavior:
            'workflow edit loads the saved workspace definition when present; passing --workflow-template reseeds the active workflow from a built-in starter topology.',
        },
        progress: {
          compileCompleted: 'Workflow topology compiled successfully.',
          compileFallback:
            'Workflow topology encountered contract errors and stayed on the summary shell.',
        },
        status: {
          compilable: 'Compiled IR preview is ready; warnings={{warningCount}}.',
          warning: 'Compiled IR preview completed with warnings={{warningCount}}.',
          contractFallback:
            'Compiled IR preview hit contract errors={{errorCount}}; showing the read-only fallback summary.',
        },
        message: {
          previewCompleted:
            'Workflow preview ready for template={{template}}; warnings={{warningCount}} errors={{errorCount}}.',
          createSaved:
            'Workflow create saved definition={{definitionPath}}; warnings={{warningCount}} errors={{errorCount}}.',
          createEntryReady:
            'Workflow create entry is ready for template={{template}}; warnings={{warningCount}} errors={{errorCount}}.',
          editSaved:
            'Workflow edit saved definition={{definitionPath}}; warnings={{warningCount}} errors={{errorCount}}.',
          editEntryReady:
            'Workflow edit entry is ready for template={{template}}; warnings={{warningCount}} errors={{errorCount}}.',
        },
        prompt: {
          reviewCompileErrors: 'Review compile errors',
          fixBeforePersist:
            'Fix loop/edge contract issues before promoting this preview into a persisted workflow definition.',
          compareAnotherTemplate: 'Compare another template',
          rerunWithActionTemplate:
            'Re-run `workflow {{action}} --workflow-template <template>` to compare a different template shape.',
          inspectSavedDefinition: 'Inspect saved workflow definition',
          inspectSavedDefinitionPath: 'Review {{path}} before the next edit pass.',
          inspectCompiledIr: 'Inspect compiled IR snapshot',
          inspectCompiledIrPath:
            'Review {{path}} to confirm the saved workflow remains compiler-acceptable.',
        },
        editorIssues: {
          conditionBranchRequired:
            'Condition nodes must expose at least one outgoing branch before persistence.',
          conditionBranchKeyRequired:
            'Each outgoing branch from a condition node must declare a non-empty condition key.',
          conditionBranchDuplicated:
            'Outgoing branches from the same condition node must use unique condition keys.',
        },
        summary: {
          definitionSource: 'Definition source: {{source}}',
          definitionPath: 'Workflow definition: {{path}}',
          compiledIrPath: 'Compiled IR snapshot: {{path}}',
          template: 'Template: {{template}}',
          processId: 'Process ID: {{processId}}',
          entryNode: 'Entry node: {{entryNodeId}}',
          graphTotals:
            'Graph totals: nodes={{nodeCount}} edges={{edgeCount}} warnings={{warningCount}} errors={{errorCount}}.',
          conditionBranches: 'Condition branches for {{nodeId}}: {{branches}}',
          noBranches: 'none',
          nodeLine:
            'IR node {{nodeId}} [{{nodeType}}] stage={{stageId}} route={{routeKey}} role={{roleProfileId}}',
          loopLimits:
            'Loop limits for {{nodeId}}: maxCycles={{maxCycles}} maxWallTimeSeconds={{maxWallTimeSeconds}}',
          edgeLine: 'Edge {{fromNodeId}} -> {{toNodeId}} condition={{conditionKey}}',
          defaultRoute: 'default',
          compileIssue: '{{severity}} {{errorCode}} at {{location}}: {{message}}',
          errorSeverity: 'error',
          warningSeverity: 'warning',
        },
      },
    },
    output: {
      pretty: {
        checkLabels: {
          planTaskPackage: 'Plan task package',
          planCommitReadiness: 'Plan commit readiness',
          planLedgerProjection: 'Plan ledger projection',
          planCommitReceipt: 'Plan commit receipt',
          upgradeSchemaDiff: 'Upgrade schema diff',
          migrationSuggestions: 'Migration suggestions',
          confirmationItems: 'Confirmation items',
          upgradeApplyReadiness: 'Upgrade apply readiness',
          upgradeApplyReceipt: 'Upgrade apply receipt',
          upgradeVerifyReceipt: 'Upgrade verify receipt',
          upgradeRollbackReceipt: 'Upgrade rollback receipt',
          rollbackReference: 'Rollback reference',
          workspaceAction: 'Workspace action',
          workspaceTarget: 'Workspace target',
          workspaceScratchCleanup: 'Workspace scratch cleanup',
          workflowTemplate: 'Workflow template',
          workflowPreviewMode: 'Workflow preview mode',
          workflowCompileStatus: 'Workflow compile status',
        },
        checkDetails: {
          planTaskPackage: '{{total}} tasks, {{create}} create, {{retain}} retain',
          planCommitReadiness: 'readiness {{readiness}}, {{missing}} missing fields',
          planLedgerProjection:
            'plan.md {{planMd}}, checklist.md {{checklistMd}}, tasks.csv {{tasksCsv}}, TK files {{tkFiles}}',
          planCommitReceipt:
            'status {{status}}, {{created}} created, {{retained}} retained, receipt {{path}}',
          upgradeSchemaDiff: '{{diffs}} diffs, {{source}} -> {{target}}',
          migrationSuggestions: '{{count}} suggestions',
          confirmationItems: 'decision {{decision}}, {{count}} items, {{blocking}} blocking',
          upgradeApplyReadiness:
            'readiness {{readiness}}, decision {{decision}}, {{count}} items, {{blocking}} blocking',
          upgradeReceipt: 'status {{status}}, receipt {{path}}',
          workspaceTarget: 'mode {{mode}}, root {{root}}',
          workspaceScratchCleanupRemoved: 'scratch root removed: {{root}}',
          workspaceScratchCleanupRetained: 'scratch root retained: {{root}}',
          workflowTemplate: 'template {{template}}',
          workflowPreviewMode: 'mode {{mode}}',
          workflowCompileStatus: 'status {{status}}, {{warnings}} warnings, {{errors}} errors',
        },
      },
    },
  },
  sessionMainCapabilities: {
    helpAppendix: {
      catalogTitle: 'Governed capability catalog:',
      capabilityTitle: 'Session.main governed capability: {{title}}',
      primaryEntry: 'Primary entry:',
      optionalAlias: 'Optional discoverability alias:',
      optionalAliasInline: '(optional alias: {{command}})',
      reservedAlias: 'Reserved discoverability alias:',
      suggestedSlashCommand: 'Suggested slash command:',
      executionMode: 'Execution path:',
      examplePromptsTitle: 'Example prompts:',
      relatedCapabilitiesTitle: 'Related capabilities:',
      entryBadges: {
        chatFirst: '[chat-first]',
      },
      primaryEntries: {
        conversationalAnswer: 'direct chat request',
        roleMention: 'role mention',
        cliCommand: 'CLI command',
        slashCommand: 'slash command {{command}}',
      },
      executionModes: {
        aiWorkflow: 'productized AI workflow',
        directExecute: 'direct execute (no extra confirmation)',
        previewConfirm: 'preview first, then confirm',
      },
    },
    catalog: {
      help: {
        title: 'Help',
        summary: 'Explain the governed commands and how to use them from session.main.',
        detail:
          'Use help when you want a capability overview or need to understand which governed action to pick next.',
        examples: {
          0: 'What can you do here?',
          1: 'Explain the difference between review and review verify.',
        },
      },
      connect: {
        title: 'Connect',
        summary: 'Prepare and apply adapter onboarding changes for this workspace.',
        detail:
          'Connect is the governed onboarding entry when you need to bind roles, surfaces, or remote credentials before execution.',
        examples: {
          0: 'Help me connect Codex and Claude Code.',
          1: 'Set up adapter onboarding for this repo.',
        },
      },
      branch_switch: {
        title: 'Branch Switch',
        summary:
          'Switch the current repository to an existing local git branch through the governed workspace flow.',
        detail:
          'Branch Switch is the governed workspace action for requests like "switch to main"; it checks that the worktree is clean, refuses silent fetch/create side effects, and then executes the branch switch directly.',
        examples: {
          0: 'Switch the current branch to main.',
          1: 'Help me checkout the release branch.',
        },
      },
      doctor: {
        title: 'Doctor',
        summary: 'Diagnose adapter health, environment readiness, and route blockers.',
        detail:
          'Doctor is the fast read-only diagnostic path when you want to inspect current workspace or adapter health.',
        examples: {
          0: 'Diagnose the current workspace.',
          1: 'Check whether my adapters are healthy.',
        },
      },
      verify: {
        title: 'Verify',
        summary: 'Verify routing, projection, and adapter readiness truth.',
        detail:
          'Verify is the governed validation path for adapter coverage, route status, and readiness before unattended execution.',
        examples: {
          0: 'Verify adapter readiness.',
          1: 'Check whether the current routing configuration is valid.',
        },
      },
      workflow: {
        title: 'Workflow',
        summary: 'Preview or enter the governed workflow definition surface.',
        detail:
          'Workflow is the governed bridge for template preview and workflow authoring entrypoints when you want to inspect or shape one saved process definition.',
        examples: {
          0: 'Show me the workflow preview.',
          1: 'Open the workflow template surface for this repo.',
        },
      },
      deliver: {
        title: 'Deliver',
        summary:
          'Coordinate the governed requirement-to-CR delivery path from requirement intake to clean review closure.',
        detail:
          'Deliver is the parent AI workflow for requirement-to-CR orchestration. It keeps requirement capture, approved durable brief gating, solution review, task decomposition, execution, and governed CR closure on one orchestration-owned path without creating a second registry.',
        examples: {
          0: 'Help me deliver this requirement through the governed path.',
          1: 'Start the requirement-to-CR delivery workflow for this repo.',
        },
      },
      plan: {
        title: 'Plan',
        summary: 'Run the productized planning workflow for the current goal.',
        detail:
          'Plan is the productized planner workflow entry for generating a structured execution plan. Use `/plan sync` when you want to project an existing task package into the sprint ledger, and use `@planner` for expert raw-role discussion.',
        examples: {
          0: 'Break this work into tasks.',
          1: 'Create an execution plan for the next sprint.',
        },
      },
      review: {
        title: 'Review',
        summary: 'Run the productized governed review workflow for the current scope.',
        detail:
          'Review is the productized AI workflow for structured code-review findings on the current scope. Use `@reviewer` only when you want open-ended expert discussion instead of the standard governed review workflow.',
        examples: {
          0: 'Review the current changes.',
          1: 'Help me do a code review on this branch.',
        },
      },
      review_verify: {
        title: 'Review Verify',
        summary:
          'Run the productized review-verification workflow for an existing review artifact or fix result.',
        detail:
          'Review verify is the fixed workflow for rechecking an existing review report or fix result and deciding whether accepted findings are actually resolved. Use `@reviewer` when you need open-ended reviewer discussion instead of the standard verification path.',
        examples: {
          0: 'Verify that the review findings are fixed.',
          1: 'Recheck the current CR report and validate the fixes.',
        },
      },
      run: {
        title: 'Run',
        summary: 'Start a reusable governed workflow or task-driven execution flow.',
        detail:
          'Run executes a reusable governed workflow or task-driven delivery flow directly after the target work is already defined. Use direct chat or `/plan` first when the implementation request is still open-ended.',
        examples: {
          0: 'Run the next reusable governed workflow for this repo.',
          1: 'Execute the task-driven delivery flow for TK-123.',
        },
      },
    },
  },
  sessionMainDispatcher: {
    deliver: {
      startedDelta: 'Started governed deliver workflow.',
      startedMessage:
        'Started the governed deliver workflow. Share the requirement or point me to an approved durable brief so I can anchor the next phase on the orchestration-owned path.',
      resumedDelta: 'Resumed governed deliver workflow.',
      resumedMessage:
        'Resumed the governed deliver workflow at phase `{{phase}}`. Continue from the current shared-session state instead of restarting from requirement capture.',
      resumedMessageWithAction:
        'Resumed the governed deliver workflow at phase `{{phase}}`. Continue with pending action `{{pendingAction}}` from the current shared-session state.',
    },
  },
  __internal: {
    availability: {
      selection: {
        preferred: 'preferred surface',
        fallbackAfterProbe: 'fallback after availability probe',
        defaultGovernedSurface: 'first ready governed surface',
        intentRouter: 'default routing preference',
      },
    },
  },
} as const;
