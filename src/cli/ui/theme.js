const ANSI = {
  reset: "\u001B[0m",
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  red: "\u001B[31m",
  green: "\u001B[32m",
  yellow: "\u001B[33m",
  blue: "\u001B[34m"
};

function wrap(open, enabled, value) {
  if (!enabled) {
    return value;
  }

  return `${open}${value}${ANSI.reset}`;
}

export function createTheme({ colorEnabled }) {
  return {
    successLabel: (value) => wrap(`${ANSI.bold}${ANSI.green}`, colorEnabled, value),
    infoLabel: (value) => wrap(`${ANSI.bold}${ANSI.blue}`, colorEnabled, value),
    warnLabel: (value) => wrap(`${ANSI.bold}${ANSI.yellow}`, colorEnabled, value),
    errorLabel: (value) => wrap(`${ANSI.bold}${ANSI.red}`, colorEnabled, value),
    debugLabel: (value) => wrap(`${ANSI.bold}${ANSI.dim}`, colorEnabled, value),
    dim: (value) => wrap(ANSI.dim, colorEnabled, value)
  };
}
