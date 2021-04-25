import {
  ApiError,
  ApiResponse,
  HttpRequestAdapter,
  Operation,
  request,
} from "@openapi-io-ts/runtime";
import { TaskEither } from "fp-ts/TaskEither";
import * as schemas from "../components/schemas";

export type UpdateUserRequestParameters = {
  username: string;
};

export const updateUserOperation: Operation = {
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
};

export const updateUser = (requestAdapter: HttpRequestAdapter) => (
  params: UpdateUserRequestParameters,
  body: schemas.User
): TaskEither<ApiError, ApiResponse<void>> =>
  request(updateUserOperation, params, body, requestAdapter);
