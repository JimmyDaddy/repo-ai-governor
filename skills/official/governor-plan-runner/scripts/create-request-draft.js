#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--title") {
      options.title = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--project") {
      options.project = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--sprint") {
      options.sprint = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--out") {
      options.out = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const templatePath = path.resolve(__dirname, "..", "templates", "request-draft.md");
const title = options.title ?? "New governed task";
const project = options.project ?? "TODO_AI_FILL: project";
const sprint = options.sprint ?? "TODO_AI_FILL: sprint";
const rendered = fs
  .readFileSync(templatePath, "utf8")
  .replaceAll("{{TITLE}}", title)
  .replaceAll("{{PROJECT}}", project)
  .replaceAll("{{SPRINT}}", sprint);

if (options.out) {
  fs.mkdirSync(path.dirname(path.resolve(options.out)), { recursive: true });
  fs.writeFileSync(path.resolve(options.out), rendered, "utf8");
} else {
  process.stdout.write(rendered);
}
