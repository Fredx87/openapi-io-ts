import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type UpdateUserRequestParameters = {
  username: string;
};

export const updateUserOperation = {
  path: "/user/{username}",
  method: "put",
  responses: { default: { _tag: "EmptyResponse" } },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "username",
    },
  ],
  requestDefaultHeaders: { "Content-Type": "application/json" },
  body: {
    _tag: "JsonBody",
  },
} as const;

export type UpdateUserOperationRequestFunction = (args: {
  params: UpdateUserRequestParameters;
  body: schemas.User;
}) => TaskEither<ApiError, ApiResponse<void>>;
