export enum AnsiCodeEnum {
  Reset = "\u001B[0m",
  Bold = "\u001B[1m",
  Dim = "\u001B[2m",
  Red = "\u001B[31m",
  Green = "\u001B[32m",
  Yellow = "\u001B[33m",
  Blue = "\u001B[34m",
}

export const ANSI = Object.freeze({
  reset: AnsiCodeEnum.Reset,
  bold: AnsiCodeEnum.Bold,
  dim: AnsiCodeEnum.Dim,
  red: AnsiCodeEnum.Red,
  green: AnsiCodeEnum.Green,
  yellow: AnsiCodeEnum.Yellow,
  blue: AnsiCodeEnum.Blue,
} as const);
