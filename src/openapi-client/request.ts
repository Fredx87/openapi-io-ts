import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";
import { HttpRequestAdapter, HttpRequestArgs } from "./httpRequestAdapter";
import { RequestDefinition } from "./requestDefinition";
import { parseResponse } from "./responseParser";
import { buildUrl } from "./urlBuilder";

export type RequestParameters = Record<string, unknown>;

export function request<ReturnType>(
  definition: RequestDefinition<ReturnType>,
  requestParameters: RequestParameters,
  requestBody: unknown,
  requestAdapter: HttpRequestAdapter
): TE.TaskEither<ApiError, ReturnType> {
  const {
    path,
    method,
    parametersDefinitions,
    successfulResponse,
  } = definition;
  const url = buildUrl(path, requestParameters, parametersDefinitions);

  const requestArgs: HttpRequestArgs = {
    url,
    method,
    body:
      definition.body === "json" ? JSON.stringify(requestBody) : requestBody,
    headers: requestHeaders(definition),
  };

  return pipe(
    TE.tryCatch(
      () => requestAdapter(requestArgs),
      (e): RequestError => ({ type: "RequestError", error: E.toError(e) })
    ),
    TE.chainW((response) =>
      TE.fromEither(parseResponse(response, successfulResponse))
    )
  );
}

export interface RequestError {
  type: "RequestError";
  error: Error;
}

export interface HttpError {
  type: "HttpError";
  code: number;
  data: string;
}

export interface DecoderError {
  type: "DecoderError";
  errors: t.Errors;
}

export interface JsonParseError {
  type: "JsonParseError";
  error: Error;
}

export type ApiError = RequestError | HttpError | DecoderError | JsonParseError;

function requestHeaders(
  definition: RequestDefinition<unknown>
): Record<string, string> {
  const res: Record<string, string> = {};

  if (definition.successfulResponse?._tag === "JsonResponse") {
    res["Accept"] = "application/json";
  }

  if (definition.body === "json") {
    res["Content-Type"] = "application/json";
  }

  return res;
}
