import { HttpRequestAdapter } from "./httpRequestAdapter";
import { Operation } from "../model";
import { ApiError, requestError } from "./apiError";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { prepareRequest } from "./prepareRequest";
import { parseResponse } from "./parseResponse";
import { ApiResponse } from "./apiResponse";

export function request<ReturnType>(
  operation: Operation,
  requestParameters: Record<string, unknown>,
  requestBody: unknown,
  requestAdapter: HttpRequestAdapter
): TE.TaskEither<ApiError, ApiResponse<ReturnType>> {
  return pipe(
    prepareRequest(operation, requestParameters, requestBody),
    TE.chain((args) => performRequest(args, requestAdapter)),
    TE.chain((response) => parseResponse(response, operation.responses))
  );
}

function performRequest(
  req: Request,
  requestAdapter: HttpRequestAdapter
): TE.TaskEither<ApiError, Response> {
  return TE.tryCatch(
    () => requestAdapter(req),
    (e) => requestError(E.toError(e))
  );
}
