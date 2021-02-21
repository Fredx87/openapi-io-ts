import { ApiParams, RequestParams } from "./apiDefinition";

export function buildUrl(
  path: string,
  requestParams: RequestParams,
  apiParams: ApiParams
): string {
  let returnPath = path;
  const searchParams = new URLSearchParams();

  Object.entries(apiParams).forEach(([name, apiParam]) => {
    const value = stringifyParameterValue(
      requestParams[name] ?? apiParam.defaultValue
    );

    if (apiParam.in === "path") {
      returnPath = returnPath.replace(`{${name}}`, value);
    } else if (apiParam.in === "query") {
      searchParams.append(name, value);
    }
  });

  const queryString = searchParams.toString() && `?${searchParams.toString()}`;

  return returnPath + queryString;
}

function stringifyParameterValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}
