/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { ParsedParameter } from "../parser/parameter";

export function generateParameterDefinition(
  parameter: ParsedParameter
): string {
  const { in: paramIn, defaultValue } = parameter;

  return `{
        in: "${paramIn}",
        ${defaultValue ? `defaultValue: ${defaultValue}` : ""}
    }`;
}
