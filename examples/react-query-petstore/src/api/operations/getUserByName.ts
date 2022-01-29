import type { ApiError, ApiResponse } from "@openapi-io-ts/runtime";
import type { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type GetUserByNameRequestParameters = {
  username: string;
};

export const getUserByNameOperation = {
  path: "/user/{username}",
  method: "get",
  responses: {
    "200": { _tag: "JsonResponse", decoder: schemas.User },
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
  requestDefaultHeaders: { Accept: "application/json" },
} as const;

export type GetUserByNameOperationRequestFunction = (args: {
  params: GetUserByNameRequestParameters;
}) => TaskEither<ApiError, ApiResponse<schemas.User>>;
