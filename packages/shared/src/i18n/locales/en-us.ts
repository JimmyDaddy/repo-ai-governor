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
      workspaceAction: 'Workspace command action: dry-run|execute|rollback|clear-config.',
      workspaceMode:
        'Workspace target mode for migration planning/execution: repo_local|tool_managed.',
      workspaceRoot: 'Workspace target root override used by the workspace migration command.',
      workspacePlan: 'Workspace migration plan artifact path used by the rollback action.',
      workflowTemplate:
        'Workflow template id used by the workflow create/edit/preview subcommands.',
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
      workspace: {
        description:
          'Plan, execute, roll back workspace migration baseline, or clear the current workspace config.',
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
            'Upgrade remains analyze-only; the React shell previews report, migrated-config, and rollback references without mutating governor.yaml.',
          rollbackReference:
            'Keep the rollback snapshot so the analyzed config can be reverted explicitly if you later apply the migration.',
        },
        status: {
          manualConfirmation:
            'Manual confirmation remains required before applying {{count}} blocking upgrade change(s).',
          analysisReady: 'Upgrade analysis is ready for targetVersion={{targetVersion}}.',
        },
        summary: {
          reportPath: 'Upgrade report: {{path}}',
          autoMigratedConfigPath: 'Auto-migrated config: {{path}}',
          rollbackSnapshotPath: 'Rollback snapshot: {{path}}',
          counts:
            'Suggestions={{suggestions}} confirmations={{confirmations}} blocking={{blocking}}.',
        },
      },
      workspace: {
        clearConfigTitle: 'Clear current workspace config',
        title: 'Plan or execute workspace migration',
        fields: {
          action: 'Workspace action',
          targetMode: 'Target workspace mode',
          targetRoot: 'Target workspace root',
          planPath: 'Rollback plan path',
          currentMode: 'Current workspace mode',
          currentRoot: 'Current workspace root',
          activeConfigPaths: 'Active config paths',
        },
        actions: {
          dryRun: 'Dry run',
          execute: 'Execute',
          rollback: 'Rollback',
          clearConfig: 'Clear config',
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
        },
        status: {
          executionCompleted: 'Workspace migration execution completed.',
          rollbackCompleted: 'Workspace rollback completed.',
          dryRunCompleted: 'Workspace migration dry-run completed.',
          clearConfigCompleted: 'Current workspace config cleared.',
          clearConfigNoop: 'No current workspace config was present to clear.',
        },
        message: {
          executeCompleted: 'Workspace migration executed successfully; plan={{planPath}}.',
          rollbackCompleted: 'Workspace rollback completed; rollback={{rollbackPath}}.',
          dryRunCompleted: 'Workspace migration plan generated; plan={{planPath}}.',
          clearConfigCompleted: 'Cleared {{count}} workspace config file(s): {{paths}}.',
          clearConfigNoop: 'No current workspace config file was found. Inspected: {{paths}}.',
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
        },
        summary: {
          migrationId: 'Migration ID: {{migrationId}}',
          primaryArtifact: 'Primary artifact: {{path}}',
          inspectedConfigPaths: 'Inspected config paths: {{paths}}',
          clearedConfigPath: 'Cleared config path: {{path}}',
          noConfigRemoved: 'No config paths were removed.',
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
          upgradeSchemaDiff: 'Upgrade schema diff',
          migrationSuggestions: 'Migration suggestions',
          confirmationItems: 'Confirmation items',
          rollbackReference: 'Rollback reference',
          workspaceAction: 'Workspace action',
          workspaceTarget: 'Workspace target',
          workspaceScratchCleanup: 'Workspace scratch cleanup',
          workflowTemplate: 'Workflow template',
          workflowPreviewMode: 'Workflow preview mode',
          workflowCompileStatus: 'Workflow compile status',
        },
        checkDetails: {
          upgradeSchemaDiff: '{{diffs}} diffs, {{source}} -> {{target}}',
          migrationSuggestions: '{{count}} suggestions',
          confirmationItems: 'decision {{decision}}, {{count}} items, {{blocking}} blocking',
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
} as const;
