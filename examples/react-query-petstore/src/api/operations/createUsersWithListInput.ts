import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export const createUsersWithListInputOperation = {
  path: "/user/createWithList",
  method: "post",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.User },
    default: { _tag: "EmptyResponse" },
  },
  parameters: [],
  requestDefaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type CreateUsersWithListInputOperationRequestFunction = (args: {
  body: Array<schemas.User>;
}) => TaskEither<ApiError, ApiResponse<schemas.User>>;
