import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fail, normalizeDelegatedReviewerFindings } from './reviewer-prompt-utils.mjs';

function parseArgs(argv) {
  const options = {
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      fail(`Unexpected argument: ${arg}`);
    }

    const key = arg.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      fail(`Missing value for --${key}`);
    }

    index += 1;

    switch (key) {
      case 'handoff-json':
        options.handoffJson = value;
        break;
      case 'raw-findings-json':
        options.rawFindingsJson = value;
        break;
      default:
        fail(`Unknown option: --${key}`);
    }
  }

  return options;
}

function printLine(value = '') {
  process.stdout.write(`${value}\n`);
}

function printHelp() {
  printLine(`Usage:
  node ./.codex/skills/workspace-scoped-cr-loop/scripts/normalize-reviewer-findings.mjs \\
    --handoff-json <structured-handoff-json> \\
    --raw-findings-json <reviewer-findings-json> \\
    [--json]

Notes:
  - --handoff-json should contain the delegatedReviewRequest JSON emitted by bootstrap/render.
  - --raw-findings-json should contain the reviewer-emitted normalized finding array.`);
}

function ensureRequired(options, key) {
  if (!options[key]) {
    fail(
      `Missing required option: --${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    );
  }
}

function readJson(filePath, label) {
  const absolutePath = resolve(filePath);

  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(
      `Unable to parse ${label} JSON ${absolutePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  ensureRequired(options, 'handoffJson');
  ensureRequired(options, 'rawFindingsJson');

  const delegatedReviewRequest = readJson(options.handoffJson, 'handoff');
  const rawFindings = readJson(options.rawFindingsJson, 'raw-findings');
  if (!Array.isArray(rawFindings)) {
    fail('Raw reviewer findings JSON must be an array.');
  }

  const normalizedFindings = normalizeDelegatedReviewerFindings({
    delegatedReviewRequest,
    rawFindings,
  });

  if (options.json) {
    printLine(JSON.stringify(normalizedFindings, null, 2));
    return;
  }

  printLine(`NORMALIZED_FINDING_COUNT=${normalizedFindings.length}`);
  printLine();
  printLine('--- BEGIN NORMALIZED FINDINGS ---');
  printLine(JSON.stringify(normalizedFindings, null, 2));
  printLine('--- END NORMALIZED FINDINGS ---');
}

main();
