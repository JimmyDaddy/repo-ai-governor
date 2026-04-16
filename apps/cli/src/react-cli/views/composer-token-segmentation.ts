import { ReactCliComposerTokenKind } from '../../constants/react-cli-composer-token.constant.js';

const COMPOSER_WHITESPACE_PATTERN = /\s/u;

/**
 * Segments composer text into plain, slash-command, and role-mention runs for themed rendering.
 * @param value Raw composer text.
 * @param options Optional token-highlighting flags owned by the active input mode.
 * @returns Ordered themed text runs with whitespace preserved.
 */
export function segmentComposerInput(
  value: string,
  options?: {
    highlightSlashCommands?: boolean;
  },
): Array<{ kind: ReactCliComposerTokenKind; text: string }> {
  const highlightSlashCommands = options?.highlightSlashCommands ?? false;
  const characters = Array.from(value);
  const segments: Array<{ kind: ReactCliComposerTokenKind; text: string }> = [];
  let currentIndex = 0;

  while (currentIndex < characters.length) {
    const segmentEnd = resolveComposerSegmentEnd(characters, currentIndex);
    const segmentText = characters.slice(currentIndex, segmentEnd).join('');

    appendComposerSegment(
      segments,
      segmentText,
      resolveComposerTokenKind(segmentText, highlightSlashCommands),
    );

    currentIndex = segmentEnd;
  }

  return segments;
}

function resolveComposerSegmentEnd(characters: string[], startIndex: number): number {
  const whitespaceSegment = isComposerWhitespace(characters[startIndex] ?? '');
  let currentIndex = startIndex + 1;

  while (currentIndex < characters.length) {
    const currentCharacter = characters[currentIndex] ?? '';
    if (isComposerWhitespace(currentCharacter) !== whitespaceSegment) {
      break;
    }
    currentIndex += 1;
  }

  return currentIndex;
}

function resolveComposerTokenKind(
  value: string,
  highlightSlashCommands: boolean,
): ReactCliComposerTokenKind {
  if (highlightSlashCommands && value.startsWith('/')) {
    return ReactCliComposerTokenKind.SLASH_COMMAND;
  }

  if (value.startsWith('@')) {
    return ReactCliComposerTokenKind.ROLE_MENTION;
  }

  return ReactCliComposerTokenKind.PLAIN;
}

function appendComposerSegment(
  segments: Array<{ kind: ReactCliComposerTokenKind; text: string }>,
  text: string,
  kind: ReactCliComposerTokenKind,
): void {
  if (text.length === 0) {
    return;
  }

  const previousSegment = segments.at(-1);
  if (previousSegment?.kind === kind) {
    previousSegment.text += text;
    return;
  }

  segments.push({ kind, text });
}

function isComposerWhitespace(value: string): boolean {
  return COMPOSER_WHITESPACE_PATTERN.test(value);
}
