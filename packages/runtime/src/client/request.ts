import { HttpRequestAdapter } from "./httpRequestAdapter";
import { OperationArgs, Operation, OperationTypes } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

export type RequestFunction<RequestParameters, RequestBody, ReturnType> = (
  args: OperationArgs<RequestParameters, RequestBody>
) => TE.TaskEither<ApiError, ApiResponse<ReturnType>>;

export type MappedOperationRequestFunction<Operations, OperationsTypesMap> =
  OperationsTypesMap extends Record<
    keyof Operations,
    OperationTypes<infer _A, infer _B, infer _C>
  >
    ? {
        [Name in keyof Operations]: RequestFunction<
          OperationsTypesMap[Name]["args"]["params"],
          OperationsTypesMap[Name]["args"]["body"],
          OperationsTypesMap[Name]["returnType"]
        >;
      }
    : never;

export function request<RequestParameters, RequestBody, ReturnType>(
  operation: Operation,
  requestAdapter: HttpRequestAdapter
): RequestFunction<RequestParameters, RequestBody, ReturnType> {
  return (args) =>
    pipe(
      prepareRequest(operation, args.params ?? {}, args.body),
      TE.chain(({ url, init }) => performRequest(url, init, requestAdapter)),
      TE.chain((response) => parseResponse(response, operation.responses))
    );
}

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
