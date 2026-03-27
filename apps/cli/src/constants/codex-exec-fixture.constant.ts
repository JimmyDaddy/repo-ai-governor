/**
 * Defines internal environment keys used to inject deterministic Codex exec fixtures.
 */
export enum CliCodexExecFixtureEnvironmentKey {
  ENABLE_FIXTURES = 'REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES',
  EXEC_FIXTURE = 'REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE',
}

/**
 * Defines supported deterministic Codex exec fixture modes for gate/test paths.
 */
export enum CliCodexExecFixtureMode {
  SUCCESS = 'success',
  CREDENTIAL_MISSING = 'credential_missing',
}
