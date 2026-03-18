import { COMMANDER_ERROR_TO_EXIT_CODE, EXIT_CODES } from "../../constants/exit-codes.js";
import type { ExitCode } from "../../types/aliases/cli.type.js";

export { EXIT_CODES };

export function mapCommanderErrorToExitCode(errorCode: string): ExitCode {
  if (Object.prototype.hasOwnProperty.call(COMMANDER_ERROR_TO_EXIT_CODE, errorCode)) {
    return COMMANDER_ERROR_TO_EXIT_CODE[errorCode as keyof typeof COMMANDER_ERROR_TO_EXIT_CODE];
  }

  return EXIT_CODES.internalError;
}
