import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { runCli } from "../apps/cli/src/main.js";
import { ProfileResolver, SchemaValidator, WorkspaceMode } from "../packages/config/src/index.js";
import { MemoryStoreEngine } from "../packages/shared/src/index.js";

/**
 * Creates one temporary repository root for config and CLI composition smoke tests.
 * @returns Temporary repository root path.
 */
async function createTemporaryRepositoryRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), "repo-ai-governor-memory-config-cli-"));
}

/**
 * Creates buffered IO adapters for CLI smoke tests.
 * @param currentWorkingDirectory Working directory used by CLI runtime.
 * @returns IO adapter and output buffers.
 */
function createBufferedIo(currentWorkingDirectory: string): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string): void => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string): void => {
        stderrBuffer.push(value);
      },
      cwd: (): string => currentWorkingDirectory,
    },
  };
}

describe("Memory store config and CLI composition smoke", () => {
  it("validates and merges memory store engine config through profile resolver", () => {
    const schemaValidator = new SchemaValidator();
    const profileResolver = new ProfileResolver();

    const validatedConfig = schemaValidator.validateOrThrow({
      schemaVersion: "1.0",
      workspace: {
        mode: WorkspaceMode.REPO_LOCAL,
      },
      i18n: {
        runtimeEngine: "i18next",
        defaultLocale: "zh-CN",
        fallbackLocale: "en-US",
        supportedLocales: ["zh-CN", "en-US"],
      },
      memory: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: "context/memory/custom",
      },
      profiles: {
        sqlite: {
          memory: {
            storeEngine: MemoryStoreEngine.SQLITE_FS,
          },
        },
      },
    });

    const resolvedConfig = profileResolver.resolve(validatedConfig, "sqlite");

    expect(resolvedConfig.config.memory?.storeEngine).toBe(MemoryStoreEngine.SQLITE_FS);
    expect(resolvedConfig.config.memory?.storeRoot).toBe("context/memory/custom");
  });

  it("loads memory store engine from governor.yaml and composes sqlite+fs provider", async () => {
    const repositoryRoot = await createTemporaryRepositoryRoot();
    const configDirectory = resolve(repositoryRoot, ".repo-ai-governor");
    const configPath = resolve(configDirectory, "governor.yaml");

    await mkdir(configDirectory, { recursive: true });
    await writeFile(
      configPath,
      [
        'schemaVersion: "1.0"',
        "workspace:",
        "  mode: repo_local",
        "i18n:",
        "  runtimeEngine: i18next",
        "  defaultLocale: zh-CN",
        "  fallbackLocale: en-US",
        "  supportedLocales:",
        "    - zh-CN",
        "    - en-US",
        "memory:",
        "  storeEngine: sqlite_fs",
        "  storeRoot: context/memory/sqlite",
        "",
      ].join("\n"),
      "utf8",
    );

    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(repositoryRoot);

    try {
      const exitCode = await runCli(["node", "repo-ai-governor", "--locale", "en-US", "init"], io);

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join("")).toBe("");
      expect(stdoutBuffer.join("")).toContain("memoryStoreEngine=sqlite_fs");
      expect(stdoutBuffer.join("")).toContain("memoryStoreProvider=SqliteFsMemoryStoreProvider");
      expect(stdoutBuffer.join("")).toContain("memoryStoreRoot=");
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });
});
