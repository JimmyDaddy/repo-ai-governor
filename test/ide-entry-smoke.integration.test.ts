import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { runCli } from '../apps/cli/src/main.js';

const VSCODE_TASK_SAMPLE_PATH = resolve(
  process.cwd(),
  'integrations/ide/examples/vscode-task.sample.json',
);
const CURSOR_TASK_SAMPLE_PATH = resolve(
  process.cwd(),
  'integrations/ide/examples/cursor-task.sample.json',
);
const JETBRAINS_RUN_CONFIGURATION_SAMPLE_PATH = resolve(
  process.cwd(),
  'integrations/ide/examples/jetbrains-run-configuration.sample.xml',
);
const CLAUDE_CODE_COMMANDS_SAMPLE_PATH = resolve(
  process.cwd(),
  'integrations/ide/examples/claude-code-commands.sample.json',
);
const REQUIRED_COMMAND_SEQUENCE = ['init', 'doctor', 'check'] as const;
const EXPECTED_OPERATION_BY_COMMAND = {
  init: 'workspace_init',
  doctor: 'env_doctor',
  check: 'governance_check',
} as const;

/**
 * Creates buffered IO adapters for integration tests.
 * @param currentWorkingDirectory Command cwd used by runtime.
 * @returns Buffered stdout/stderr adapters.
 */
function createBufferedIo(currentWorkingDirectory: string): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
    isStdoutTty: () => boolean;
    env: () => NodeJS.ProcessEnv;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];
  const environment: NodeJS.ProcessEnv = { ...process.env };

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string) => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string) => {
        stderrBuffer.push(value);
      },
      cwd: () => currentWorkingDirectory,
      isStdoutTty: () => false,
      env: () => environment,
    },
  };
}

/**
 * Normalizes template label into command name.
 * @param label Raw template label.
 * @returns {string}
 */
function normalizeCommandLabel(label: string): string {
  return label.replace('repo-ai-governor:', '').trim();
}

/**
 * Writes one minimal repo-local governor config used by IDE smoke tests.
 * @param workspaceRoot Temporary workspace root.
 */
async function writeRepoLocalGovernorConfig(workspaceRoot: string): Promise<void> {
  await mkdir(resolve(workspaceRoot, '.repo-ai-governor'), { recursive: true });
  await writeFile(
    resolve(workspaceRoot, '.repo-ai-governor', 'governor.yaml'),
    [
      'schemaVersion: "1.1"',
      'workspace:',
      '  mode: repo_local',
      '  migrationPolicy: copy_verify_switch_rollback',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: zh-CN',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - zh-CN',
      '    - en-US',
      '',
    ].join('\n'),
    'utf8',
  );
}

/**
 * Parses task-style sample into command argv/env definitions.
 * @param rawJson Raw sample JSON text.
 * @returns {Map<string, {argv: string[]; env: Record<string, string>}>}
 */
function parseTaskTemplate(
  rawJson: string,
): Map<string, { argv: string[]; env: Record<string, string> }> {
  const template = JSON.parse(rawJson) as {
    tasks: Array<{
      label: string;
      command: string;
      args: string[];
      options: { env: Record<string, string> };
    }>;
  };

  const definitions = new Map<string, { argv: string[]; env: Record<string, string> }>();
  for (const task of template.tasks) {
    const commandName = normalizeCommandLabel(task.label);
    definitions.set(commandName, {
      argv: [task.command, ...task.args],
      env: task.options.env,
    });
  }

  return definitions;
}

/**
 * Parses JetBrains shell run configuration sample into command argv/env definitions.
 * @param xmlText Raw XML text.
 * @returns {Map<string, {argv: string[]; env: Record<string, string>}>}
 */
function parseJetBrainsRunConfigurations(
  xmlText: string,
): Map<string, { argv: string[]; env: Record<string, string> }> {
  const configurationPattern =
    /<configuration name="([^"]+)" type="ShConfigurationType">([\s\S]*?)<\/configuration>/gmu;
  const definitions = new Map<string, { argv: string[]; env: Record<string, string> }>();
  let matchedConfiguration = configurationPattern.exec(xmlText);
  while (matchedConfiguration) {
    const configurationName = matchedConfiguration[1]?.trim() ?? '';
    const configurationBody = matchedConfiguration[2] ?? '';
    const commandName = normalizeCommandLabel(configurationName);
    const scriptMatch = configurationBody.match(/<option name="SCRIPT_TEXT" value="([^"]+)" \/>/u);
    if (!scriptMatch) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Missing SCRIPT_TEXT for ${configurationName}`,
      );
    }

    const env: Record<string, string> = {};
    const envPattern = /<env name="([^"]+)" value="([^"]*)" \/>/gmu;
    let matchedEnv = envPattern.exec(configurationBody);
    while (matchedEnv) {
      env[matchedEnv[1]] = matchedEnv[2];
      matchedEnv = envPattern.exec(configurationBody);
    }

    const tokens = scriptMatch[1].trim().split(/\s+/u);
    definitions.set(commandName, {
      argv: tokens,
      env,
    });

    matchedConfiguration = configurationPattern.exec(xmlText);
  }

  return definitions;
}

/**
 * Parses Claude Code command manifest into command argv/env definitions.
 * @param rawJson Raw sample JSON text.
 * @returns {{surface: string; definitions: Map<string, {argv: string[]; env: Record<string, string>}>}}
 */
function parseClaudeCodeCommands(rawJson: string): {
  surface: string;
  definitions: Map<string, { argv: string[]; env: Record<string, string> }>;
} {
  const template = JSON.parse(rawJson) as {
    surface: string;
    commands: Array<{
      label: string;
      command: string;
      args: string[];
      env: Record<string, string>;
    }>;
  };

  const definitions = new Map<string, { argv: string[]; env: Record<string, string> }>();
  for (const command of template.commands) {
    const commandName = normalizeCommandLabel(command.label);
    definitions.set(commandName, {
      argv: [command.command, ...command.args],
      env: command.env,
    });
  }

  return {
    surface: template.surface,
    definitions,
  };
}

/**
 * Executes one official IDE command chain against runCli.
 * @param workspaceRoot Temporary workspace root.
 * @param surface Expected surface id.
 * @param definitions Definitions keyed by command name.
 */
async function executeOfficialIdeChain(
  workspaceRoot: string,
  surface: string,
  definitions: Map<string, { argv: string[]; env: Record<string, string> }>,
): Promise<void> {
  await writeRepoLocalGovernorConfig(workspaceRoot);

  for (const commandName of REQUIRED_COMMAND_SEQUENCE) {
    const definition = definitions.get(commandName);
    expect(definition).toBeDefined();
    expect(definition?.env.REPO_AI_GOVERNOR_ENTRY_SURFACE).toBe(surface);

    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(workspaceRoot);
    Object.assign(io.env(), definition?.env ?? {});
    const exitCode = await runCli(definition?.argv ?? [], io);
    const payload = JSON.parse(stdoutBuffer.join(''));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(payload.command_result.operation).toBe(EXPECTED_OPERATION_BY_COMMAND[commandName]);
    expect(payload.diagnostics.entrySurface).toBe(surface);
    expect(payload.diagnostics.standardsProfileId).toBe(
      definition?.env.REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID,
    );
    expect(payload.diagnostics.standardsSourceIds).toEqual(
      definition?.env.REPO_AI_GOVERNOR_STANDARDS_SOURCES.split(','),
    );
  }
}

describe('IDE entry template smoke integration', () => {
  it('executes the VS Code init -> doctor -> check chain against runCli', async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-vscode-ide-'));
    const taskDefinitions = parseTaskTemplate(await readFile(VSCODE_TASK_SAMPLE_PATH, 'utf8'));

    try {
      await executeOfficialIdeChain(workspaceRoot, 'vscode', taskDefinitions);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('executes the JetBrains init -> doctor -> check chain against runCli', async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-jetbrains-ide-'));
    const configurationDefinitions = parseJetBrainsRunConfigurations(
      await readFile(JETBRAINS_RUN_CONFIGURATION_SAMPLE_PATH, 'utf8'),
    );

    try {
      await executeOfficialIdeChain(workspaceRoot, 'jetbrains', configurationDefinitions);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('executes the Cursor init -> doctor -> check chain against runCli', async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-cursor-ide-'));
    const taskDefinitions = parseTaskTemplate(await readFile(CURSOR_TASK_SAMPLE_PATH, 'utf8'));

    try {
      await executeOfficialIdeChain(workspaceRoot, 'cursor', taskDefinitions);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('executes the Claude Code init -> doctor -> check chain against runCli', async () => {
    const workspaceRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-claude-code-ide-'));
    const { surface, definitions } = parseClaudeCodeCommands(
      await readFile(CLAUDE_CODE_COMMANDS_SAMPLE_PATH, 'utf8'),
    );

    try {
      expect(surface).toBe('claude_code');
      await executeOfficialIdeChain(workspaceRoot, 'claude_code', definitions);
    } finally {
      await rm(workspaceRoot, { recursive: true, force: true });
    }
  });
});
