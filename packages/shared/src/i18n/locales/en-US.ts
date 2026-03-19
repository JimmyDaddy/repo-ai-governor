export const EN_US_TRANSLATIONS = {
  cli: {
    app: {
      description: "Repository-local AI governance CLI.",
    },
    options: {
      locale: "Locale for human-readable output.",
      profile: "Config profile id applied before command execution.",
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
      executed:
        "Command '{{command}}' skeleton executed. locale={{locale}}, profile={{profile}}, configSource={{source}}.",
    },
    errors: {
      unexpected: "CLI execution failed [{{code}}]: {{message}}",
    },
  },
} as const;
