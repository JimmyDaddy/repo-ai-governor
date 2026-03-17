export enum ExitCodeEnum {
  Success = 0,
  BusinessCheckFailed = 1,
  ConfigError = 2,
  EnvironmentError = 3,
  InputError = 4,
  InternalError = 5,
}

export const EXIT_CODES = Object.freeze({
  success: ExitCodeEnum.Success,
  businessCheckFailed: ExitCodeEnum.BusinessCheckFailed,
  configError: ExitCodeEnum.ConfigError,
  environmentError: ExitCodeEnum.EnvironmentError,
  inputError: ExitCodeEnum.InputError,
  internalError: ExitCodeEnum.InternalError,
} as const);

export enum CommanderErrorCodeEnum {
  HelpDisplayed = "commander.helpDisplayed",
  Version = "commander.version",
  UnknownCommand = "commander.unknownCommand",
  UnknownOption = "commander.unknownOption",
  OptionMissingArgument = "commander.optionMissingArgument",
  MissingMandatoryOptionValue = "commander.missingMandatoryOptionValue",
  ExcessArguments = "commander.excessArguments",
  ExcessArgument = "commander.excessArgument",
  MissingArgument = "commander.missingArgument",
}

export const COMMANDER_ERROR_TO_EXIT_CODE = Object.freeze({
  [CommanderErrorCodeEnum.HelpDisplayed]: EXIT_CODES.success,
  [CommanderErrorCodeEnum.Version]: EXIT_CODES.success,
  [CommanderErrorCodeEnum.UnknownCommand]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.UnknownOption]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.OptionMissingArgument]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.MissingMandatoryOptionValue]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.ExcessArguments]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.ExcessArgument]: EXIT_CODES.inputError,
  [CommanderErrorCodeEnum.MissingArgument]: EXIT_CODES.inputError,
} as const);
