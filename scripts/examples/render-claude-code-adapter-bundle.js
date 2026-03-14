#!/usr/bin/env node

import path from "node:path";
import {
  buildClaudeCodeAdapterBundle,
  renderClaudeCodeAdapterBundle
} from "../../src/adapters/claude-code-bundle.js";

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    command: "plan",
    stageId: "plan",
    format: "markdown",
    tags: [],
    paths: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    if (argument === "--cwd" && nextValue) {
      options.cwd = path.resolve(nextValue);
      index += 1;
      continue;
    }

    if (argument === "--project" && nextValue) {
      options.project = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--sprint" && nextValue) {
      options.sprint = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--command" && nextValue) {
      options.command = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--stage" && nextValue) {
      options.stageId = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--format" && nextValue) {
      options.format = nextValue;
      index += 1;
      continue;
    }

    if (argument === "--tag" && nextValue) {
      options.tags.push(nextValue);
      index += 1;
      continue;
    }

    if (argument === "--path" && nextValue) {
      options.paths.push(nextValue);
      index += 1;
      continue;
    }
  }

  return options;
}

const options = parseArguments(process.argv.slice(2));
const bundle = buildClaudeCodeAdapterBundle(options);
process.stdout.write(renderClaudeCodeAdapterBundle(bundle, options.format));
