import { test } from "vitest";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { listSlotTriggerTargets, validateSlotDefinition } from "../../src/slots/slot-model.js";

const EXAMPLES_ROOT = path.resolve("examples", "slot-packages", "official");

function readSlotExample(fileName: string) {
  const filePath = path.join(EXAMPLES_ROOT, fileName);
  return validateSlotDefinition(YAML.parse(fs.readFileSync(filePath, "utf8")));
}

test("official example slot package validates both sample slots", () => {
  const securitySlot = readSlotExample("official-security-review.yaml");
  const docsSlot = readSlotExample("official-documentation-output.yaml");

  assert.equal(securitySlot.id, "official-security-review");
  assert.equal(docsSlot.id, "official-documentation-output");
  assert.equal(securitySlot.meta.source, "official");
  assert.equal(docsSlot.meta.source, "official");
});

test("official example slot package exposes review and report trigger targets", () => {
  const securityTargets = listSlotTriggerTargets(
    readSlotExample("official-security-review.yaml")
  );
  const docsTargets = listSlotTriggerTargets(
    readSlotExample("official-documentation-output.yaml")
  );

  assert.deepEqual(securityTargets.commands, ["review", "review-verify"]);
  assert.deepEqual(docsTargets.stages, ["plan", "report"]);
});
