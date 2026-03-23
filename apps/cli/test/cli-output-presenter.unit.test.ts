import {
  ErrorOutputEnvironment,
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
} from "@repo-ai-governor/shared";
import { CliOutputPresenter } from "../src/cli-output-presenter.js";
import {
  CliGovernanceCheckStatus,
  CliRuntimeOperation,
} from "../src/constants/cli-governance-runtime.constant.js";
import { CliOutputStatus, CliVerbosity } from "../src/constants/cli-output.constant.js";

describe("CliOutputPresenter pretty success readability", () => {
  it("renders sectioned human-readable connect output instead of field-dump lines", () => {
    const stdoutBuffer: string[] = [];
    const stderrBuffer: string[] = [];
    const presenter = new CliOutputPresenter({
      stdout: (value) => {
        stdoutBuffer.push(value);
      },
      stderr: (value) => {
        stderrBuffer.push(value);
      },
    });

    presenter.writeSuccess({
      schema_version: "cli_output_v1",
      status: CliOutputStatus.SUCCESS,
      output_mode: ErrorOutputEnvironment.PRETTY,
      verbosity: CliVerbosity.NORMAL,
      command: "connect",
      message: "Connect completed with adapter_status=warn.",
      runtime: {
        is_tty: true,
        color_enabled: false,
        compact: false,
        downgraded_from: null,
      },
      diagnostics: {
        configSource: "file",
        locale: "en-US",
        profile: "none",
        workspaceMode: "tool_managed",
        workspaceModeSource: "runtime",
        workspaceId: "ws-1",
        workspaceRoot: "/tmp/ws",
        memoryStoreEngine: "fs_csv",
        memoryStoreRoot: "/tmp/ws/context/memory",
        memoryStoreProvider: "FsCsvMemoryStoreProvider",
      },
      command_result: {
        operation: CliRuntimeOperation.ADAPTER_CONNECT,
        summary: "Connect completed with adapter_status=warn.",
        check_totals: {
          pass: 1,
          warn: 2,
          fail: 0,
        },
        checks: [
          {
            id: "adapter_verification",
            status: CliGovernanceCheckStatus.WARN,
            detail: "required_roles=6 required_failures=0 degraded_roles=1 fallback_roles=0",
          },
          {
            id: "adapter_tool_codex",
            status: CliGovernanceCheckStatus.WARN,
            detail: 'availability=unavailable reasons=missing command "codex"',
          },
        ],
        artifacts: [
          {
            id: "connect_diagnostics",
            path: "/tmp/ws/context/diagnostics/connect/connect-1.json",
          },
        ],
        experience: {
          statusDictionary: {
            queued: "Queued",
            running: "Running",
            completed: "Completed",
            waiting: "Waiting",
            warning: "Warning",
            failed: "Failed",
          },
          roleProgress: [
            {
              roleId: "planner",
              stage: ExecutionProgressStage.CONNECT,
              status: ExecutionProgressStatus.COMPLETED,
              category: ExecutionInteractionCategory.NONE,
              summary: "planner route ready",
            },
            {
              roleId: "coder",
              stage: ExecutionProgressStage.CONNECT,
              status: ExecutionProgressStatus.WARNING,
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              summary: "coder route needs fix",
            },
          ],
          layeredLogs: {
            summary: ["adapter_status=warn"],
            detailed: [],
          },
          interactionPrompts: [
            {
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              stage: ExecutionProgressStage.CONNECT,
              title: "Adapter route attention",
              action: "Install missing local commands before connect/verify: codex.",
              blocking: false,
            },
          ],
        },
      },
    });

    const renderedOutput = stdoutBuffer.join("");
    expect(stderrBuffer.join("")).toBe("");
    expect(renderedOutput).toContain("repo-ai-governor: command succeeded");
    expect(renderedOutput).toContain("Summary");
    expect(renderedOutput).toContain("Health");
    expect(renderedOutput).toContain("Next Steps");
    expect(renderedOutput).toContain("Artifacts");
    expect(renderedOutput).toContain("Context");
    expect(renderedOutput).toContain("Adapter tool codex");
    expect(renderedOutput).toContain(
      "1. Adapter route attention: Install missing local commands before connect/verify: codex.",
    );
    expect(renderedOutput).not.toContain("operation_summary:");
    expect(renderedOutput).not.toContain("log_summary:");
  });

  it("collapses artifacts and context details when compact mode is enabled", () => {
    const stdoutBuffer: string[] = [];
    const presenter = new CliOutputPresenter({
      stdout: (value) => {
        stdoutBuffer.push(value);
      },
      stderr: () => undefined,
    });

    presenter.writeSuccess({
      schema_version: "cli_output_v1",
      status: CliOutputStatus.SUCCESS,
      output_mode: ErrorOutputEnvironment.PRETTY,
      verbosity: CliVerbosity.NORMAL,
      command: "connect",
      message: "Connect completed with adapter_status=warn.",
      runtime: {
        is_tty: true,
        color_enabled: false,
        compact: true,
        downgraded_from: null,
      },
      diagnostics: {
        configSource: "file",
        locale: "en-US",
        profile: "none",
        workspaceMode: "tool_managed",
        workspaceModeSource: "runtime",
        workspaceId: "ws-1",
        workspaceRoot: "/tmp/ws",
        memoryStoreEngine: "fs_csv",
        memoryStoreRoot: "/tmp/ws/context/memory",
        memoryStoreProvider: "FsCsvMemoryStoreProvider",
      },
      command_result: {
        operation: CliRuntimeOperation.ADAPTER_CONNECT,
        summary: "Connect completed with adapter_status=warn.",
        check_totals: {
          pass: 1,
          warn: 2,
          fail: 0,
        },
        checks: [
          {
            id: "adapter_tool_codex",
            status: CliGovernanceCheckStatus.WARN,
            detail: 'availability=unavailable reasons=missing command "codex"',
          },
        ],
        artifacts: [
          {
            id: "connect_diagnostics",
            path: "/tmp/ws/context/diagnostics/connect/connect-1.json",
          },
          {
            id: "connect_ledger_backfill",
            path: "/tmp/ws/context/ledger-backfill/connect/connect-1.json",
          },
        ],
        experience: {
          statusDictionary: {
            queued: "Queued",
            running: "Running",
            completed: "Completed",
            waiting: "Waiting",
            warning: "Warning",
            failed: "Failed",
          },
          roleProgress: [
            {
              roleId: "coder",
              stage: ExecutionProgressStage.CONNECT,
              status: ExecutionProgressStatus.WARNING,
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              summary: "coder route needs fix",
            },
          ],
          layeredLogs: {
            summary: ["adapter_status=warn"],
            detailed: [],
          },
          interactionPrompts: [
            {
              category: ExecutionInteractionCategory.ENVIRONMENT_PRECONDITION,
              stage: ExecutionProgressStage.CONNECT,
              title: "Adapter route attention",
              action: "Install missing local commands before connect/verify: codex.",
              blocking: false,
            },
          ],
        },
      },
    });

    const renderedOutput = stdoutBuffer.join("");
    expect(renderedOutput).toContain("Artifacts");
    expect(renderedOutput).toContain("2 artifact(s) generated.");
    expect(renderedOutput).toContain("Primary: connect_diagnostics");
    expect(renderedOutput).toContain("Locale=en-US | Profile=none | Output=pretty");
    expect(renderedOutput).not.toContain("connect_ledger_backfill:");
    expect(renderedOutput).not.toContain("Output mode:");
  });

  it("localizes pretty sections for zh-CN locale", () => {
    const stdoutBuffer: string[] = [];
    const presenter = new CliOutputPresenter({
      stdout: (value) => {
        stdoutBuffer.push(value);
      },
      stderr: () => undefined,
    });

    presenter.writeSuccess({
      schema_version: "cli_output_v1",
      status: CliOutputStatus.SUCCESS,
      output_mode: ErrorOutputEnvironment.PRETTY,
      verbosity: CliVerbosity.NORMAL,
      command: "connect",
      message: "连接已完成。",
      runtime: {
        is_tty: true,
        color_enabled: false,
        compact: false,
        downgraded_from: null,
      },
      diagnostics: {
        configSource: "file",
        locale: "zh-CN",
        profile: "未设置",
        workspaceMode: "tool_managed",
        workspaceModeSource: "runtime",
        workspaceId: "ws-1",
        workspaceRoot: "/tmp/ws",
        memoryStoreEngine: "fs_csv",
        memoryStoreRoot: "/tmp/ws/context/memory",
        memoryStoreProvider: "FsCsvMemoryStoreProvider",
      },
      command_result: {
        operation: CliRuntimeOperation.ADAPTER_CONNECT,
        summary: "连接已完成。",
        check_totals: {
          pass: 1,
          warn: 1,
          fail: 0,
        },
        checks: [
          {
            id: "adapter_verification",
            status: CliGovernanceCheckStatus.WARN,
            detail: "required_roles=6 required_failures=0 degraded_roles=2 fallback_roles=1",
          },
        ],
        artifacts: [
          {
            id: "connect_diagnostics",
            path: "/tmp/ws/context/diagnostics/connect/connect-1.json",
          },
        ],
        experience: {
          statusDictionary: {
            queued: "Queued",
            running: "Running",
            completed: "Completed",
            waiting: "Waiting",
            warning: "Warning",
            failed: "Failed",
          },
          roleProgress: [
            {
              roleId: "planner",
              stage: ExecutionProgressStage.CONNECT,
              status: ExecutionProgressStatus.COMPLETED,
              category: ExecutionInteractionCategory.NONE,
              summary: "ok",
            },
          ],
          layeredLogs: {
            summary: [],
            detailed: [],
          },
          interactionPrompts: [],
        },
      },
    });

    const renderedOutput = stdoutBuffer.join("");
    expect(renderedOutput).toContain("repo-ai-governor：命令执行成功");
    expect(renderedOutput).toContain("摘要");
    expect(renderedOutput).toContain("健康状态");
    expect(renderedOutput).toContain("必需角色 6 个");
    expect(renderedOutput).toContain("产物");
    expect(renderedOutput).toContain("上下文");
    expect(renderedOutput).toContain("语言: zh-CN");
  });
});
