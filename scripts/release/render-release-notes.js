#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function parseArguments(argv) {
  const options = {
    format: "markdown",
    section: null,
    version: null,
    out: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--format=json") {
      options.format = "json";
      continue;
    }

    if (argument === "--section" && argv[index + 1]) {
      options.section = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--version" && argv[index + 1]) {
      options.version = argv[index + 1];
      index += 1;
      continue;
    }

    if (argument === "--out" && argv[index + 1]) {
      options.out = argv[index + 1];
      index += 1;
    }
  }

  return options;
}

function extractSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const targetHeading = `## [${heading}]`;
  const startIndex = lines.findIndex((line) => line.startsWith(targetHeading));

  if (startIndex === -1) {
    return null;
  }

  const collected = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("## [")) {
      break;
    }

    collected.push(line);
  }

  return collected.join("\n").trim();
}

function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : `${value}\n`;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));
  const changelogPath = path.join(ROOT_DIR, "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const targetSection = options.section ?? (options.version ? options.version : "Unreleased");
  const resolvedVersion = options.version ?? packageJson.version;
  const notesBody = extractSection(changelog, targetSection);

  if (!notesBody) {
    process.stderr.write(`Release notes section not found: ${targetSection}\n`);
    process.exitCode = 1;
    return;
  }

  const renderedNotes = ensureTrailingNewline(
    [`# Release ${resolvedVersion}`, "", notesBody].join("\n"),
  );

  if (options.out) {
    const outputPath = path.resolve(ROOT_DIR, options.out);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, renderedNotes, "utf8");
  }

  if (options.format === "json") {
    process.stdout.write(
      `${JSON.stringify(
        {
          status: "pass",
          version: resolvedVersion,
          targetSection,
          outputPath: options.out ?? null,
          body: renderedNotes,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  process.stdout.write(renderedNotes);
}

main();
