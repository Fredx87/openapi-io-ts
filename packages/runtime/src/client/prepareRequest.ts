import { Operation, OperationParameter, OperationBody } from "../model";
import * as TE from "fp-ts/TaskEither";
import { ApiError, requestError } from "./apiError";
import { pipe } from "fp-ts/function";
import { OperationParameterIn } from "@openapi-io-ts/core";

interface PrepareRequestResult {
  url: string;
  init: RequestInit;
}

export function prepareRequest(
  operation: Operation,
  requestParameters: Record<string, unknown>,
  requestBody: unknown
): TE.TaskEither<ApiError, PrepareRequestResult> {
  return pipe(
    TE.Do,
    TE.bind("url", () => prepareUrl(operation, requestParameters)),
    TE.bind("headers", () => prepareHeaders(operation, requestParameters)),
    TE.bind("body", () => prepareBody(operation.body, requestBody)),
    TE.map(({ url, headers, body }) => {
      const init: RequestInit = {
        method: operation.method,
        body,
        headers,
      };

      return { url, init };
    })
  );
}

function prepareUrl(
  operation: Operation,
  requestParameters: Record<string, unknown>
): TE.TaskEither<ApiError, string> {
  return pipe(
    TE.Do,
    TE.bind("path", () =>
      preparePath(
        operation.path,
        filterParametersByType("path", operation.parameters),
        requestParameters
      )
    ),
    TE.bind("queryString", () =>
      prepareQueryString(
        filterParametersByType("query", operation.parameters),
        requestParameters
      )
    ),
    TE.map(
      ({ path, queryString }) =>
        `${path}${queryString ? `?${queryString}` : ""}`
    )
  );
}

function preparePath(
  path: string,
  pathParameters: OperationParameter[],
  requestParameters: Record<string, unknown>
): TE.TaskEither<ApiError, string> {
  let res = path;

  for (const parameter of pathParameters) {
    const value = stringifyParameterValue(requestParameters[parameter.name]);
    res = res.replace(`{${parameter.name}}`, value);
  }

  return TE.right(res);
}

function prepareQueryString(
  parameters: OperationParameter[],
  requestParameters: Record<string, unknown>
): TE.TaskEither<ApiError, string> {
  const qs = new URLSearchParams();

  for (const parameter of parameters) {
    const encodeResult = encodeRequestParameter(
      parameter.name,
      parameter,
      requestParameters[parameter.name]
    );

    for (const [n, v] of encodeResult) {
      qs.append(n, v);
    }
  }

  return TE.right(qs.toString());
}

function encodeRequestParameter(
  name: string,
  parameter: OperationParameter,
  value: unknown
): Array<[name: string, value: string]> {
  if (value == null) {
    return [];
  }

  switch (parameter._tag) {
    case "JsonParameter":
      return [[name, JSON.stringify(value)]];
    case "FormParameter":
      return encodeFormParameter(name, parameter.explode, value);
  }
}

function encodeFormParameter(
  name: string,
  explode: boolean,
  value: unknown
): Array<[name: string, value: string]> {
  if (Array.isArray(value)) {
    if (explode) {
      return value.map((v) => [name, stringifyParameterValue(v)]);
    } else {
      return [[name, value.map(stringifyParameterValue).join(",")]];
    }
  }

  if (typeof value === "object" && value != null) {
    return encodeFormObjectParameter(name, explode, value);
  }

  return [[name, stringifyParameterValue(value)]];
}

function encodeFormObjectParameter(
  name: string,
  explode: boolean,
  // eslint-disable-next-line @typescript-eslint/ban-types
  value: object
): Array<[name: string, value: string]> {
  if (explode) {
    return Object.entries(value).map(([k, v]) => [
      k,
      stringifyParameterValue(v),
    ]);
  } else {
    return [
      [
        name,
        Object.entries(value)
          .flatMap(([k, v]) => [k, stringifyParameterValue(v)])
          .join(","),
      ],
    ];
  }
}

function prepareHeaders(
  operation: Operation,
  requestParameters: Record<string, unknown>
): TE.TaskEither<ApiError, Record<string, string>> {
  const headers: Record<string, string> = {};

  for (const parameter of filterParametersByType(
    "header",
    operation.parameters
  )) {
    headers[parameter.name] = stringifyParameterValue(
      requestParameters[parameter.name]
    );
  }

  return TE.right({ ...operation.requestDefaultHeaders, ...headers });
}

function prepareBody(
  body: OperationBody | undefined,
  requestBody: unknown
): TE.TaskEither<ApiError, BodyInit | null> {
  if (body == null) {
    return TE.right(null);
  }

  switch (body._tag) {
    case "TextBody": {
      return TE.right(requestBody as string);
    }
    case "BinaryBody": {
      return TE.right(requestBody as Blob);
    }
    case "JsonBody": {
      return TE.right(JSON.stringify(requestBody));
    }
    case "FormBody": {
      return prepareFormBody(requestBody);
    }
    case "MultipartBody": {
      return prepareMultipartBody(requestBody);
    }
  }
}

function prepareFormBody(
  requestBody: unknown
): TE.TaskEither<ApiError, URLSearchParams> {
  if (typeof requestBody === "object" && requestBody != null) {
    const res = new URLSearchParams();

    for (const [k, v] of encodeFormObjectParameter("", true, requestBody)) {
      res.append(k, v);
    }

    return TE.right(res);
  }

  return pipe(
    new Error(
      `requestBody for a form encoded body should be a not null object, received ${typeof requestBody}`
    ),
    requestError,
    TE.left
  );
}

function prepareMultipartBody(
  requestBody: unknown
): TE.TaskEither<ApiError, FormData> {
  if (typeof requestBody === "object" && requestBody != null) {
    const formData = new FormData();

    for (const [name, value] of Object.entries(requestBody)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      formData.append(name, value);
    }

    return TE.right(formData);
  }

  return pipe(
    new Error(
      `requestBody for a multipart form body should be a not null object, received ${typeof requestBody}`
    ),
    requestError,
    TE.left
  );
}

function filterParametersByType(
  type: OperationParameterIn,
  parameters: readonly OperationParameter[]
): OperationParameter[] {
  return parameters.filter((p) => p.in === type);
}

function stringifyParameterValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}
