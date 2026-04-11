import { Box, Text } from 'ink';
import type React from 'react';
import { CliSessionTranscriptRole } from '../../constants/cli-session-shell.constant.js';
import { parseTimestampedExecutionDetailLine } from '../../runtime/interactive-shell/session-shell-execution-detail-line.js';
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
      <Text bold color={shellPalette.sectionTitleColor}>
        {title}
      </Text>
      {items.map((item) => {
        const itemHorizontalAlignment = resolveTranscriptHorizontalAlignment(item.role);
        const rightAligned = itemHorizontalAlignment === 'flex-end';

        return (
          <Box
            key={item.id}
            flexDirection='column'
            marginTop={1}
            width='100%'
            alignItems={itemHorizontalAlignment}
          >
            <Box
              flexDirection='column'
              paddingLeft={rightAligned ? 0 : 1}
              paddingRight={rightAligned ? 1 : 0}
            >
              <ReactCliTranscriptItemRenderer item={item} shellPalette={shellPalette} />
            </Box>
          </Box>
        );
      })}
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
    case 'live_markdown':
      return <ReactCliLiveMarkdownTranscriptItem item={item} shellPalette={shellPalette} />;
    case 'live_activity':
      return <ReactCliLiveActivityTranscriptItem item={item} shellPalette={shellPalette} />;
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
    <Box flexDirection='column'>
      {renderTranscriptLabel(item, shellPalette)}
      {renderTranscriptMessageSurface(
        item,
        shellPalette,
        item.lines.map((line, index) => (
          <Text
            key={`${item.id}:plain:${index}`}
            color={resolveConversationBodyColor(item.role, shellPalette)}
          >
            {line}
          </Text>
        )),
      )}
      {renderTranscriptDetailsBlock(item, shellPalette)}
      {renderTranscriptProviderContinuationBlock(item, shellPalette)}
    </Box>
  );
}

function ReactCliSystemNoticeTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  return (
    <Box flexDirection='column'>
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
      {renderTranscriptDetailsBlock(item, shellPalette)}
      {renderTranscriptProviderContinuationBlock(item, shellPalette)}
    </Box>
  );
}

function ReactCliCommandRecapTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  const recap = parseStructuredRecap(item.lines);
  const responseBlocks = item.markdownSource ? parseMarkdownBlocks(item.markdownSource) : [];
  const backlinks = item.backlinks ?? [];
  const hasRelatedLinks = backlinks.length > 0;
  const transcriptLabelHidden = shouldHideTranscriptLabel(item.role);

  return (
    <Box flexDirection='column' marginTop={1}>
      <Box
        flexDirection='column'
        borderStyle='round'
        borderColor={shellPalette.promptTitleColor}
        paddingX={1}
      >
        <Box flexDirection='column'>
          {!transcriptLabelHidden ? (
            <Text bold color={shellPalette.titleColor}>
              {item.label}
            </Text>
          ) : null}
          <Text
            color={transcriptLabelHidden ? shellPalette.titleColor : shellPalette.sectionTitleColor}
          >
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
        {renderTranscriptDetailsBlock(item, shellPalette, {
          marginTop: 1,
          paddingLeft: 1,
        })}
        {renderTranscriptProviderContinuationBlock(item, shellPalette, {
          marginTop: 1,
          paddingLeft: 1,
        })}
        {responseBlocks.length > 0 ? (
          <Box flexDirection='column' marginTop={1} paddingLeft={1}>
            <Text bold color={shellPalette.promptTitleColor}>
              Response
            </Text>
            {renderMarkdownBlocks(item.id, responseBlocks, shellPalette, item.role)}
          </Box>
        ) : null}
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
  const transcriptLabelHidden = shouldHideTranscriptLabel(item.role);

  return (
    <Box flexDirection='column' marginTop={1}>
      <Box
        flexDirection='column'
        borderStyle='round'
        borderColor={shellPalette.subtitleColor}
        paddingX={1}
      >
        <Box flexDirection='column'>
          {!transcriptLabelHidden ? (
            <Text bold color={shellPalette.titleColor}>
              {item.label}
            </Text>
          ) : null}
          <Text
            color={transcriptLabelHidden ? shellPalette.titleColor : shellPalette.sectionTitleColor}
          >
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
        {renderTranscriptDetailsBlock(item, shellPalette, {
          marginTop: 1,
          paddingLeft: 1,
        })}
        {renderTranscriptProviderContinuationBlock(item, shellPalette, {
          marginTop: 1,
          paddingLeft: 1,
        })}
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
    <Box flexDirection='column'>
      {renderTranscriptLabel(item, shellPalette)}
      {renderTranscriptMessageSurface(
        item,
        shellPalette,
        renderMarkdownBlocks(item.id, blocks, shellPalette, item.role),
      )}
      {renderTranscriptDetailsBlock(item, shellPalette)}
      {renderTranscriptProviderContinuationBlock(item, shellPalette)}
      {renderTranscriptSuggestedActionsBlock(item, shellPalette)}
    </Box>
  );
}

function ReactCliLiveMarkdownTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  const blocks = parseMarkdownBlocks(item.markdownSource ?? item.lines.join('\n'));

  return (
    <Box flexDirection='column'>
      {renderTranscriptLabel(item, shellPalette)}
      {renderTranscriptMessageSurface(
        item,
        shellPalette,
        renderMarkdownBlocks(item.id, blocks, shellPalette, item.role),
      )}
    </Box>
  );
}

function ReactCliLiveActivityTranscriptItem({
  item,
  shellPalette,
}: ReactCliTranscriptItemRendererProps): React.JSX.Element {
  const summaryLine = item.summaryLine ?? item.lines[0] ?? null;
  const detailLines = item.summaryLine ? item.lines : item.lines.slice(1);

  return (
    <Box
      flexDirection='column'
      marginTop={1}
      borderStyle='round'
      borderColor={shellPalette.liveActivityPalette.borderColor}
      paddingX={1}
    >
      <Text bold color={shellPalette.liveActivityPalette.titleColor}>
        {item.label}
      </Text>
      {summaryLine ? (
        <Text bold color={shellPalette.liveActivityPalette.summaryColor}>
          {summaryLine}
        </Text>
      ) : null}
      {detailLines.map((line, index) => (
        <Box key={`${item.id}:activity:${index}`} flexDirection='row'>
          <Text color={shellPalette.liveActivityPalette.bulletColor}>- </Text>
          {renderLiveActivityLine(line, index, shellPalette)}
        </Box>
      ))}
    </Box>
  );
}

function renderTranscriptDetailsBlock(
  item: CliSessionShellTranscriptItem,
  shellPalette: ReactCliShellPalette,
  options?: {
    marginTop?: number;
    paddingLeft?: number;
  },
): React.JSX.Element | null {
  const details = item.details;
  if (!details || details.lines.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection='column'
      marginTop={options?.marginTop ?? 1}
      paddingLeft={options?.paddingLeft ?? 0}
    >
      <Text bold color={shellPalette.helpColor}>
        {details.title}
      </Text>
      <Text color={shellPalette.helpColor}>{details.summaryLine}</Text>
      {details.expanded
        ? details.lines.map((line, index) => {
            const parsedLine = parseTimestampedExecutionDetailLine(line);
            return (
              <Text
                key={`${item.id}:details:${index}`}
                color={index === 0 ? shellPalette.sectionTitleColor : shellPalette.helpColor}
              >
                {'- '}
                {parsedLine.timestamp ? (
                  <Text color={shellPalette.subtitleColor}>{parsedLine.timestamp}</Text>
                ) : null}
                {parsedLine.timestamp ? '  ' : ''}
                {parsedLine.content}
              </Text>
            );
          })
        : null}
    </Box>
  );
}

function renderTranscriptSuggestedActionsBlock(
  item: CliSessionShellTranscriptItem,
  shellPalette: ReactCliShellPalette,
): React.JSX.Element | null {
  const suggestedActionsBlock = item.suggestedActionsBlock;
  if (!suggestedActionsBlock || suggestedActionsBlock.actions.length === 0) {
    return null;
  }

  return (
    <Box flexDirection='column' marginTop={1}>
      <Text bold color={shellPalette.promptTitleColor}>
        {suggestedActionsBlock.title}
      </Text>
      {suggestedActionsBlock.actions.map((action, index) => (
        <Text key={`${item.id}:suggested-action:${index}`} color={shellPalette.helpColor}>
          {`- ${action.label} -> ${action.suggestedSlashCommand ?? action.target}`}
        </Text>
      ))}
    </Box>
  );
}

function renderTranscriptProviderContinuationBlock(
  item: CliSessionShellTranscriptItem,
  shellPalette: ReactCliShellPalette,
  options?: {
    marginTop?: number;
    paddingLeft?: number;
  },
): React.JSX.Element | null {
  const providerContinuationBlock = item.providerContinuationBlock;
  if (!providerContinuationBlock || providerContinuationBlock.lines.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection='column'
      marginTop={options?.marginTop ?? 1}
      paddingLeft={options?.paddingLeft ?? 0}
    >
      <Text bold color={shellPalette.helpColor}>
        {providerContinuationBlock.title}
      </Text>
      {providerContinuationBlock.lines.map((line, index) => (
        <Text key={`${item.id}:provider-continuation:${index}`} color={shellPalette.helpColor}>
          {`- ${line}`}
        </Text>
      ))}
    </Box>
  );
}

function renderMarkdownBlocks(
  itemId: string,
  blocks: MarkdownBlock[],
  shellPalette: ReactCliShellPalette,
  role?: CliSessionTranscriptRole,
): React.JSX.Element[] {
  const blockKeyRegistry = new Map<string, number>();
  return blocks.map((block) => {
    const blockKey = claimDuplicateAwareRenderKey(
      blockKeyRegistry,
      createMarkdownBlockRenderKey(itemId, block),
    );
    if (block.type === 'heading') {
      return (
        <Text key={blockKey} bold color={resolveConversationHeadingColor(role, shellPalette)}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'paragraph') {
      return (
        <Text key={blockKey} color={resolveConversationBodyColor(role, shellPalette)}>
          {block.text}
        </Text>
      );
    }
    if (block.type === 'list_item') {
      return (
        <Text key={blockKey} color={resolveConversationBodyColor(role, shellPalette)}>
          {`${block.marker} ${block.text}`}
        </Text>
      );
    }
    if (block.type === 'quote') {
      return (
        <Text key={blockKey} color={resolveConversationQuoteColor(role, shellPalette)}>
          {`> ${block.text}`}
        </Text>
      );
    }
    return (
      <Box key={blockKey} flexDirection='column'>
        {renderMarkdownCodeBlockLines(blockKey, block.lines, shellPalette, role)}
      </Box>
    );
  });
}

function renderTranscriptLabel(
  item: CliSessionShellTranscriptItem,
  shellPalette: ReactCliShellPalette,
): React.JSX.Element | null {
  if (shouldHideTranscriptLabel(item.role)) {
    return null;
  }

  return (
    <Text bold color={resolveTranscriptColor(item.role, shellPalette)}>
      {item.label}
    </Text>
  );
}

function renderTranscriptMessageSurface(
  item: CliSessionShellTranscriptItem,
  shellPalette: ReactCliShellPalette,
  content: React.JSX.Element[],
): React.JSX.Element {
  if (item.role !== CliSessionTranscriptRole.USER) {
    return <Box flexDirection='column'>{content}</Box>;
  }

  return (
    <Box
      flexDirection='column'
      borderStyle='round'
      borderColor={shellPalette.conversationPalette.userBubbleBorderColor}
      paddingX={1}
    >
      {content}
    </Box>
  );
}

function renderLiveActivityLine(
  line: string,
  index: number,
  shellPalette: ReactCliShellPalette,
): React.JSX.Element {
  const parsedLine = parseLiveActivityLine(line);
  const tagKind = classifyLiveActivityTagKind(line, parsedLine);
  const tagColor = resolveLiveActivityTagColor(tagKind, shellPalette);
  const contentColor =
    tagKind === 'error'
      ? shellPalette.liveActivityPalette.errorTextColor
      : tagKind === 'system'
        ? shellPalette.liveActivityPalette.systemTextColor
        : index === 0
          ? shellPalette.liveActivityPalette.primaryTextColor
          : shellPalette.liveActivityPalette.secondaryTextColor;

  return (
    <Text color={contentColor} dimColor={tagKind === 'system'}>
      {parsedLine.prefix ? (
        <>
          <Text color={tagColor}>[{parsedLine.prefix}]</Text>{' '}
        </>
      ) : null}
      {parsedLine.content}
    </Text>
  );
}

function renderMarkdownCodeBlockLines(
  blockKey: string,
  lines: string[],
  shellPalette: ReactCliShellPalette,
  role?: CliSessionTranscriptRole,
): React.JSX.Element[] {
  const lineKeyRegistry = new Map<string, number>();
  return lines.map((line) => {
    const lineKey = claimDuplicateAwareRenderKey(lineKeyRegistry, `${blockKey}:line:${line}`);
    return (
      <Text key={lineKey} color={resolveConversationCodeColor(role, shellPalette)}>
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

function resolveTranscriptHorizontalAlignment(
  role: CliSessionTranscriptRole,
): 'flex-start' | 'flex-end' {
  switch (role) {
    case CliSessionTranscriptRole.USER:
    case CliSessionTranscriptRole.SLASH_COMMAND:
      return 'flex-end';
    default:
      return 'flex-start';
  }
}

function shouldHideTranscriptLabel(role: CliSessionTranscriptRole): boolean {
  return role === CliSessionTranscriptRole.USER || role === CliSessionTranscriptRole.ASSISTANT;
}

type LiveActivityTagKind =
  | 'neutral'
  | 'system'
  | 'role'
  | 'running'
  | 'completed'
  | 'todo'
  | 'error';

function parseLiveActivityLine(line: string): {
  prefix: string | null;
  content: string;
} {
  const normalizedLine = line.trim();
  const toolMatch = /^(Tool|工具)[:：]\s*(.+?)\s+-\s+(.+)$/u.exec(normalizedLine);
  if (toolMatch) {
    return {
      prefix: toolMatch[2]?.trim() ?? toolMatch[1] ?? null,
      content: toolMatch[3]?.trim() ?? normalizedLine,
    };
  }

  const prefixedLineMatch = /^([^:：]{1,40})[:：]\s*(.+)$/u.exec(normalizedLine);
  if (!prefixedLineMatch) {
    return {
      prefix: null,
      content: normalizedLine,
    };
  }

  return {
    prefix: prefixedLineMatch[1]?.trim() ?? null,
    content: prefixedLineMatch[2]?.trim() ?? normalizedLine,
  };
}

function classifyLiveActivityTagKind(
  rawLine: string,
  parsedLine: {
    prefix: string | null;
    content: string;
  },
): LiveActivityTagKind {
  const normalizedRawLine = rawLine.trim();
  const normalizedPrefix = parsedLine.prefix?.trim().toLowerCase() ?? '';
  const normalizedContent = parsedLine.content.trim().toLowerCase();

  if (
    /stderr|failed|error/iu.test(normalizedPrefix) ||
    /failed|error|timed out|cancelled|canceled/iu.test(normalizedContent)
  ) {
    return 'error';
  }

  if (/system|系统/iu.test(normalizedPrefix)) {
    return 'system';
  }

  if (/^(completed|done|finished)\b/iu.test(normalizedContent)) {
    return 'completed';
  }

  if (/^(todo|pending|queued)\b/iu.test(normalizedContent)) {
    return 'todo';
  }

  if (/^(running|reading|inspecting|checking|preparing)\b/iu.test(normalizedContent)) {
    return 'running';
  }

  if (/^(tool|工具)[:：]/u.test(normalizedRawLine)) {
    return 'running';
  }

  if (
    normalizedPrefix.length > 0 &&
    normalizedPrefix !== 'current' &&
    normalizedPrefix !== '当前'
  ) {
    return 'role';
  }

  return 'neutral';
}

function resolveLiveActivityTagColor(
  tagKind: LiveActivityTagKind,
  shellPalette: ReactCliShellPalette,
): string {
  switch (tagKind) {
    case 'system':
      return shellPalette.liveActivityPalette.tagPalette.system;
    case 'role':
      return shellPalette.liveActivityPalette.tagPalette.role;
    case 'running':
      return shellPalette.liveActivityPalette.tagPalette.running;
    case 'completed':
      return shellPalette.liveActivityPalette.tagPalette.completed;
    case 'todo':
      return shellPalette.liveActivityPalette.tagPalette.todo;
    case 'error':
      return shellPalette.liveActivityPalette.tagPalette.error;
    default:
      return shellPalette.liveActivityPalette.tagPalette.neutral;
  }
}

function resolveConversationBodyColor(
  role: CliSessionTranscriptRole | undefined,
  shellPalette: ReactCliShellPalette,
): string {
  if (role === CliSessionTranscriptRole.USER) {
    return shellPalette.conversationPalette.userTextColor;
  }

  if (role === CliSessionTranscriptRole.ASSISTANT) {
    return shellPalette.conversationPalette.assistantTextColor;
  }

  return shellPalette.sectionTitleColor;
}

function resolveConversationHeadingColor(
  role: CliSessionTranscriptRole | undefined,
  shellPalette: ReactCliShellPalette,
): string {
  if (role === CliSessionTranscriptRole.ASSISTANT) {
    return shellPalette.conversationPalette.assistantHeadingColor;
  }

  return shellPalette.titleColor;
}

function resolveConversationQuoteColor(
  role: CliSessionTranscriptRole | undefined,
  shellPalette: ReactCliShellPalette,
): string {
  if (role === CliSessionTranscriptRole.ASSISTANT) {
    return shellPalette.conversationPalette.assistantQuoteColor;
  }

  return shellPalette.subtitleColor;
}

function resolveConversationCodeColor(
  role: CliSessionTranscriptRole | undefined,
  shellPalette: ReactCliShellPalette,
): string {
  if (role === CliSessionTranscriptRole.ASSISTANT) {
    return shellPalette.conversationPalette.assistantCodeColor;
  }

  if (role === CliSessionTranscriptRole.USER) {
    return shellPalette.conversationPalette.userTextColor;
  }

  return shellPalette.promptTitleColor;
}
