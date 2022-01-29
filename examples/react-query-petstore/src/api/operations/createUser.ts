import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const createUserOperation = {
  path: "/user",
  method: "post",
  responses: { default: { _tag: "JsonResponse", decoder: schemas.User } },
  parameters: [],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type CreateUserOperationRequestFunction = (args: {
  body: schemas.User;
}) => TaskEither<ApiError, ApiResponse<void>>;
