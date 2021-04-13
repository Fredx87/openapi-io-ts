import * as t from "io-ts";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const getInventoryOperation: Operation = {
  path: "/store/inventory",
  method: "get",
  responses: { "200": { _tag: "JsonResponse", decoder: t.UnknownRecord } },
  parameters: [],
  requestDefaultHeaders: {},
};

export const getInventory = (
  requestAdapter: HttpRequestAdapter
) => (): TaskEither<ApiError, ApiResponse<Record<string, unknown>>> =>
  request(getInventoryOperation, {}, undefined, requestAdapter);
