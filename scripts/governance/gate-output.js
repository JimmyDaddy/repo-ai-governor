const ANSI = {
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  blue: '\u001B[34m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  red: '\u001B[31m',
};

/**
 * Returns whether ANSI color output is allowed.
 * @returns {boolean}
 */
function isColorEnabled() {
  if (!process.stdout.isTTY) {
    return false;
  }

  if (process.env.NO_COLOR) {
    return false;
  }

  return true;
}

/**
 * Applies a color wrapper when terminal supports colors.
 * @param {string} value Plain text.
 * @param {string} colorCode ANSI color code.
 * @returns {string}
 */
function colorize(value, colorCode) {
  if (!isColorEnabled()) {
    return value;
  }

  return `${ANSI.bold}${colorCode}${value}${ANSI.reset}`;
}

/**
 * Builds a stable gate label.
 * @param {string} gateName Gate name.
 * @returns {string}
 */
function toGateLabel(gateName) {
  return `[gate:${gateName}]`;
}

/**
 * Prints one gate info line.
 * @param {string} gateName Gate name.
 * @param {string} message Message to print.
 */
export function gateInfo(gateName, message) {
  console.info(`${colorize(toGateLabel(gateName), ANSI.blue)} ${message}`);
}

/**
 * Prints one gate success line.
 * @param {string} gateName Gate name.
 * @param {string} message Message to print.
 */
export function gatePass(gateName, message) {
  console.info(`${colorize(toGateLabel(gateName), ANSI.green)} ${message}`);
}

/**
 * Prints one gate warning line.
 * @param {string} gateName Gate name.
 * @param {string} message Message to print.
 */
export function gateWarn(gateName, message) {
  console.warn(`${colorize(toGateLabel(gateName), ANSI.yellow)} ${message}`);
}

/**
 * Prints one gate failure line.
 * @param {string} gateName Gate name.
 * @param {string} message Message to print.
 */
export function gateFail(gateName, message) {
  console.error(`${colorize(toGateLabel(gateName), ANSI.red)} ${message}`);
}
