import { HttpRequestAdapter } from "./httpRequestAdapter";
import { Operation } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

export interface RequestFunctionArgs {
  params?: Record<string, unknown>;
  body?: unknown;
}

export type RequestFunction<Args extends RequestFunctionArgs, ReturnType> = (
  args?: Args
) => TE.TaskEither<ApiError, ApiResponse<ReturnType>>;

export const requestFunctionBuilder =
  <Args extends RequestFunctionArgs, ReturnType>(
    operation: Operation,
    requestAdapter: HttpRequestAdapter
  ): RequestFunction<Args, ReturnType> =>
  (args) =>
    pipe(
      prepareRequest(operation, args?.params ?? {}, args?.body),
      TE.chain(({ url, init }) => performRequest(url, init, requestAdapter)),
      TE.chain((response) => parseResponse(response, operation.responses))
    );

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
