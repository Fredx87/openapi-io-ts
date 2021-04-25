import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as t from "io-ts";

export const getInventoryOperation: Operation = {
  path: "/store/inventory",
  method: "get",
  responses: { "200": { _tag: "JsonResponse", decoder: t.UnknownRecord } },
  parameters: [],
  requestDefaultHeaders: { Accept: "application/json" },
};

export const getInventory = (
  requestAdapter: HttpRequestAdapter
) => (): TaskEither<ApiError, ApiResponse<Record<string, unknown>>> =>
  request(getInventoryOperation, {}, undefined, requestAdapter);
