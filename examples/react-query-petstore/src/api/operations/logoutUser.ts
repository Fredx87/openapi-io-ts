import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export const logoutUserOperation: Operation = {
  path: "/user/logout",
  method: "get",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: {},
};

export const logoutUser = (
  requestAdapter: HttpRequestAdapter
) => (): TaskEither<ApiError, ApiResponse<void>> =>
  request(logoutUserOperation, {}, undefined, requestAdapter);
