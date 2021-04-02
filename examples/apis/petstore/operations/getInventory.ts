import * as t from "io-ts";
import {
  RequestDefinition,
  HttpRequestAdapter,
  ApiError,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const getInventoryRequestDefinition: RequestDefinition<
  Record<string, unknown>
> = {
  path: "/store/inventory",
  method: "get",
  successfulResponse: { _tag: "JsonResponse", decoder: t.UnknownRecord },
  parametersDefinitions: {},
};

export const getInventory = (
  requestAdapter: HttpRequestAdapter
) => (): TaskEither<ApiError, Record<string, unknown>> =>
  request(getInventoryRequestDefinition, {}, undefined, requestAdapter);
