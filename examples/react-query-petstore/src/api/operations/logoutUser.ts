import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";

export const logoutUserOperation = {
  path: "/user/logout",
  method: "get",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [],
  requestDefaultHeaders: {},
} as const;

export type LogoutUserOperationRequestFunction = () => TaskEither<
  ApiError,
  ApiResponse<void>
>;
