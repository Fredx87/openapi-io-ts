import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";

export type DeleteUserRequestParameters = {
  username: string;
};

export const deleteUserOperation = {
  path: "/user/{username}",
  method: "delete",
  responses: {
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
  },
  parameters: [
    {
      _tag: "FormParameter",
      explode: false,
      in: "path",
      name: "username",
    },
  ],
  requestDefaultHeaders: {},
} as const;

export type DeleteUserOperationRequestFunction = (args: {
  params: DeleteUserRequestParameters;
}) => TaskEither<ApiError, ApiResponse<void>>;
