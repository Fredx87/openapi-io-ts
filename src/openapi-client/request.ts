import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import * as t from "io-ts";
import { ApiDefinition, RequestParams } from "./apiDefinition";
import { HttpRequestArgs, HttpRequestHandler } from "./httpRequestHandler";
import { parseResponse } from "./responseParser";
import { buildUrl } from "./urlBuilder";

export function request<ReturnType>(
  api: ApiDefinition<ReturnType>,
  requestParams: RequestParams,
  body: unknown,
  requestHandler: HttpRequestHandler
): TE.TaskEither<ApiError, ReturnType> {
  const { path, method, params: apiParams, responseDecoder } = api;

  const url = buildUrl(path, requestParams, apiParams);

  const requestArgs: HttpRequestArgs = {
    url,
    method,
    body,
  };

  return pipe(
    TE.tryCatch(
      () => requestHandler(requestArgs),
      (e): RequestError => ({ type: "RequestError", error: E.toError(e) })
    ),
    TE.chainW((response) =>
      TE.fromEither(parseResponse(response, responseDecoder))
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
