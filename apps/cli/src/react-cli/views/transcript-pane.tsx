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
    case 'collaboration_recap':
      return <ReactCliCollaborationRecapTranscriptItem item={item} shellPalette={shellPalette} />;
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
  const recap = parseStructuredRecap(item.lines);
  const backlinks = item.backlinks ?? [];
  const hasRelatedLinks = backlinks.length > 0;

  return (
    <Box flexDirection='column' marginTop={1}>
      <Box
        flexDirection='column'
        borderStyle='round'
        borderColor={shellPalette.promptTitleColor}
        paddingX={1}
      >
        <Box flexDirection='column'>
          <Text bold color={shellPalette.titleColor}>
            {item.label}
          </Text>
          <Text color={shellPalette.helpColor} dimColor>
            command recap
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={shellPalette.borderColor} dimColor>
            {'─'.repeat(18)}
          </Text>
        </Box>
        <Text bold color={shellPalette.sectionTitleColor}>
          {recap.headline}
        </Text>
        {recap.sections.map((section, index) => (
          <Box
            key={`${item.id}:section:${index}`}
            flexDirection='column'
            marginTop={1}
            paddingLeft={1}
          >
            {'label' in section ? (
              <Text bold color={resolveRecapSectionLabelColor(section.kind, shellPalette)}>
                {formatRecapSectionLabel(section.label)}
              </Text>
            ) : null}
            {'values' in section ? (
              section.values.map((value, valueIndex) => (
                <Text
                  key={`${item.id}:section:${index}:value:${valueIndex}`}
                  color={resolveRecapSectionValueColor(section.kind, shellPalette)}
                >
                  {section.kind === 'artifact' || section.values.length > 1
                    ? `- ${formatRecapValue(value)}`
                    : formatRecapValue(value)}
                </Text>
              ))
            ) : (
              <Text color={resolveRecapLineColor(section.line, shellPalette)}>
                {`- ${formatRecapValue(section.line)}`}
              </Text>
            )}
          </Box>
        ))}
        {hasRelatedLinks ? (
          <Box flexDirection='column' marginTop={1} paddingLeft={1}>
            <Text bold color={shellPalette.helpColor}>
              Related
            </Text>
            {backlinks.map((backlink, index) => (
              <Text key={`${item.id}:backlink:${index}`} color={shellPalette.helpColor}>
                {`- ${backlink.label} -> ${backlink.target}`}
              </Text>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function ReactCliCollaborationRecapTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  const recap = parseStructuredRecap(item.lines);
  const responseBlocks = parseMarkdownBlocks(item.markdownSource ?? item.lines.join('\n'));

  return (
    <Box flexDirection='column' marginTop={1}>
      <Box
        flexDirection='column'
        borderStyle='round'
        borderColor={shellPalette.subtitleColor}
        paddingX={1}
      >
        <Box flexDirection='column'>
          <Text bold color={shellPalette.titleColor}>
            {item.label}
          </Text>
          <Text color={shellPalette.helpColor} dimColor>
            role collaboration
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={shellPalette.borderColor} dimColor>
            {'═'.repeat(18)}
          </Text>
        </Box>
        <Text bold color={shellPalette.sectionTitleColor}>
          {recap.headline}
        </Text>
        {recap.sections.map((section, index) => (
          <Box
            key={`${item.id}:collaboration:section:${index}`}
            flexDirection='column'
            marginTop={1}
            paddingLeft={1}
          >
            {'label' in section ? (
              <Text bold color={resolveRecapSectionLabelColor(section.kind, shellPalette)}>
                {formatRecapSectionLabel(section.label)}
              </Text>
            ) : null}
            {'values' in section ? (
              section.values.map((value, valueIndex) => (
                <Text
                  key={`${item.id}:collaboration:section:${index}:value:${valueIndex}`}
                  color={resolveRecapSectionValueColor(section.kind, shellPalette)}
                >
                  {section.kind === 'artifact' || section.values.length > 1
                    ? `- ${formatRecapValue(value)}`
                    : formatRecapValue(value)}
                </Text>
              ))
            ) : (
              <Text color={resolveRecapLineColor(section.line, shellPalette)}>
                {`- ${formatRecapValue(section.line)}`}
              </Text>
            )}
          </Box>
        ))}
        <Box flexDirection='column' marginTop={1} paddingLeft={1}>
          <Text bold color={shellPalette.promptTitleColor}>
            Response
          </Text>
          {renderMarkdownBlocks(item.id, responseBlocks, shellPalette)}
        </Box>
      </Box>
    </Box>
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
      {renderMarkdownBlocks(item.id, blocks, shellPalette)}
    </>
  );
}

function renderMarkdownBlocks(
  itemId: string,
  blocks: MarkdownBlock[],
  shellPalette: ReactCliShellPalette,
): React.JSX.Element[] {
  const blockKeyRegistry = new Map<string, number>();
  return blocks.map((block) => {
    const blockKey = claimDuplicateAwareRenderKey(
      blockKeyRegistry,
      createMarkdownBlockRenderKey(itemId, block),
    );
    if (block.type === 'heading') {
      return (
        <Text key={blockKey} bold color={shellPalette.titleColor}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'paragraph') {
      return (
        <Text key={blockKey} color={shellPalette.sectionTitleColor}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'list_item') {
      return (
        <Text key={blockKey} color={shellPalette.sectionTitleColor}>
          {`${block.marker} ${block.text}`}
        </Text>
      );
    }
    if (block.type === 'quote') {
      return (
        <Text key={blockKey} color={shellPalette.subtitleColor}>
          {`> ${block.text}`}
        </Text>
      );
    }
    return (
      <Box key={blockKey} flexDirection='column'>
        {renderMarkdownCodeBlockLines(blockKey, block.lines, shellPalette)}
      </Box>
    );
  });
}

function renderMarkdownCodeBlockLines(
  blockKey: string,
  lines: string[],
  shellPalette: ReactCliShellPalette,
): React.JSX.Element[] {
  const lineKeyRegistry = new Map<string, number>();
  return lines.map((line) => {
    const lineKey = claimDuplicateAwareRenderKey(lineKeyRegistry, `${blockKey}:line:${line}`);
    return (
      <Text key={lineKey} color={shellPalette.promptTitleColor}>
        {`| ${line}`}
      </Text>
    );
  });
}

function createMarkdownBlockRenderKey(itemId: string, block: MarkdownBlock): string {
  switch (block.type) {
    case 'heading':
      return `${itemId}:heading:${block.text}`;
    case 'paragraph':
      return `${itemId}:paragraph:${block.text}`;
    case 'list_item':
      return `${itemId}:list:${block.marker}:${block.text}`;
    case 'quote':
      return `${itemId}:quote:${block.text}`;
    case 'code_block':
      return `${itemId}:code:${block.lines.join('\n')}`;
  }
}

function claimDuplicateAwareRenderKey(registry: Map<string, number>, baseKey: string): string {
  const duplicateCount = registry.get(baseKey) ?? 0;
  registry.set(baseKey, duplicateCount + 1);
  return duplicateCount === 0 ? baseKey : `${baseKey}:${String(duplicateCount)}`;
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

type StructuredRecapSection =
  | {
      kind: 'field' | 'status' | 'artifact';
      label: string;
      values: string[];
    }
  | {
      kind: 'note';
      line: string;
    };

function parseStructuredRecap(lines: string[]): {
  headline: string;
  sections: StructuredRecapSection[];
} {
  const [headline = '', ...detailLines] = lines;
  const sections: StructuredRecapSection[] = [];

  for (const line of detailLines) {
    if (appendArtifactContinuationLine(sections, line)) {
      continue;
    }

    const parsedField = parseCommandRecapField(line);
    if (!parsedField) {
      sections.push({
        kind: 'note',
        line,
      });
      continue;
    }

    if (parsedField.kind === 'artifact') {
      sections.push({
        kind: 'artifact',
        label: parsedField.label,
        values: [parsedField.value],
      });
      continue;
    }

    const groupedValues = parsedField.value
      .split(/\s+·\s+/u)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    sections.push({
      kind: groupedValues.length > 1 ? 'status' : 'field',
      label: parsedField.label,
      values: groupedValues.length > 0 ? groupedValues : [parsedField.value],
    });
  }

  return {
    headline,
    sections,
  };
}

function parseCommandRecapField(line: string): {
  kind: 'field' | 'artifact';
  label: string;
  value: string;
} | null {
  const match = /^([^:=：]+?)\s*([=:：])\s*(.+)$/u.exec(line);
  if (!match) {
    return null;
  }

  const label = match[1].trim();
  const value = match[3].trim();
  if (!label || !value) {
    return null;
  }

  return {
    kind: label.toLowerCase() === 'artifact' ? 'artifact' : 'field',
    label,
    value,
  };
}

function formatRecapSectionLabel(label: string): string {
  return `[${label.trim()}]`;
}

function formatRecapValue(value: string): string {
  const normalizedValue = value.trim();
  const keyValueMatch = /^([a-z0-9_]+)=(.+)$/iu.exec(normalizedValue);
  if (!keyValueMatch) {
    return normalizedValue;
  }

  return `${humanizeRecapToken(keyValueMatch[1])}: ${keyValueMatch[2].trim()}`;
}

function humanizeRecapToken(token: string): string {
  const words = token
    .trim()
    .split(/[_-]+/u)
    .filter((word) => word.length > 0);
  if (words.length === 0) {
    return token;
  }

  return `${words[0][0]?.toUpperCase() ?? ''}${words[0].slice(1)}${words
    .slice(1)
    .map((word) => ` ${word}`)
    .join('')}`;
}

function appendArtifactContinuationLine(sections: StructuredRecapSection[], line: string): boolean {
  const lastSection = sections.at(-1);
  if (!lastSection || !('values' in lastSection) || lastSection.kind !== 'artifact') {
    return false;
  }

  const trimmedLine = line.trim();
  if (
    !trimmedLine.startsWith('+') &&
    !/^其余\s+\d+/u.test(trimmedLine) &&
    !/more related artifacts/i.test(trimmedLine)
  ) {
    return false;
  }

  lastSection.values.push(trimmedLine);
  return true;
}

function resolveRecapSectionLabelColor(
  kind: StructuredRecapSection['kind'],
  shellPalette: ReactCliShellPalette,
): string {
  if (kind === 'artifact') {
    return shellPalette.promptTitleColor;
  }
  if (kind === 'status') {
    return shellPalette.subtitleColor;
  }
  return shellPalette.helpColor;
}

function resolveRecapSectionValueColor(
  kind: Extract<StructuredRecapSection, { values: string[] }>['kind'],
  shellPalette: ReactCliShellPalette,
): string {
  if (kind === 'artifact') {
    return shellPalette.promptTitleColor;
  }
  if (kind === 'status') {
    return shellPalette.sectionTitleColor;
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
