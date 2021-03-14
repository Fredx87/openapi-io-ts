import { ParsedParameterObject } from "../parser/parameter";

export function generateParameterDefinition(
  parameter: ParsedParameterObject
): string {
  const { in: paramIn, defaultValue } = parameter;

  return `{
        in: "${paramIn}",
        ${defaultValue ? `defaultValue: ${defaultValue}` : ""}
    }`;
}
