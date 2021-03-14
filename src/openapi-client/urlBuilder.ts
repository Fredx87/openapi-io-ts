import { ParametersDefinitions } from "./parameter";
import { RequestParameters } from "./request";

export function buildUrl(
  path: string,
  requestParameters: RequestParameters,
  parametersDefinitions: ParametersDefinitions
): string {
  let returnPath = path;
  const searchParams = new URLSearchParams();

  Object.entries(parametersDefinitions).forEach(
    ([name, parameterDefinition]) => {
      const value = stringifyParameterValue(
        requestParameters[name] ?? parametersDefinitions.defaultValue
      );

      if (parameterDefinition.in === "path") {
        returnPath = returnPath.replace(`{${name}}`, value);
      } else if (parameterDefinition.in === "query") {
        searchParams.append(name, value);
      }
    }
  );

  const queryString = searchParams.toString() && `?${searchParams.toString()}`;

  return returnPath + queryString;
}

function stringifyParameterValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
