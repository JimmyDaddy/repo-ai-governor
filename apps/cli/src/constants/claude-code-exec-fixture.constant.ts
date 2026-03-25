/**
 * Defines internal environment keys used to inject deterministic Claude Code exec fixtures.
 */
export enum CliClaudeCodeExecFixtureEnvironmentKey {
  ENABLE_FIXTURES = "REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES",
  EXEC_FIXTURE = "REPO_AI_GOVERNOR_CLAUDE_CODE_EXEC_FIXTURE",
}

/**
 * Defines supported deterministic Claude Code exec fixture modes for gate/test paths.
 */
export enum CliClaudeCodeExecFixtureMode {
  SUCCESS = "success",
  CREDENTIAL_MISSING = "credential_missing",
}
