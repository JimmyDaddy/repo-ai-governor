export const EN_US_TRANSLATIONS = {
  cli: {
    app: {
      description: "Repository-local AI governance CLI.",
    },
    options: {
      locale: "Locale for human-readable output.",
      profile: "Config profile id applied before command execution.",
      output: "Output mode: pretty|plain|json.",
      verbosity: "Output verbosity: quiet|normal|verbose.",
      noColor: "Disable ANSI color decorations in pretty mode.",
      dryRun: "Execute run pipeline without external side-effect actions.",
      trace: "Emit layered diagnostics trace artifact for local debugging.",
      replay: "Replay diagnostics from report/replay artifact path.",
    },
    commands: {
      init: { description: "Initialize governor workspace baseline." },
      doctor: { description: "Run environment diagnostics baseline." },
      check: { description: "Run governance quality checks baseline." },
      run: { description: "Execute process runtime baseline." },
      review: { description: "Generate code review baseline output." },
      reviewVerify: { description: "Verify code review baseline output." },
      plan: { description: "Generate or update execution plan baseline." },
      upgrade: { description: "Run workspace/config upgrade baseline." },
    },
    skeleton: {
      noProfile: "none",
      executed: "Command '{{command}}' skeleton executed.",
    },
    errors: {
      unexpected: "CLI execution failed [{{code}}]: {{message}}",
    },
  },
} as const;
