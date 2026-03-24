import { CliCheckCommand } from "../../src/commands/check-command.js";
import type { CliCommandExecutor } from "../../src/commands/cli-command-executor.interface.js";
import { CliCommandRegistry } from "../../src/commands/cli-command-registry.js";
import { CliConnectCommand } from "../../src/commands/connect-command.js";
import { CliDoctorCommand } from "../../src/commands/doctor-command.js";
import { CliInitCommand } from "../../src/commands/init-command.js";
import { CliPlanCommand } from "../../src/commands/plan-command.js";
import { CliReviewCommand } from "../../src/commands/review-command.js";
import { CliReviewVerifyCommand } from "../../src/commands/review-verify-command.js";
import { CliUpgradeCommand } from "../../src/commands/upgrade-command.js";
import { CliVerifyCommand } from "../../src/commands/verify-command.js";
import { CliCommandName } from "../../src/constants/cli-command.constant.js";

describe("Cli command registry", () => {
  it("registers every extracted non-run command name", () => {
    const executors = [
      new CliInitCommand(),
      new CliConnectCommand(),
      new CliDoctorCommand(),
      new CliCheckCommand(),
      new CliVerifyCommand(),
      new CliPlanCommand(),
      new CliReviewCommand(),
      new CliReviewVerifyCommand(),
      new CliUpgradeCommand(),
    ] as const;
    const registry = new CliCommandRegistry(executors);

    for (const executor of executors) {
      expect(registry.resolve(executor.commandName)).toBe(executor);
    }
    expect(registry.resolve(CliCommandName.RUN)).toBeNull();
  });

  it("rejects duplicate command executor registrations", () => {
    const initExecutor = {
      commandName: CliCommandName.INIT,
      execute: vi.fn(),
    } satisfies CliCommandExecutor;
    const duplicateInitExecutor = {
      commandName: CliCommandName.INIT,
      execute: vi.fn(),
    } satisfies CliCommandExecutor;

    expect(() => new CliCommandRegistry([initExecutor, duplicateInitExecutor])).toThrow(
      'Duplicate CLI command executor registration for "init".',
    );
  });
});
