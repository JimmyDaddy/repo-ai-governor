import { ANSI } from "../../constants/ansi-theme.js";
import type { Theme } from "../../types/interfaces/cli-ui.interface.js";

function wrap(open: string, enabled: boolean, value: string): string {
  if (!enabled) {
    return value;
  }

  return `${open}${value}${ANSI.reset}`;
}

export function createTheme({ colorEnabled }: { colorEnabled: boolean }): Theme {
  return {
    successLabel: (value) => wrap(`${ANSI.bold}${ANSI.green}`, colorEnabled, value),
    infoLabel: (value) => wrap(`${ANSI.bold}${ANSI.blue}`, colorEnabled, value),
    warnLabel: (value) => wrap(`${ANSI.bold}${ANSI.yellow}`, colorEnabled, value),
    errorLabel: (value) => wrap(`${ANSI.bold}${ANSI.red}`, colorEnabled, value),
    debugLabel: (value) => wrap(`${ANSI.bold}${ANSI.dim}`, colorEnabled, value),
    dim: (value) => wrap(ANSI.dim, colorEnabled, value),
  };
}
