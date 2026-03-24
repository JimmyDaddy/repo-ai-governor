import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { GovernorErrorCode, RuntimeError, standardizeError } from "@repo-ai-governor/shared";
import { CliReviewVerifyCommand } from "../../src/commands/review-verify-command.js";
import {
  CLI_REVIEW_LEDGER_BACKFILL_STATUS,
  CLI_REVIEW_REQUEST_STATUS,
} from "../../src/constants/cli-governance-runtime.constant.js";
import { CliReviewQueueRuntime } from "../../src/runtime/artifacts/review-queue-runtime.js";
import type { CliCommandExecutorContext } from "../../src/types/interfaces/cli-governance-runtime.interface.js";

interface ReviewVerifyFixture {
  tempRoot: string;
  workspaceRoot: string;
  requestDirectoryPath: string;
  resultDirectoryPath: string;
  command: CliReviewVerifyCommand;
  context: CliCommandExecutorContext;
}

async function createReviewVerifyFixture(
  options: {
    taskId?: string | null;
    recordLedger?: boolean;
    runNodeScript?: CliCommandExecutorContext["runNodeScript"];
  } = {},
): Promise<ReviewVerifyFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), "review-verify-command-"));
  const workspaceRoot = resolve(tempRoot, ".repo-ai-governor");
  const reviewQueueRuntime = new CliReviewQueueRuntime(workspaceRoot, async (filePath) => {
    try {
      return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    } catch {
      return null;
    }
  });
  const { requestDirectoryPath, resultDirectoryPath } =
    reviewQueueRuntime.resolveReviewQueueDirectories();
  await mkdir(requestDirectoryPath, { recursive: true });
  await mkdir(resultDirectoryPath, { recursive: true });

  const artifactWriter = {
    writeTextArtifact: async (filePath: string, content: string) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
    },
    writeJsonArtifact: async (filePath: string, payload: unknown) => {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    },
    safeReadJson: async (filePath: string) => {
      try {
        return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
      } catch {
        return null;
      }
    },
  };

  const context = {
    options: {
      workspace: {
        workspaceId: "test-workspace",
        workspaceRoot,
      },
      locale: "en-US",
      outputMode: "plain",
    },
    artifactWriter,
    reviewQueueRuntime,
    commandExperienceBuilder: {
      buildExperiencePayload: (payload: unknown) => payload,
    },
    executeRunCommand: async () => {
      throw new RuntimeError(
        GovernorErrorCode.UNKNOWN,
        "executeRunCommand is not used in review-verify-command tests.",
      );
    },
    calculateCheckTotals: () => ({
      pass: 1,
      warn: 0,
      fail: 0,
    }),
    buildDefaultConfigContent: () => "",
    toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, "Z"),
    formatExecFailureDetail: (error: unknown) => standardizeError(error).message,
    resolveRuntimeDebugOptions: () => ({
      dryRun: false,
      trace: false,
      replayPath: null,
      adapters: false,
      fix: false,
      recordLedger: options.recordLedger === true,
      taskId: options.taskId ?? null,
      restrictedNetwork: false,
      restrictedReason: null,
      allowLocalFallback: true,
    }),
    resolveAdapterVerification: async () => ({
      allRequiredRolesSatisfied: true,
      requiredRoleEvaluations: [],
      optionalRoleEvaluations: [],
      tools: [],
    }),
    canWritePath: async () => true,
    localizeText: (english: string) => english,
    adapterDiagnosticsRuntime: {} as CliCommandExecutorContext["adapterDiagnosticsRuntime"],
    runNodeScript:
      options.runNodeScript ??
      (async () => ({
        stdout: "",
        stderr: "",
      })),
  } as unknown as CliCommandExecutorContext;

  return {
    tempRoot,
    workspaceRoot,
    requestDirectoryPath,
    resultDirectoryPath,
    command: new CliReviewVerifyCommand(),
    context,
  };
}

async function writeQueuedRequest(
  requestDirectoryPath: string,
  fileName: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const filePath = resolve(requestDirectoryPath, fileName);
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

describe("CliReviewVerifyCommand", () => {
  it("consumes the queued request matching --task-id instead of blindly taking the latest request", async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: "TK-130",
    });

    try {
      const tk130RequestPath = await writeQueuedRequest(
        fixture.requestDirectoryPath,
        "review-100.json",
        {
          requestId: "review-100",
          status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
          taskId: "TK-130",
        },
      );
      const tk131RequestPath = await writeQueuedRequest(
        fixture.requestDirectoryPath,
        "review-200.json",
        {
          requestId: "review-200",
          status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
          taskId: "TK-131",
        },
      );

      const commandResult = await fixture.command.execute(fixture.context);
      const verifyArtifactPath = commandResult.commandResult.artifacts?.find(
        (artifact) => artifact.id === "review_verify_result",
      )?.path;
      expect(typeof verifyArtifactPath).toBe("string");

      const verifyPayload = JSON.parse(await readFile(String(verifyArtifactPath), "utf8")) as {
        taskId?: string;
        sourceRequestPath?: string;
      };
      expect(verifyPayload.taskId).toBe("TK-130");
      expect(verifyPayload.sourceRequestPath).toBe(tk130RequestPath);

      const tk130Payload = JSON.parse(await readFile(tk130RequestPath, "utf8")) as {
        status?: string;
      };
      const tk131Payload = JSON.parse(await readFile(tk131RequestPath, "utf8")) as {
        status?: string;
      };
      expect(tk130Payload.status).toBe(CLI_REVIEW_REQUEST_STATUS.VERIFIED);
      expect(tk131Payload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it("fails explicitly when --task-id does not match any queued request", async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: "TK-999",
    });

    try {
      await writeQueuedRequest(fixture.requestDirectoryPath, "review-100.json", {
        requestId: "review-100",
        status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
        taskId: "TK-130",
      });

      await expect(fixture.command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.UNKNOWN,
        message: expect.stringContaining("task_id=TK-999"),
      });
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it("keeps the source request queued when managed ledger backfill fails", async () => {
    const fixture = await createReviewVerifyFixture({
      taskId: "TK-130",
      recordLedger: true,
      runNodeScript: async () => {
        throw new RuntimeError(GovernorErrorCode.UNKNOWN, "synthetic ledger sync failure");
      },
    });

    try {
      const sourceRequestPath = await writeQueuedRequest(
        fixture.requestDirectoryPath,
        "review-100.json",
        {
          requestId: "review-100",
          status: CLI_REVIEW_REQUEST_STATUS.QUEUED,
          taskId: "TK-130",
          recordLedger: true,
        },
      );

      await expect(fixture.command.execute(fixture.context)).rejects.toMatchObject({
        code: GovernorErrorCode.UNKNOWN,
      });

      const sourceRequestPayload = JSON.parse(await readFile(sourceRequestPath, "utf8")) as {
        status?: string;
        consumedAt?: string;
        lastVerifyAttemptAt?: string;
        ledgerBackfillStatus?: string;
      };
      expect(sourceRequestPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.QUEUED);
      expect(sourceRequestPayload.consumedAt).toBeUndefined();
      expect(typeof sourceRequestPayload.lastVerifyAttemptAt).toBe("string");
      expect(sourceRequestPayload.ledgerBackfillStatus).toBe(
        CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED,
      );

      const resultFileNames = await readdir(fixture.resultDirectoryPath);
      expect(resultFileNames).toHaveLength(1);
      const verifyPayload = JSON.parse(
        await readFile(resolve(fixture.resultDirectoryPath, resultFileNames[0]), "utf8"),
      ) as {
        status?: string;
        ledgerBackfillStatus?: string;
      };
      expect(verifyPayload.status).toBe(CLI_REVIEW_REQUEST_STATUS.FAILED);
      expect(verifyPayload.ledgerBackfillStatus).toBe(CLI_REVIEW_LEDGER_BACKFILL_STATUS.FAILED);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
