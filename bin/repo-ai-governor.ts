#!/usr/bin/env node

const HELP_TEXT = [
  "repo-ai-governor",
  "",
  "Usage:",
  "  repo-ai-governor --help",
  "",
  "Status:",
  "  CLI bootstrap is initialized. Functional subcommands are added by sprint tasks.",
].join("\n");

/**
 * Prints CLI help text to stdout.
 * @returns Process exit code for help execution.
 */
function printHelp(): number {
  process.stdout.write(`${HELP_TEXT}\n`);
  return 0;
}

/**
 * Runs the minimal CLI bootstrap.
 * @param argv Raw process argument vector from Node runtime.
 * @returns Process exit code after handling supported flags.
 */
function run(argv: string[]): number {
  const args = argv.slice(2);
  const isHelpRequested = args.length === 0 || args.includes("--help") || args.includes("-h");

  if (isHelpRequested) {
    return printHelp();
  }

  process.stderr.write(`Unsupported arguments: ${args.join(" ")}\n`);
  process.stderr.write("Run `repo-ai-governor --help` for usage.\n");
  return 1;
}

process.exitCode = run(process.argv);
