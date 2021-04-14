import * as schemas from "../components/schemas";
import * as parameters from "../components/parameters";
import {
  Operation,
  HttpRequestAdapter,
  ApiError,
  ApiResponse,
  request,
} from "openapi-io-ts/dist/runtime";
import { TaskEither } from "fp-ts/TaskEither";

export type UpdateUserRequestParameters = {
  username: string;
};

export const updateUserOperation: Operation = {
  path: "/user/{username}",
  method: "put",
  responses: {
    "400": { _tag: "EmptyResponse" },
    "404": { _tag: "EmptyResponse" },
  },
  parameters: [parameters.username],
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
