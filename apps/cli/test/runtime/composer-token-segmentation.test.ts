import { ReactCliComposerTokenKind } from '../../src/constants/react-cli-composer-token.constant.js';
import { segmentComposerInput } from '../../src/react-cli/views/composer-token-segmentation.js';

describe('segmentComposerInput', () => {
  it('keeps ordinary text in the plain token group', () => {
    expect(segmentComposerInput('hello governor')).toEqual([
      {
        kind: ReactCliComposerTokenKind.PLAIN,
        text: 'hello governor',
      },
    ]);
  });

  it('highlights slash commands only when slash-command mode is active', () => {
    expect(segmentComposerInput('/doctor now')).toEqual([
      {
        kind: ReactCliComposerTokenKind.PLAIN,
        text: '/doctor now',
      },
    ]);

    expect(segmentComposerInput('/doctor now', { highlightSlashCommands: true })).toEqual([
      {
        kind: ReactCliComposerTokenKind.SLASH_COMMAND,
        text: '/doctor',
      },
      {
        kind: ReactCliComposerTokenKind.PLAIN,
        text: ' now',
      },
    ]);
  });

  it('highlights role mentions without recoloring surrounding text', () => {
    expect(
      segmentComposerInput('请 @reviewer 看一下 /doctor', { highlightSlashCommands: true }),
    ).toEqual([
      {
        kind: ReactCliComposerTokenKind.PLAIN,
        text: '请 ',
      },
      {
        kind: ReactCliComposerTokenKind.ROLE_MENTION,
        text: '@reviewer',
      },
      {
        kind: ReactCliComposerTokenKind.PLAIN,
        text: ' 看一下 ',
      },
      {
        kind: ReactCliComposerTokenKind.SLASH_COMMAND,
        text: '/doctor',
      },
    ]);
  });
});
