import { HttpRequestAdapter } from "./httpRequestAdapter";
import { Operation } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

export type RequestFunctionArgs =
  | {
      params?: Record<string, unknown>;
      body?: unknown;
    }
  | undefined;

export type RequestFunction<Args extends RequestFunctionArgs, T> = (
  ...params: undefined extends Args ? [args?: Args] : [args: Args]
) => TE.TaskEither<ApiError, ApiResponse<T>>;

export const requestFunctionBuilder =
  <Args extends RequestFunctionArgs, T>(
    operation: Operation,
    requestAdapter: HttpRequestAdapter
  ): RequestFunction<Args, T> =>
  (...params) => {
    const [args] = params;

    return pipe(
      prepareRequest(operation, args?.params ?? {}, args?.body),
      TE.chain(({ url, init }) => performRequest(url, init, requestAdapter)),
      TE.chain((response) => parseResponse(response, operation.responses))
    );
  };

function performRequest(
  url: string,
  init: RequestInit,
  requestAdapter: HttpRequestAdapter
): TE.TaskEither<ApiError, Response> {
  return TE.tryCatch(
    () => requestAdapter(url, init),
    (e) => requestError(E.toError(e))
  );
}
