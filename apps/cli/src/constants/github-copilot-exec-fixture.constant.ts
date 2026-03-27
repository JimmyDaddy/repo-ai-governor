/**
 * Defines internal environment keys used to inject deterministic GitHub Copilot exec fixtures.
 */
export enum CliGithubCopilotExecFixtureEnvironmentKey {
  ENABLE_FIXTURES = 'REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES',
  EXEC_FIXTURE = 'REPO_AI_GOVERNOR_GITHUB_COPILOT_EXEC_FIXTURE',
}

/**
 * Defines supported deterministic GitHub Copilot exec fixture modes for gate/test paths.
 */
export enum CliGithubCopilotExecFixtureMode {
  SUCCESS = 'success',
  CREDENTIAL_MISSING = 'credential_missing',
}
