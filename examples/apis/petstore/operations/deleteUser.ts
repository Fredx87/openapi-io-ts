import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type DeleteUserRequestParameters = {
  username: string;
};

export const deleteUserOperation: Operation = {
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
};

export const deleteUser = (requestAdapter: HttpRequestAdapter) => (
  params: DeleteUserRequestParameters
): TaskEither<ApiError, ApiResponse<void>> =>
  request(deleteUserOperation, params, undefined, requestAdapter);
