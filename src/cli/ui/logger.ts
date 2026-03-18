import type {
  KeyValueOptions,
  Logger,
  LoggerOptions,
  RawOptions,
  Theme,
  WritableLike,
} from "../../types/interfaces/cli-ui.interface.js";
import { createTheme } from "./theme.js";

function writeLine(stream: WritableLike, content = ""): void {
  stream.write(`${content}\n`);
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const quiet = options.quiet ?? false;
  const verbose = options.verbose ?? false;
  const colorEnabled =
    options.colorEnabled ?? (Boolean(stdout.isTTY || stderr.isTTY) && !("NO_COLOR" in process.env));
  const theme: Theme = createTheme({ colorEnabled });

  function raw(message: string, rawOptions: RawOptions = {}): void {
    const target = rawOptions.stderr ? stderr : stdout;
    const ignoreQuiet = rawOptions.ignoreQuiet ?? false;

    if (!ignoreQuiet && quiet && !rawOptions.stderr) {
      return;
    }

    writeLine(target, message);
  }

  function prefixed(
    level: "success" | "info" | "warn" | "error" | "debug",
    message: string,
    target: WritableLike = stdout,
  ): void {
    switch (level) {
      case "success":
        writeLine(target, `${theme.successLabel("SUCCESS")} ${message}`);
        break;
      case "info":
        writeLine(target, `${theme.infoLabel("INFO")} ${message}`);
        break;
      case "warn":
        writeLine(target, `${theme.warnLabel("WARN")} ${message}`);
        break;
      case "error":
        writeLine(target, `${theme.errorLabel("ERROR")} ${message}`);
        break;
      case "debug":
        writeLine(target, `${theme.debugLabel("DEBUG")} ${message}`);
        break;
      default:
        writeLine(target, message);
    }
  }

  return {
    raw,
    success(message: string) {
      prefixed("success", message, stdout);
    },
    info(message: string) {
      if (quiet) {
        return;
      }

      prefixed("info", message, stdout);
    },
    warn(message: string) {
      prefixed("warn", message, stderr);
    },
    error(message: string) {
      prefixed("error", message, stderr);
    },
    debug(message: string) {
      if (!verbose) {
        return;
      }

      prefixed("debug", message, stderr);
    },
    keyValue(label: string, value: string, keyValueOptions: KeyValueOptions = {}) {
      const target = keyValueOptions.stderr ? stderr : stdout;
      const force = keyValueOptions.force ?? false;

      if (!force && quiet && !keyValueOptions.stderr) {
        return;
      }

      writeLine(target, `${theme.dim(`${label}:`)} ${value}`);
    },
  };
}
