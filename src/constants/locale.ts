export enum LocaleEnum {
  ZhCN = "zh-CN",
  EnUS = "en-US",
}

export const LOCALES = Object.freeze(Object.values(LocaleEnum)) as readonly `${LocaleEnum}`[];
