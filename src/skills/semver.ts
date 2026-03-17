type ParsedVersion = [major: number, minor: number, patch: number];

function parseVersion(value: unknown): ParsedVersion | null {
  const match = String(value ?? "")
    .trim()
    .match(/^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/);

  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const leftPart = left[index] ?? 0;
    const rightPart = right[index] ?? 0;

    if (leftPart > rightPart) {
      return 1;
    }

    if (leftPart < rightPart) {
      return -1;
    }
  }

  return 0;
}

export function doesVersionSatisfy(range: unknown, version: unknown): boolean {
  const targetVersion = parseVersion(version);

  if (!targetVersion) {
    return false;
  }

  const match = String(range ?? "")
    .trim()
    .match(/^(\^|~|>=|<=|>|<)?\s*(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);

  if (!match) {
    return false;
  }

  const operator = match[1] ?? "=";
  const baseline = parseVersion(match[2]);

  if (!baseline) {
    return false;
  }

  const comparison = compareVersions(targetVersion, baseline);

  switch (operator) {
    case "=":
      return comparison === 0;
    case ">":
      return comparison > 0;
    case ">=":
      return comparison >= 0;
    case "<":
      return comparison < 0;
    case "<=":
      return comparison <= 0;
    case "^":
      return comparison >= 0 && targetVersion[0] === baseline[0];
    case "~":
      return (
        comparison >= 0 && targetVersion[0] === baseline[0] && targetVersion[1] === baseline[1]
      );
    default:
      return false;
  }
}
