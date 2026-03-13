import { createTheme } from "./theme.js";

function writeLine(stream, content = "") {
  stream.write(`${content}\n`);
}

export function createLogger(options = {}) {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const quiet = options.quiet ?? false;
  const verbose = options.verbose ?? false;
  const colorEnabled =
    options.colorEnabled ?? ((stdout.isTTY || stderr.isTTY) && !("NO_COLOR" in process.env));
  const theme = createTheme({ colorEnabled });

  function raw(message, rawOptions = {}) {
    const target = rawOptions.stderr ? stderr : stdout;
    const ignoreQuiet = rawOptions.ignoreQuiet ?? false;

    if (!ignoreQuiet && quiet && !rawOptions.stderr) {
      return;
    }

    writeLine(target, message);
  }

  function prefixed(level, message, target = stdout) {
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
    success(message) {
      prefixed("success", message, stdout);
    },
    info(message) {
      if (quiet) {
        return;
      }

      prefixed("info", message, stdout);
    },
    warn(message) {
      prefixed("warn", message, stderr);
    },
    error(message) {
      prefixed("error", message, stderr);
    },
    debug(message) {
      if (!verbose) {
        return;
      }

      prefixed("debug", message, stderr);
    },
    keyValue(label, value, keyValueOptions = {}) {
      const target = keyValueOptions.stderr ? stderr : stdout;
      const force = keyValueOptions.force ?? false;

      if (!force && quiet && !keyValueOptions.stderr) {
        return;
      }

      writeLine(target, `${theme.dim(`${label}:`)} ${value}`);
    }
  };
}
