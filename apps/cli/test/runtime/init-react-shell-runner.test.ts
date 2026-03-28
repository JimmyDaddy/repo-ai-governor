import {
  DEFAULT_I18N_FALLBACK_LOCALE,
  DEFAULT_I18N_LOCALE,
  ErrorOutputEnvironment,
  Locale,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliInitReactShellRunner } from '../../src/runtime/interactive-shell/init-react-shell-runner.js';
import { CliInteractiveShellStderrRenderer } from '../../src/runtime/interactive-shell/interactive-shell-stderr-renderer.js';
import type { CliInteractiveShellPromptAdapter } from '../../src/types/index.js';

function createPromptAdapter(answers: string[]): CliInteractiveShellPromptAdapter {
  let answerIndex = 0;

  return {
    async question(): Promise<string> {
      const answer = answers[answerIndex];
      answerIndex += 1;
      return answer ?? '';
    },
    close(): void {
      return;
    },
  };
}

describe('CliInitReactShellRunner', () => {
  it('collects workspace mode, locale, confirmation, and renders only to stderr', async () => {
    const stderrBuffer: string[] = [];
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['2', '2', 'y']),
    );

    const selection = await runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      localizeText: (english) => english,
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('[react-shell:init]');
    expect(stderrBuffer.join('')).toContain('unmounted state=success');
  });

  it('surfaces validation feedback before accepting corrected answers', async () => {
    const stderrBuffer: string[] = [];
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['9', '1', 'bogus', '2', '']),
    );

    const selection = await runner.run({
      locale: Locale.ZH_CN,
      outputMode: ErrorOutputEnvironment.PRETTY,
      localizeText: (_english, chinese) => chinese,
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.TOOL_MANAGED,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('validation=');
    expect(stderrBuffer.join('')).toContain('ui=react');
  });

  it('restarts the wizard from step 1 when confirmation is rejected', async () => {
    const stderrBuffer: string[] = [];
    const runner = new CliInitReactShellRunner(
      undefined,
      new CliInteractiveShellStderrRenderer((value) => {
        stderrBuffer.push(value);
      }),
      () => createPromptAdapter(['1', '1', 'n', '2', '2', 'y']),
    );

    const selection = await runner.run({
      locale: Locale.EN_US,
      outputMode: ErrorOutputEnvironment.PRETTY,
      localizeText: (english) => english,
    });

    expect(selection).toEqual({
      workspaceMode: WorkspaceMode.REPO_LOCAL,
      defaultLocale: DEFAULT_I18N_FALLBACK_LOCALE,
      fallbackLocale: DEFAULT_I18N_LOCALE,
    });
    expect(stderrBuffer.join('')).toContain('Selection updated; returning to the first step.');
    expect(stderrBuffer.join('')).toContain('Step 1 of 3: Workspace mode');
  });
});
