export interface ParameterDefinition {
  in: "query" | "header" | "path" | "cookie";
  defaultValue?: unknown;
}

export type ParametersDefinitions = Record<string, ParameterDefinition>;
