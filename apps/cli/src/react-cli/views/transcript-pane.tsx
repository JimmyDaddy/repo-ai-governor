import { Box, Text } from 'ink';
import type React from 'react';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import type { ReactCliShellPalette } from '../../types/index.js';
import type { CliSessionShellTranscriptItem } from '../../types/index.js';

export interface ReactCliTranscriptPaneProps {
  title: string;
  items: CliSessionShellTranscriptItem[];
  shellPalette: ReactCliShellPalette;
}

/**
 * Renders the session-shell transcript pane from presenter-owned transcript items.
 */
export function ReactCliTranscriptPane({
  title,
  items,
  shellPalette,
}: ReactCliTranscriptPaneProps): React.JSX.Element {
  return (
    <Box flexDirection='column' marginTop={1}>
      <Text color={shellPalette.helpColor} dimColor>
        {title}
      </Text>
      {items.map((item) => (
        <Box key={item.id} flexDirection='column' marginTop={1} paddingLeft={1}>
          <ReactCliTranscriptItemRenderer item={item} shellPalette={shellPalette} />
        </Box>
      ))}
    </Box>
  );
}

interface ReactCliTranscriptItemRendererProps {
  item: CliSessionShellTranscriptItem;
  shellPalette: ReactCliShellPalette;
}

function ReactCliTranscriptItemRenderer({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  switch (item.renderKind) {
    case 'markdown':
      return <ReactCliMarkdownTranscriptItem item={item} shellPalette={shellPalette} />;
    case 'system_notice':
      return <ReactCliSystemNoticeTranscriptItem item={item} shellPalette={shellPalette} />;
    case 'command_recap':
      return <ReactCliCommandRecapTranscriptItem item={item} shellPalette={shellPalette} />;
    default:
      return <ReactCliPlainTranscriptItem item={item} shellPalette={shellPalette} />;
  }
}

function ReactCliPlainTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  return (
    <>
      <Text bold color={resolveTranscriptColor(item.role, shellPalette)}>
        {item.label}
      </Text>
      {item.lines.map((line, index) => (
        <Text key={`${item.id}:plain:${index}`} color={shellPalette.sectionTitleColor}>
          {line}
        </Text>
      ))}
    </>
  );
}

function ReactCliSystemNoticeTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  return (
    <>
      <Text bold color={shellPalette.attentionColor}>
        {item.label}
      </Text>
      {item.lines.map((line, index) => (
        <Text
          key={`${item.id}:notice:${index}`}
          color={index === 0 ? shellPalette.attentionColor : shellPalette.helpColor}
        >
          {index === 0 ? `! ${line}` : `  ${line}`}
        </Text>
      ))}
    </>
  );
}

function ReactCliCommandRecapTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  return (
    <>
      <Text bold color={shellPalette.titleColor}>
        {item.label}
      </Text>
      {item.lines.map((line, index) => (
        <Text
          key={`${item.id}:recap:${index}`}
          color={resolveRecapLineColor(line, shellPalette)}
          bold={index === 0}
        >
          {index === 0 ? line : `- ${line}`}
        </Text>
      ))}
      {item.backlinks && item.backlinks.length > 0 ? (
        <Box flexDirection='column' marginTop={1}>
          {item.backlinks.map((backlink, index) => (
            <Text key={`${item.id}:backlink:${index}`} color={shellPalette.helpColor}>
              {`- ${backlink.kind}: ${backlink.label} -> ${backlink.target}`}
            </Text>
          ))}
        </Box>
      ) : null}
    </>
  );
}

function ReactCliMarkdownTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  const blocks = parseMarkdownBlocks(item.markdownSource ?? item.lines.join('\n'));

  return (
    <>
      <Text bold color={resolveTranscriptColor(item.role, shellPalette)}>
        {item.label}
      </Text>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={`${item.id}:heading:${index}`} bold color={shellPalette.titleColor}>
              {block.text}
            </Text>
          );
        }
        if (block.type === 'paragraph') {
          return (
            <Text key={`${item.id}:paragraph:${index}`} color={shellPalette.sectionTitleColor}>
              {block.text}
            </Text>
          );
        }
        if (block.type === 'list_item') {
          return (
            <Text key={`${item.id}:list:${index}`} color={shellPalette.sectionTitleColor}>
              {`${block.marker} ${block.text}`}
            </Text>
          );
        }
        if (block.type === 'quote') {
          return (
            <Text key={`${item.id}:quote:${index}`} color={shellPalette.subtitleColor}>
              {`> ${block.text}`}
            </Text>
          );
        }
        return (
          <Box key={`${item.id}:code:${index}`} flexDirection='column'>
            {block.lines.map((line, lineIndex) => (
              <Text
                key={`${item.id}:code:${index}:${lineIndex}`}
                color={shellPalette.promptTitleColor}
              >
                {`| ${line}`}
              </Text>
            ))}
          </Box>
        );
      })}
    </>
  );
}

type MarkdownBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list_item'; marker: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'code_block'; lines: string[] };

function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const lines = source.split(/\r?\n/u);
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  let codeBlockLines: string[] | null = null;

  const flushParagraph = (): void => {
    if (paragraphLines.length === 0) {
      return;
    }
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ').trim(),
    });
    paragraphLines.splice(0, paragraphLines.length);
  };

  const flushCodeBlock = (): void => {
    if (!codeBlockLines || codeBlockLines.length === 0) {
      codeBlockLines = null;
      return;
    }
    blocks.push({
      type: 'code_block',
      lines: [...codeBlockLines],
    });
    codeBlockLines = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith('```')) {
      flushParagraph();
      if (codeBlockLines) {
        flushCodeBlock();
      } else {
        codeBlockLines = [];
      }
      continue;
    }

    if (codeBlockLines) {
      codeBlockLines.push(rawLine);
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/u.exec(line);
    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const listMatch = /^([-*]|\d+\.)\s+(.+)$/u.exec(line);
    if (listMatch) {
      flushParagraph();
      blocks.push({
        type: 'list_item',
        marker: listMatch[1],
        text: listMatch[2].trim(),
      });
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/u.exec(line);
    if (quoteMatch) {
      flushParagraph();
      blocks.push({
        type: 'quote',
        text: quoteMatch[1].trim(),
      });
      continue;
    }

    paragraphLines.push(line.trim());
  }

  flushParagraph();
  flushCodeBlock();
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', text: source }];
}

function resolveRecapLineColor(line: string, shellPalette: ReactCliShellPalette): string {
  if (line.startsWith('Routing:')) {
    return shellPalette.subtitleColor;
  }
  if (line.startsWith('Intent:') || line.startsWith('Preview:')) {
    return shellPalette.footerColor;
  }
  return shellPalette.sectionTitleColor;
}

function resolveTranscriptColor(
  role: CliSessionTranscriptRole,
  shellPalette: ReactCliShellPalette,
): string {
  switch (role) {
    case CliSessionTranscriptRole.SYSTEM:
      return shellPalette.attentionColor;
    case CliSessionTranscriptRole.USER:
      return shellPalette.footerColor;
    case CliSessionTranscriptRole.SLASH_COMMAND:
      return shellPalette.promptTitleColor;
    default:
      return shellPalette.titleColor;
  }
}
