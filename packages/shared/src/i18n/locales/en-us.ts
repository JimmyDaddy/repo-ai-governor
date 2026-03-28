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
