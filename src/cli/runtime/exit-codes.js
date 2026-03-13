export const EXIT_CODES = {
  success: 0,
  businessCheckFailed: 1,
  configError: 2,
  environmentError: 3,
  inputError: 4,
  internalError: 5
};

export function mapCommanderErrorToExitCode(errorCode) {
  switch (errorCode) {
    case "commander.helpDisplayed":
    case "commander.version":
      return EXIT_CODES.success;
    case "commander.unknownCommand":
    case "commander.unknownOption":
    case "commander.optionMissingArgument":
    case "commander.missingMandatoryOptionValue":
    case "commander.excessArguments":
    case "commander.excessArgument":
    case "commander.missingArgument":
      return EXIT_CODES.inputError;
    default:
      return EXIT_CODES.internalError;
  }
}
