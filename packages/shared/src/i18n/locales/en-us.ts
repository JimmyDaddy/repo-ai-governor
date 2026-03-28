export const EN_US_TRANSLATIONS = {
  cli: {
    app: {
      description: 'Repository-local AI governance CLI.',
    },
    options: {
      locale: 'Locale for human-readable output.',
      profile: 'Config profile id applied before command execution.',
      output: 'Output mode: pretty|plain|json.',
      ui: 'Interactive UI mode: none|classic|react|tui.',
      verbosity: 'Output verbosity: quiet|normal|verbose.',
      compact: 'Compact pretty output for human-first quick scanning.',
      noColor: 'Disable ANSI color decorations in pretty mode.',
      adapters: 'Enable adapter diagnostics and routing verification scope.',
      fix: 'Apply safe_local fixes (directories/config templates/writable checks) only.',
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
      workspaceAction: 'Workspace command action: dry-run|execute|rollback.',
      workspaceMode:
        'Workspace target mode for migration planning/execution: repo_local|tool_managed.',
      workspaceRoot: 'Workspace target root override used by the workspace migration command.',
      workspacePlan: 'Workspace migration plan artifact path used by the rollback action.',
    },
    commands: {
      init: { description: 'Initialize governor workspace baseline.' },
      connect: { description: 'Generate adapter onboarding diagnostics baseline.' },
      doctor: { description: 'Run environment diagnostics baseline.' },
      check: { description: 'Run governance quality checks baseline.' },
      run: { description: 'Execute process runtime baseline.' },
      review: { description: 'Generate code review baseline output.' },
      reviewVerify: { description: 'Verify code review baseline output.' },
      verify: { description: 'Verify adapter routing pass/warn/fail baseline.' },
      plan: { description: 'Generate or update execution plan baseline.' },
      upgrade: { description: 'Run workspace/config upgrade baseline.' },
      workspace: { description: 'Plan, execute, or roll back workspace migration baseline.' },
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
      installMissingCommands: 'Install missing local commands before connect/verify: {{commands}}.',
      probeFailedCommands:
        'Some commands exist but probe failed ({{commands}}). Run them manually to verify login/extension status.',
      authenticateAdapters:
        'Authenticate or refresh login for remote adapters before connect/verify: {{credentials}}.',
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
      workspaceModeValidation: 'Workspace mode must be 1, 2, tool_managed, or repo_local.',
      defaultLocaleTitle: 'Step 2 of 3: Default locale',
      defaultLocaleDescription: 'Choose the default locale used for human-readable CLI copy.',
      defaultLocalePromptLabel: 'Default locale [1=zh-CN, 2=en-US] (default: 1): ',
      defaultLocaleValidation: 'Default locale must be 1, 2, zh-CN, or en-US.',
      submittingDescriptor: 'Submitting descriptor values to config template bridge.',
      cancelledBySigint: 'Interactive shell cancelled by SIGINT.',
      failedBeforeApply: 'Interactive shell failed before bootstrap values were applied.',
      correctWorkspaceMode: 'Please correct the invalid workspace mode value and try again.',
      correctLocale: 'Please correct the invalid locale value and try again.',
    },
    commandMessages: {
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
      upgrade: {
        inspectReport:
          'Inspect {{reportPath}} and compare it with {{autoMigratedConfigPath}} before applying any config change.',
        confirmItems: 'Confirm every listed confirmation item before replacing governor.yaml.',
        keepRollback:
          'Keep {{rollbackSnapshotPath}} as the rollback source if you later write the migrated config back.',
        artifactsGenerated: 'Upgrade analysis artifacts were generated.',
        manualConfirmationRequired:
          'Manual confirmation is required before applying upgrade changes.',
        noManualConfirmation: 'No manual confirmation is required for the analyzed upgrade path.',
        reviewUpgradeArtifacts: 'Review upgrade artifacts',
        confirmUpgradeChanges: 'Confirm upgrade changes',
        retainRollbackSnapshot: 'Retain rollback snapshot',
      },
      init: {
        selectWorkspaceMode: 'Select workspace mode [1=tool_managed, 2=repo_local] (default: 1): ',
        selectDefaultLocale: 'Select default locale [1=zh-CN, 2=en-US] (default: 1): ',
        interactiveApplied:
          '\nInteractive setup applied: workspace={{workspaceMode}}, defaultLocale={{defaultLocale}}.\n',
        reactShellFallbackToClassic:
          'React shell initialization failed; falling back to classic bootstrap. reason={{reason}}.',
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
        enabled: 'enabled',
        disabled: 'disabled',
        notSet: 'not set',
        shortcuts: 'Shortcuts',
        session: 'Session',
        details: 'Details',
        lifecycle: 'Lifecycle',
        validationFeedbackRequiresAnotherInputPass:
          'Validation feedback requires another input pass.',
        rendersOnStderrOnly: 'React shell renders on stderr only.',
        enterConfirm: 'Enter confirm',
        restart: 'N restart',
        submit: 'Enter submit',
        cancel: 'Ctrl+C cancel',
        unmountedState: 'unmounted state={{state}} fallback={{fallback}}',
      },
      footer: {
        stdoutSummaryFollows: 'stdout summary follows',
        uiNoneDisablesShell: '--ui none disables shell',
        workspaceRollbackRestoresPriorState: '--workspace-action rollback restores prior state',
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
      workspace: {
        title: 'Plan or execute workspace migration',
        fields: {
          action: 'Workspace action',
          targetMode: 'Target workspace mode',
          targetRoot: 'Target workspace root',
          planPath: 'Rollback plan path',
        },
        actions: {
          dryRun: 'Dry run',
          execute: 'Execute',
          rollback: 'Rollback',
        },
        help: {
          stableOutputContract:
            'Workspace keeps the machine-readable output contract stable while previewing migration intent in the shared React shell.',
          persistPlan:
            'Persist the generated plan artifact so rollback can restore the previous selector state when needed.',
        },
        status: {
          executionCompleted: 'Workspace migration execution completed.',
          rollbackCompleted: 'Workspace rollback completed.',
          dryRunCompleted: 'Workspace migration dry-run completed.',
        },
        message: {
          executeCompleted: 'Workspace migration executed successfully; plan={{planPath}}.',
          rollbackCompleted: 'Workspace rollback completed; rollback={{rollbackPath}}.',
          dryRunCompleted: 'Workspace migration plan generated; plan={{planPath}}.',
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
        },
        summary: {
          migrationId: 'Migration ID: {{migrationId}}',
          primaryArtifact: 'Primary artifact: {{path}}',
        },
      },
    },
    output: {
      pretty: {
        checkLabels: {
          upgradeSchemaDiff: 'Upgrade schema diff',
          migrationSuggestions: 'Migration suggestions',
          confirmationItems: 'Confirmation items',
          rollbackReference: 'Rollback reference',
          workspaceAction: 'Workspace action',
          workspaceTarget: 'Workspace target',
          workspaceScratchCleanup: 'Workspace scratch cleanup',
        },
        checkDetails: {
          upgradeSchemaDiff: '{{diffs}} diffs, {{source}} -> {{target}}',
          migrationSuggestions: '{{count}} suggestions',
          confirmationItems: 'decision {{decision}}, {{count}} items, {{blocking}} blocking',
          workspaceTarget: 'mode {{mode}}, root {{root}}',
          workspaceScratchCleanupRemoved: 'scratch root removed: {{root}}',
          workspaceScratchCleanupRetained: 'scratch root retained: {{root}}',
        },
      },
    },
  },
} as const;
