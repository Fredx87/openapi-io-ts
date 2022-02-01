import { ParsedParameter } from "../parser/parameter/parseParameter";

export function generateOperationParameter(parameter: ParsedParameter): string {
  const baseParameter = `        in: "${parameter.in}",
        name: "${parameter.name}"
  `;

  switch (parameter._tag) {
    case "ParsedJsonParameter": {
      return `{
        _tag: "JsonParameter",
        ${baseParameter}
      }`;
    }
    case "ParsedFormParameter": {
      return ` {
        _tag: "FormParameter",
        explode: ${parameter.explode ? "true" : "false"},
        ${baseParameter}
      }`;
    }
  }
}
