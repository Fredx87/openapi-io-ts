import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
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
