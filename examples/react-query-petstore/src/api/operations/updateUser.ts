import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  OperationArgs,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
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

export interface UpdateUserOperationArgs extends OperationArgs {
  requestParameters: UpdateUserRequestParameters;
  requestBody: schemas.User;
}

export const updateUserBuilder =
  (requestAdapter: HttpRequestAdapter) =>
  (
    operation: typeof updateUserOperation,
    args: UpdateUserOperationArgs
  ): TaskEither<ApiError, ApiResponse<void>> =>
    request({ requestAdapter, operation, ...args });
