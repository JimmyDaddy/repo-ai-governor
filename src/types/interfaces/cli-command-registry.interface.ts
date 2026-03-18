export interface OptionDefinition {
  long: string;
  key: string;
  valueName?: string;
  description: string;
  type: "string" | "boolean";
  multiple?: boolean;
}

export interface ArgumentDefinition {
  name: string;
  description: string;
}

export interface CommandDefinition {
  name: string;
  description: string;
  arguments?: ArgumentDefinition[];
  options: OptionDefinition[];
}
