import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";

export const getInventoryOperation = {
  path: "/store/inventory",
  method: "get",
  responses: { "200": { _tag: "JsonResponse", decoder: t.UnknownRecord } },
  parameters: [],
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type GetInventoryOperationRequestFunction = () => TaskEither<
  ApiError,
  ApiResponse<Record<string, unknown>>
>;
