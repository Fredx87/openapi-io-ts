import { HttpRequestAdapter } from "./httpRequestAdapter";
import { Operation, OperationArgs, OperationTypes } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

export type RequestFunction<OpArgs, ReturnType> = (
  args: OpArgs extends OperationArgs<infer RequestParameters, infer RequestBody>
    ? OperationArgs<RequestParameters, RequestBody>
    : never
) => TE.TaskEither<ApiError, ApiResponse<ReturnType>>;

export type RequestFunctionBuilder = <OpArgs, ReturnType>(
  operation: Operation,
  requestAdapter: HttpRequestAdapter
) => RequestFunction<OpArgs, ReturnType>;

export type RequestFunctionsMap<OpTypesMap> = OpTypesMap extends {
  [OperationId in keyof OpTypesMap]: OperationTypes<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _A,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _B,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    infer _C
  >;
}
  ? {
      [OperationId in keyof OpTypesMap]: RequestFunction<
        OpTypesMap[OperationId]["args"],
        OpTypesMap[OperationId]["returnType"]
      >;
    }
  : never;

export const requestFunctionBuilder: RequestFunctionBuilder =
  (operation, requestAdapter) => (args) =>
    pipe(
      prepareRequest(operation, args.params ?? {}, args.body),
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
