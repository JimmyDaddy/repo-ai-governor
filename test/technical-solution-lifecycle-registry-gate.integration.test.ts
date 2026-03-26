import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

interface LifecycleFailure {
  rule_id: string;
  message: string;
  details: Record<string, unknown>;
}

interface LifecycleResult {
  status: "pass" | "fail";
  failures: LifecycleFailure[];
  solutions_scanned: number;
  draft_paths_scanned: number;
  final_paths_scanned: number;
  registry_path: string;
}

interface LifecycleOutcome {
  exitCode: number;
  result: LifecycleResult;
}

const SCRIPT_PATH = resolve(
  process.cwd(),
  "scripts/governance/check-technical-solution-lifecycle-registry.js",
);
const DEFAULT_REGISTRY_PATH =
  ".repo-ai-governor/context/technical-solution-lifecycle-registry.yaml";
const DEFAULT_MODULE_REGISTRY_PATH =
  ".repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml";
const DEFAULT_MANIFEST_PATH =
  ".repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml";

/**
 * Executes the lifecycle registry checker and always returns machine output.
 * @param {{registryPath?: string, moduleRegistryPath?: string, manifestPath?: string}} [options] Runtime options.
 * @returns {LifecycleOutcome}
 */
function runLifecycleGate(
  options: {
    registryPath?: string;
    moduleRegistryPath?: string;
    manifestPath?: string;
  } = {},
): LifecycleOutcome {
  const commandArgs = [
    SCRIPT_PATH,
    "--format",
    "json",
    "--registry",
    options.registryPath ?? DEFAULT_REGISTRY_PATH,
    "--module-registry",
    options.moduleRegistryPath ?? DEFAULT_MODULE_REGISTRY_PATH,
    "--manifest",
    options.manifestPath ?? DEFAULT_MANIFEST_PATH,
  ];

  try {
    const stdout = execFileSync(process.execPath, commandArgs, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return {
      exitCode: 0,
      result: JSON.parse(stdout) as LifecycleResult,
    };
  } catch (error) {
    const commandError = error as {
      status?: number;
      stdout?: string | Buffer;
    };
    const rawStdout =
      typeof commandError.stdout === "string"
        ? commandError.stdout
        : (commandError.stdout?.toString("utf8") ?? "");

    return {
      exitCode: commandError.status ?? 1,
      result: JSON.parse(rawStdout) as LifecycleResult,
    };
  }
}

describe("technical-solution-lifecycle-registry gate", () => {
  it("passes for the repository lifecycle registry", () => {
    const outcome = runLifecycleGate();

    expect(outcome.exitCode).toBe(0);
    expect(outcome.result.status).toBe("pass");
    expect(outcome.result.failures).toHaveLength(0);
    expect(outcome.result.solutions_scanned).toBeGreaterThan(0);
  });

  it("fails for invalid draft location and missing manifest registration", () => {
    const tempRoot = resolve(process.cwd(), ".tmp/lifecycle-registry-gate-test");
    const docsRoot = join(tempRoot, "docs");
    rmSync(tempRoot, { recursive: true, force: true });
    mkdirSync(join(docsRoot, "modules"), { recursive: true });

    writeFileSync(join(tempRoot, "draft-solution.md"), "# draft\n\n- Status: draft\n", "utf8");
    writeFileSync(join(docsRoot, "final-solution.md"), "# final\n\n- Status: active\n", "utf8");

    const lifecycleRegistryPath = join(tempRoot, "lifecycle.yaml");
    writeFileSync(
      lifecycleRegistryPath,
      [
        "schema_version: 1",
        "allowed_statuses:",
        "  - draft",
        "  - active",
        "solutions:",
        "  - solution_id: solution-a",
        "    title: Solution A",
        "    status: draft",
        "    owner: architecture",
        "    version: v0",
        "    scope: governance",
        `    draft_paths:\n      - ${join(tempRoot, "draft-solution.md").replace(/\\/g, "/")}`,
        "    review_paths: []",
        "    final_paths: []",
        "    target_module_ids: []",
        "    north_star_refs: []",
        "    supersedes: []",
        "  - solution_id: solution-b",
        "    title: Solution B",
        "    status: active",
        "    owner: architecture",
        "    version: v1",
        "    scope: governance",
        "    draft_paths: []",
        "    review_paths: []",
        `    final_paths:\n      - ${join(docsRoot, "final-solution.md").replace(/\\/g, "/")}`,
        "    target_module_ids:",
        "      - missing.module",
        "    north_star_refs:",
        "      - prd.docs-sync",
        "    approved_at: 2026-03-26",
        "    approved_by: AI-Agent",
        "    supersedes: []",
      ].join("\n"),
      "utf8",
    );

    const moduleRegistryPath = join(tempRoot, "module-registry.yaml");
    writeFileSync(
      moduleRegistryPath,
      [
        "schema_version: 2",
        "allowed_layers:",
        "  - governance-core",
        "modules:",
        "  - module_id: module-a",
        "    status: active",
        "    owner: architecture",
        "    layer: governance-core",
        `    summary_doc: ${join(docsRoot, "final-solution.md").replace(/\\/g, "/")}`,
        "    detail_docs: []",
        "    north_star_refs:",
        "      - prd.docs-sync",
        "    exports_contracts: []",
        "    imports_contracts: []",
        "    depends_on_modules: []",
      ].join("\n"),
      "utf8",
    );

    const manifestPath = join(tempRoot, "manifest.yaml");
    writeFileSync(
      manifestPath,
      [
        "schema_version: 1",
        "external_required_inputs: []",
        "documents:",
        "  - doc_id: lifecycle_contract",
        "    path: .repo-ai-governor/normative_knowledge_sources/governance/code_standards.md",
        "    tier: L0",
        "    status: active",
        "    default_load: true",
        "    load_trigger:",
        "      - all_tasks",
        "    owner: governance",
      ].join("\n"),
      "utf8",
    );

    const outcome = runLifecycleGate({
      registryPath: lifecycleRegistryPath,
      moduleRegistryPath,
      manifestPath,
    });
    rmSync(tempRoot, { recursive: true, force: true });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.result.status).toBe("fail");
    expect(
      outcome.result.failures.some(
        (failure) => failure.rule_id === "draft_path_outside_draft_root",
      ),
    ).toBe(true);
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === "target_module_unresolved"),
    ).toBe(true);
    expect(
      outcome.result.failures.some(
        (failure) => failure.rule_id === "final_path_not_manifest_registered",
      ),
    ).toBe(true);
    expect(
      outcome.result.failures.some((failure) => failure.rule_id === "review_paths_missing"),
    ).toBe(true);
  });
});
