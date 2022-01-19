import { HttpRequestAdapter } from "./httpRequestAdapter";
import { OperationArgs, Operation } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

interface RequestArgs extends OperationArgs {
  operation: Operation;
  requestAdapter: HttpRequestAdapter;
}

export function request<ReturnType>({
  operation,
  requestAdapter,
  requestParameters = {},
  requestBody,
}: RequestArgs): TE.TaskEither<ApiError, ApiResponse<ReturnType>> {
  return pipe(
    prepareRequest(operation, requestParameters, requestBody),
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
